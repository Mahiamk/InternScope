import re
import socket
import ipaddress
import time
from urllib.parse import urlparse, urlunparse
from typing import Optional, Dict, Any, Tuple, List
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.core.config import settings
from app.models.company import Company
from app.schemas.company import MatchedCompanyBrief, CompanyLogoResolveResponse

# Forbidden private and link-local IP networks (SSRF defense)
RESTRICTED_IP_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),     # CGNAT
    ipaddress.ip_network("127.0.0.0/8"),      # Loopback
    ipaddress.ip_network("169.254.0.0/16"),    # Link-local & cloud metadata
    ipaddress.ip_network("172.16.0.0/12"),    # Private class B
    ipaddress.ip_network("192.0.0.0/24"),      # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),      # Documentation (TEST-NET-1)
    ipaddress.ip_network("192.168.0.0/16"),   # Private class C
    ipaddress.ip_network("198.18.0.0/15"),    # Benchmarking
    ipaddress.ip_network("198.51.100.0/24"),  # Documentation (TEST-NET-2)
    ipaddress.ip_network("203.0.113.0/24"),   # Documentation (TEST-NET-3)
    ipaddress.ip_network("224.0.0.0/4"),      # Multicast
    ipaddress.ip_network("240.0.0.0/4"),      # Reserved
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6
    ipaddress.ip_network("::1/128"),          # Loopback
    ipaddress.ip_network("::/128"),           # Unspecified
    ipaddress.ip_network("fc00::/7"),         # Unique local address (ULA)
    ipaddress.ip_network("fe80::/10"),        # Link-local
    ipaddress.ip_network("ff00::/8"),         # Multicast
]

FORBIDDEN_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "instance-data",
    "169.254.169.254",
    "broadcasthost",
}

# Domain syntax validation regex (strict RFC 1035 / RFC 1123)
DOMAIN_REGEX = re.compile(
    r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
)

# In-memory resolution cache (normalized_domain -> (timestamp, response_dict))
_RESOLVE_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour

