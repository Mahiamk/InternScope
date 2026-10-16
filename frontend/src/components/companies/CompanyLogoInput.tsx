import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  ArrowClockwise,
  UploadSimple,
  Trash,
  Buildings,
  ShieldCheck,
  Info
} from '@phosphor-icons/react';
import { api } from '../../services/api';
import { CompanyLogo } from '../common/CompanyLogo';
import { Button } from '../ui/Button';
import type { CompanyLogoResolveResponse, MatchedCompanyBrief } from '../../types';

interface CompanyLogoInputProps {
  websiteUrl: string;
  onWebsiteUrlChange: (url: string) => void;
  logoUrl: string | null;
  onLogoUrlChange: (logo: string | null) => void;
  companyName?: string;
  onCompanyMatched?: (company: MatchedCompanyBrief) => void;
  disabled?: boolean;
}

export const CompanyLogoInput: React.FC<CompanyLogoInputProps> = ({
  websiteUrl,
  onWebsiteUrlChange,
  logoUrl,
  onLogoUrlChange,
  companyName,
  onCompanyMatched,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [resolveResult, setResolveResult] = useState<CompanyLogoResolveResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploadingCustom, setUploadingCustom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce ref to avoid fetching on every keystroke
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResolvedUrlRef = useRef<string>('');

  const performResolution = async (urlToResolve: string) => {
    const trimmed = urlToResolve.trim();
    if (!trimmed) {
      setResolveResult(null);
      setStatusMessage(null);
      setLoading(false);
      return;
    }

    // Avoid duplicate request if already resolved for identical URL
    if (trimmed === lastResolvedUrlRef.current && resolveResult) {
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await api.companies.resolveLogo(trimmed);
      setResolveResult(res);
      lastResolvedUrlRef.current = trimmed;

      if (res.status === 'invalid_url') {
        setStatusMessage(res.message || 'Please enter a valid website URL (e.g. grab.com or https://company.com).');
      } else if (res.status === 'resolved' || res.status === 'fallback') {
        // Auto-assign logo if user doesn't already have a custom one
        if (res.logo_url && !logoUrl) {
          onLogoUrlChange(res.logo_url);
        }
        if (res.matched_company && onCompanyMatched) {
          onCompanyMatched(res.matched_company);
        }
        setStatusMessage(res.message || null);
      } else if (res.status === 'not_found') {
        setStatusMessage(res.message || 'No automatic logo found. You can proceed without a logo or upload one.');
        if (res.matched_company && onCompanyMatched) {
          onCompanyMatched(res.matched_company);
        }
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Network error while detecting logo.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced effect whenever websiteUrl changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!websiteUrl || !websiteUrl.trim()) {
      setResolveResult(null);
      setStatusMessage(null);
      setLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      performResolution(websiteUrl);
    }, 600); // 600ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [websiteUrl]);

  const handleManualRetry = () => {
    if (websiteUrl) {
      performResolution(websiteUrl);
    }
  };

  const handleCustomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCustom(true);
    try {
      const uploadRes = await api.uploads.uploadImage(file);
      onLogoUrlChange(uploadRes.url);
      setStatusMessage('Custom logo uploaded successfully.');
    } catch (err: any) {
      setStatusMessage(err.message || 'Logo upload failed. Supported formats: JPG, PNG, WebP.');
    } finally {
      setUploadingCustom(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    onLogoUrlChange(null);
    setStatusMessage('Logo removed. You may continue without a logo.');
  };

  // Determine badge style
  const getSourceBadge = () => {
    if (!logoUrl) return null;
    if (resolveResult?.source === 'existing_company') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold uppercase tracking-wider rounded-[2px]">
          <ShieldCheck size={11} weight="fill" />
          Existing Company Record
        </span>
      );
    }
    if (resolveResult?.source === 'provider_logo') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold uppercase tracking-wider rounded-[2px]">
          <CheckCircle size={11} weight="fill" />
          Official Logo Detected
        </span>
      );
    }
    if (resolveResult?.source === 'fallback_favicon') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold uppercase tracking-wider rounded-[2px]">
          <Info size={11} weight="fill" />
          Website Favicon (Fallback)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-200 text-[10px] font-semibold uppercase tracking-wider rounded-[2px]">
        Custom Uploaded Logo
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Input Row */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
            Company Website URL
          </label>
          <span className="text-[11px] text-[#737373]">Optional • Auto-detects logo</span>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
            {loading ? (
              <CircleNotch size={16} className="animate-spin text-[#991b1b]" />
            ) : (
              <Globe size={16} weight="duotone" />
            )}
          </div>
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => onWebsiteUrlChange(e.target.value)}
            disabled={disabled}
            placeholder="e.g. grab.careers, petronas.com, intel.com"
            className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] pl-9 pr-10 py-2.5 focus:border-[#0a0a0a] outline-none transition-colors"
          />
          {websiteUrl && (
            <button
              type="button"
              onClick={handleManualRetry}
              disabled={loading || disabled}
              title="Re-check website logo"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#737373] hover:text-[#0a0a0a] transition-colors"
            >
              <ArrowClockwise size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Hidden File Input for Custom Logo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCustomFileUpload}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* Feedback & Preview Box */}
      {(logoUrl || loading || resolveResult || statusMessage) && (
        <div className="p-3.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] space-y-3">
          <div className="flex items-start justify-between gap-3">
            {/* Logo Preview with Fixed Containment Container */}
            <div className="flex items-center gap-3">
              <CompanyLogo
                name={companyName || resolveResult?.matched_company?.name || 'Company'}
                logoUrl={logoUrl}
                size="lg"
                className="bg-white shadow-xs"
              />

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-xs text-[#0a0a0a]">
                    {companyName || resolveResult?.matched_company?.name || 'Company Logo Preview'}
                  </span>
                  {getSourceBadge()}
                </div>

                <div className="text-[11px] text-[#525252]">
                  {loading ? (
                    <span className="inline-flex items-center gap-1 text-[#991b1b]">
                      <CircleNotch size={12} className="animate-spin" />
                      Detecting company logo from website...
                    </span>
                  ) : statusMessage ? (
                    <span className={resolveResult?.status === 'invalid_url' ? 'text-red-600' : 'text-[#525252]'}>
                      {statusMessage}
                    </span>
                  ) : logoUrl ? (
                    <span>Logo ready to be associated with this company profile.</span>
                  ) : (
                    <span>No logo detected. You can publish without a logo or upload one.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: Upload alternative, remove, retry */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingCustom || disabled}
                title="Upload custom image file"
                className="text-xs h-7 px-2"
              >
                <UploadSimple size={13} weight="duotone" />
                <span className="hidden sm:inline">Upload File</span>
              </Button>

              {logoUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={disabled}
                  title="Remove logo"
                  className="text-xs h-7 px-2 text-red-600 hover:border-red-300"
                >
                  <Trash size={13} weight="duotone" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
