import os
import uuid
import datetime
import hashlib
import hmac
import logging
import urllib.parse
from io import BytesIO
from typing import Optional, Dict, Any, Tuple
from PIL import Image
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

def is_s3_configured() -> bool:
    """Check if S3/Neon storage credentials are fully configured."""
    return bool(
        settings.AWS_ENDPOINT_URL_S3
        and settings.AWS_ENDPOINT_URL_S3.strip()
        and settings.AWS_ACCESS_KEY_ID
        and settings.AWS_ACCESS_KEY_ID.strip()
        and settings.AWS_SECRET_ACCESS_KEY
        and settings.AWS_SECRET_ACCESS_KEY.strip()
    )

def _sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

def _get_signature_key(key: str, date_stamp: str, region_name: str, service_name: str) -> bytes:
    k_date = _sign(("AWS4" + key).encode("utf-8"), date_stamp)
    k_region = _sign(k_date, region_name)
    k_service = _sign(k_region, service_name)
    k_signing = _sign(k_service, "aws4_request")
    return k_signing

async def upload_bytes_to_s3(
    file_bytes: bytes,
    object_key: str,
    content_type: str = "application/octet-stream"
) -> str:
    """
    Upload raw bytes directly to Neon / AWS S3 compatible storage using standard AWS SigV4.
    Returns the public URL to the uploaded object.
    """
    endpoint = (settings.AWS_ENDPOINT_URL_S3 or "").rstrip("/")
    access_key = (settings.AWS_ACCESS_KEY_ID or "").strip()
    secret_key = (settings.AWS_SECRET_ACCESS_KEY or "").strip()
    region = (settings.AWS_REGION or "ap-southeast-1").strip()
    bucket = (settings.S3_BUCKET_NAME or "uploads").strip()

    if not endpoint or not access_key or not secret_key:
        raise ValueError("Neon S3 storage credentials are not configured in settings.")

    now = datetime.datetime.now(datetime.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")

    parsed_url = urllib.parse.urlparse(endpoint)
    host = parsed_url.netloc

    # Clean object key
    clean_key = object_key.lstrip("/")
    canonical_uri = f"/{bucket}/{clean_key}"
    payload_hash = hashlib.sha256(file_bytes).hexdigest()

    headers = {
        "host": host,
        "x-amz-date": amz_date,
        "x-amz-content-sha256": payload_hash,
        "content-type": content_type,
    }

    signed_headers_list = sorted(headers.keys())
    signed_headers = ";".join(signed_headers_list)
    canonical_headers = "".join(f"{h}:{headers[h]}\n" for h in signed_headers_list)

    canonical_request = f"PUT\n{canonical_uri}\n\n{canonical_headers}\n{signed_headers}\n{payload_hash}"
    algorithm = "AWS4-HMAC-SHA256"
    credential_scope = f"{date_stamp}/{region}/s3/aws4_request"
    string_to_sign = f"{algorithm}\n{amz_date}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()}"

    signing_key = _get_signature_key(secret_key, date_stamp, region, "s3")
    signature = hmac.new(signing_key, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()

    headers["Authorization"] = f"{algorithm} Credential={access_key}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"

    target_url = f"{endpoint}/{bucket}/{clean_key}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.put(target_url, headers=headers, content=file_bytes)
        if resp.status_code not in (200, 201):
            logger.error(f"S3 upload failed ({resp.status_code}): {resp.text}")
            raise RuntimeError(f"Storage upload failed ({resp.status_code}): {resp.text}")

    # Return public URL
    return target_url

async def delete_object_from_s3(object_key_or_url: str) -> bool:
    """Delete an object from S3/Neon storage."""
    if not is_s3_configured():
        return False

    endpoint = (settings.AWS_ENDPOINT_URL_S3 or "").rstrip("/")
    access_key = (settings.AWS_ACCESS_KEY_ID or "").strip()
    secret_key = (settings.AWS_SECRET_ACCESS_KEY or "").strip()
    region = (settings.AWS_REGION or "ap-southeast-1").strip()
    bucket = (settings.S3_BUCKET_NAME or "uploads").strip()

    # Extract clean key if full URL passed
    clean_key = object_key_or_url
    prefix = f"{endpoint}/{bucket}/"
    if clean_key.startswith(prefix):
        clean_key = clean_key[len(prefix):]
    clean_key = clean_key.lstrip("/")

    now = datetime.datetime.now(datetime.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")

    host = urllib.parse.urlparse(endpoint).netloc
    canonical_uri = f"/{bucket}/{clean_key}"
    payload_hash = hashlib.sha256(b"").hexdigest()

    headers = {
        "host": host,
        "x-amz-date": amz_date,
        "x-amz-content-sha256": payload_hash,
    }

    signed_headers_list = sorted(headers.keys())
    signed_headers = ";".join(signed_headers_list)
    canonical_headers = "".join(f"{h}:{headers[h]}\n" for h in signed_headers_list)

    canonical_request = f"DELETE\n{canonical_uri}\n\n{canonical_headers}\n{signed_headers}\n{payload_hash}"
    algorithm = "AWS4-HMAC-SHA256"
    credential_scope = f"{date_stamp}/{region}/s3/aws4_request"
    string_to_sign = f"{algorithm}\n{amz_date}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()}"

    signing_key = _get_signature_key(secret_key, date_stamp, region, "s3")
    signature = hmac.new(signing_key, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()
    headers["Authorization"] = f"{algorithm} Credential={access_key}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"

    target_url = f"{endpoint}/{bucket}/{clean_key}"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.delete(target_url, headers=headers)
            return resp.status_code in (200, 204)
    except Exception as exc:
        logger.warning(f"Failed to delete S3 object {clean_key}: {exc}")
        return False

async def process_and_upload_image(
    contents: bytes,
    original_filename: str,
    content_type: str
) -> Dict[str, Any]:
    """
    Sanitize image (verify integrity, strip EXIF privacy metadata) and upload to
    Neon S3 storage (or fallback to local disk).
    """
    # 1. Pillow verification & EXIF sanitization
    image = Image.open(BytesIO(contents))
    image.verify()
    image = Image.open(BytesIO(contents))

    # Strip EXIF metadata to protect student privacy
    data = list(image.getdata())
    image_without_exif = Image.new(image.mode, image.size)
    image_without_exif.putdata(data)

    ext = "jpg"
    save_format = "JPEG"
    final_content_type = "image/jpeg"
    if image.format == "PNG":
        ext = "png"
        save_format = "PNG"
        final_content_type = "image/png"
    elif image.format == "WEBP":
        ext = "webp"
        save_format = "WEBP"
        final_content_type = "image/webp"

    buffer = BytesIO()
    image_without_exif.save(buffer, format=save_format)
    sanitized_bytes = buffer.getvalue()
    random_filename = f"{uuid.uuid4().hex}.{ext}"

    # 2. Try S3 upload if configured
    if is_s3_configured():
        try:
            s3_key = f"images/{random_filename}"
            s3_url = await upload_bytes_to_s3(
                file_bytes=sanitized_bytes,
                object_key=s3_key,
                content_type=final_content_type
            )
            return {
                "url": s3_url,
                "filename": random_filename,
                "content_type": final_content_type,
                "size_bytes": len(sanitized_bytes),
                "storage": "neon_s3"
            }
        except Exception as e:
            logger.error(f"S3 upload failed, falling back to local disk: {e}")

    # 3. Fallback: Local disk storage
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(settings.UPLOAD_DIR, random_filename)
    with open(save_path, "wb") as f:
        f.write(sanitized_bytes)

    return {
        "url": f"/uploads/{random_filename}",
        "filename": random_filename,
        "content_type": final_content_type,
        "size_bytes": len(sanitized_bytes),
        "storage": "local"
    }

async def process_and_upload_document(
    contents: bytes,
    original_filename: str,
    content_type: str
) -> Dict[str, Any]:
    """
    Validate and upload a document (PDF, TXT, MD) to Neon S3 storage (or fallback to local disk).
    """
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else "bin"
    # Clean base name
    safe_base = "".join(c for c in original_filename.split(".")[0] if c.isalnum() or c in ("-", "_"))[:30]
    random_filename = f"{uuid.uuid4().hex[:12]}_{safe_base}.{ext}" if safe_base else f"{uuid.uuid4().hex}.{ext}"

    # Default content type if generic octet-stream
    doc_content_type = content_type
    if ext == "pdf":
        doc_content_type = "application/pdf"
    elif ext in ("txt", "md"):
        doc_content_type = "text/plain"

    # Try S3 upload if configured
    if is_s3_configured():
        try:
            s3_key = f"documents/{random_filename}"
            s3_url = await upload_bytes_to_s3(
                file_bytes=contents,
                object_key=s3_key,
                content_type=doc_content_type
            )
            return {
                "url": s3_url,
                "filename": random_filename,
                "content_type": doc_content_type,
                "size_bytes": len(contents),
                "storage": "neon_s3"
            }
        except Exception as e:
            logger.error(f"S3 document upload failed, falling back to local: {e}")

    # Fallback: Local disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(settings.UPLOAD_DIR, random_filename)
    with open(save_path, "wb") as f:
        f.write(contents)

    return {
        "url": f"/uploads/{random_filename}",
        "filename": random_filename,
        "content_type": doc_content_type,
        "size_bytes": len(contents),
        "storage": "local"
    }