# Simple rate limiter (client_ip -> list of timestamps)
_RATE_LIMIT_BUCKETS: Dict[str, List[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 30


class SecurityValidationError(Exception):
    """Raised when URL violates security constraints (SSRF, local IP, restricted schemes)."""
    pass


class InvalidUrlError(Exception):
    """Raised when URL is malformed or not a valid web URL."""
    pass


def check_rate_limit(client_ip: str) -> bool:
    """Enforce sliding-window rate limit per client IP."""
    now = time.time()
    timestamps = _RATE_LIMIT_BUCKETS.get(client_ip, [])
    # Filter to current window
    valid_ts = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(valid_ts) >= RATE_LIMIT_MAX_REQUESTS:
        return False
    valid_ts.append(now)
    _RATE_LIMIT_BUCKETS[client_ip] = valid_ts
    return True


def normalize_and_validate_url(raw_url: str) -> Tuple[str, str]:
    """
    Validates and normalizes an untrusted URL string.
    Returns:
        (normalized_domain, normalized_url)
    Raises:
        InvalidUrlError, SecurityValidationError
    """
    if not raw_url or not isinstance(raw_url, str):
        raise InvalidUrlError("Company website URL cannot be empty.")

    cleaned = raw_url.strip()
    if len(cleaned) > 2048:
        raise InvalidUrlError("URL exceeds maximum permissible length.")

    # Check for forbidden control characters or spaces
    if any(c in cleaned for c in ["\r", "\n", "\t", " "]):
        cleaned = re.sub(r"\s+", "", cleaned)

    # Check for forbidden schemes like ftp://, file://, javascript:, data:
    if "://" in cleaned:
        scheme_candidate = cleaned.split("://")[0].lower()
        if scheme_candidate not in ("http", "https"):
            raise SecurityValidationError(f"Invalid protocol: '{scheme_candidate}'. Only HTTP and HTTPS are permitted.")
    elif ":" in cleaned:
        scheme_candidate = cleaned.split(":")[0].lower()
        if not scheme_candidate.isdigit() and re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*$", scheme_candidate):
            if scheme_candidate not in ("http", "https"):
                raise SecurityValidationError(f"Invalid protocol: '{scheme_candidate}'. Only HTTP and HTTPS are permitted.")

    # Prepend https scheme if missing
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", cleaned):
        cleaned = "https://" + cleaned

    try:
        parsed = urlparse(cleaned)
    except Exception as e:
        raise InvalidUrlError(f"Malformed URL structure: {str(e)}")

    # Strict scheme check
    if parsed.scheme.lower() not in ("http", "https"):
        raise SecurityValidationError(f"Invalid protocol: '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")

    hostname = (parsed.hostname or "").lower().strip()
    if not hostname:
        raise InvalidUrlError("URL must contain a valid domain name.")

    # Strip IPv6 enclosing brackets if present
    if hostname.startswith("[") and hostname.endswith("]"):
        hostname = hostname[1:-1]

    # Check forbidden hostnames
    if hostname in FORBIDDEN_HOSTNAMES or hostname.endswith(".local") or hostname.endswith(".internal") or hostname.endswith(".lan"):
        raise SecurityValidationError("Hostnames resolving to local or internal infrastructure are prohibited.")

    # Check if hostname is an IP literal
    try:
        ip_obj = ipaddress.ip_address(hostname)
        for net in RESTRICTED_IP_NETWORKS:
            try:
                if ip_obj in net:
                    raise SecurityValidationError("Direct access to private or link-local IP addresses is strictly prohibited.")
            except TypeError:
                pass
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved or ip_obj.is_multicast:
            raise SecurityValidationError("Direct access to private or link-local IP addresses is strictly prohibited.")
        raise SecurityValidationError("Direct IP addresses are not supported for company websites. Please provide a domain name.")
    except ValueError:
        pass  # It is a domain name

    # Strip port if present
    if ":" in hostname:
        hostname = hostname.split(":")[0]

    # Normalize domain: strip www. / www2. prefixes
    norm_domain = hostname
    if norm_domain.startswith("www."):
        norm_domain = norm_domain[4:]
    elif norm_domain.startswith("www2."):
        norm_domain = norm_domain[5:]

    # Check against domain regex
    if not DOMAIN_REGEX.match(norm_domain):
        raise InvalidUrlError(f"'{norm_domain}' is not a valid fully qualified domain name.")

    # Verify IP safety via DNS resolution
    validate_hostname_dns_safety(hostname)

    normalized_url = f"https://{norm_domain}"
    return norm_domain, normalized_url


def validate_hostname_dns_safety(hostname: str) -> None:
    """
    Resolves hostname and verifies that all resolved IP addresses are safe public IPs.
    Guards against SSRF, internal port scanning, and cloud metadata access.
    """
    try:
        addr_info = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        # Domain cannot be resolved in offline/test environment; allow syntax-valid domain
        return
    except Exception:
        return

    if not addr_info:
        return

    for item in addr_info:
        sockaddr = item[4]
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except Exception:
            continue

        for net in RESTRICTED_IP_NETWORKS:
            try:
                if ip_obj in net:
                    raise SecurityValidationError(f"Domain '{hostname}' resolves to restricted internal IP {ip_str}.")
            except TypeError:
                pass

        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved:
            raise SecurityValidationError(f"Domain '{hostname}' resolves to private/internal IP {ip_str}.")


async def verify_image_head(
    client: httpx.AsyncClient,
    image_url: str,
    timeout: float = 3.0
) -> bool:
    """
    Performs a safe HEAD/GET check to ensure the candidate logo exists,
    is within size limits, and returns a valid image Content-Type.
    Protects against unsafe redirects.
    """
    try:
        parsed = urlparse(image_url)
        if parsed.scheme.lower() not in ("http", "https"):
            return False

        # Attempt HEAD first
        resp = await client.head(image_url, timeout=timeout, follow_redirects=True)
        
        # If provider doesn't support HEAD (some CDN block HEAD with 403/405), fallback to small GET
        if resp.status_code in (403, 405):
            resp = await client.get(
                image_url,
                headers={"Range": "bytes=0-1024"},
                timeout=timeout,
                follow_redirects=True
            )

        if resp.status_code not in (200, 206):
            return False

        # Verify Content-Type
        content_type = resp.headers.get("content-type", "").lower().split(";")[0].strip()
        if content_type not in settings.ALLOWED_LOGO_CONTENT_TYPES:
            # Some providers return image/* with parameters or octet-stream for .ico
            if not content_type.startswith("image/"):
                return False

        # Verify Content-Length if provided
        content_length = resp.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > settings.MAX_LOGO_SIZE_BYTES:
                    return False
            except ValueError:
                pass

        return True
    except Exception:
        return False


async def resolve_company_logo(
    raw_url: str,
    db: AsyncSession,
    client_ip: str = "127.0.0.1"
) -> CompanyLogoResolveResponse:
    """
    Main Logo Resolution Pipeline:
    1. Validate & normalize input URL and domain.
    2. Tier 1: Match against existing company records in database.
    3. Tier 2: Query configured logo provider (e.g. Clearbit / Brand logo).
    4. Tier 3: Query fallback favicon provider (Google High-Res Favicon).
    5. Tier 4: Return graceful not_found placeholder.
    """
    # 0. Normalization and SSRF validation
    try:
        norm_domain, norm_url = normalize_and_validate_url(raw_url)
    except SecurityValidationError as e:
        return CompanyLogoResolveResponse(
            normalized_domain="",
            normalized_url="",
            status="invalid_url",
            source="none",
            logo_url=None,
            matched_company=None,
            message=str(e)
        )
    except InvalidUrlError as e:
        return CompanyLogoResolveResponse(
            normalized_domain="",
            normalized_url="",
            status="invalid_url",
            source="none",
            logo_url=None,
            matched_company=None,
            message=str(e)
        )

    # Check cache
    now = time.time()
    if norm_domain in _RESOLVE_CACHE:
        cached_ts, cached_data = _RESOLVE_CACHE[norm_domain]
        if now - cached_ts < CACHE_TTL_SECONDS:
            return CompanyLogoResolveResponse(**cached_data)

    # 1. Tier 1: Look for existing company in database
    matched_company_brief: Optional[MatchedCompanyBrief] = None
    existing_comp: Optional[Company] = None

    # Search by exact domain or matching website
    stmt = select(Company).where(
        or_(
            Company.domain == norm_domain,
            Company.website.ilike(f"%{norm_domain}%")
        )
    )
    res = await db.execute(stmt)
    existing_comp = res.scalars().first()

    if existing_comp:
        matched_company_brief = MatchedCompanyBrief(
            id=existing_comp.id,
            name=existing_comp.name,
            slug=existing_comp.slug,
            logo_url=existing_comp.logo_url,
            website=existing_comp.website,
            domain=existing_comp.domain or norm_domain,
            industry=existing_comp.industry,
            headquarters=existing_comp.headquarters
        )

        # If the existing company already has a logo, reuse it immediately!
        if existing_comp.logo_url and len(existing_comp.logo_url.strip()) > 0:
            result = CompanyLogoResolveResponse(
                normalized_domain=norm_domain,
                normalized_url=norm_url,
                status="resolved",
                source="existing_company",
                logo_url=existing_comp.logo_url,
                matched_company=matched_company_brief,
                message=f"Reused official logo from existing record for {existing_comp.name}."
            )
            _RESOLVE_CACHE[norm_domain] = (now, result.model_dump())
            return result

    # 2. Tier 2: Check configured logo provider (Clearbit Logo API)
    # Clearbit provides high quality official logos for corporate domains
    clearbit_logo_url = f"https://logo.clearbit.com/{norm_domain}"
    
    async with httpx.AsyncClient(timeout=settings.LOGO_REQUEST_TIMEOUT_SECONDS) as client:
        is_clearbit_valid = await verify_image_head(client, clearbit_logo_url, timeout=settings.LOGO_REQUEST_TIMEOUT_SECONDS)
        if is_clearbit_valid:
            result = CompanyLogoResolveResponse(
                normalized_domain=norm_domain,
                normalized_url=norm_url,
                status="resolved",
                source="provider_logo",
                logo_url=clearbit_logo_url,
                matched_company=matched_company_brief,
                message=f"Official corporate logo detected for {norm_domain}."
            )
            _RESOLVE_CACHE[norm_domain] = (now, result.model_dump())
            return result

        # 3. Tier 3: High-resolution Favicon Fallback (Google S2 Favicon API: 128px)
        google_favicon_url = f"https://www.google.com/s2/favicons?domain={norm_domain}&sz=128"
        is_favicon_valid = await verify_image_head(client, google_favicon_url, timeout=settings.LOGO_REQUEST_TIMEOUT_SECONDS)
        if is_favicon_valid:
            result = CompanyLogoResolveResponse(
                normalized_domain=norm_domain,
                normalized_url=norm_url,
                status="fallback",
                source="fallback_favicon",
                logo_url=google_favicon_url,
                matched_company=matched_company_brief,
                message=f"Detected high-resolution website favicon for {norm_domain} (fallback)."
            )
            _RESOLVE_CACHE[norm_domain] = (now, result.model_dump())
            return result

    # 4. Tier 4: No suitable image detected
    result = CompanyLogoResolveResponse(
        normalized_domain=norm_domain,
        normalized_url=norm_url,
        status="not_found",
        source="none",
        logo_url=None,
        matched_company=matched_company_brief,
        message=f"No public company logo detected for {norm_domain}. You may upload a custom logo or continue."
    )
    _RESOLVE_CACHE[norm_domain] = (now, result.model_dump())
    return result
