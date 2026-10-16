import React, { useState } from 'react';
import {
  Buildings,
  MapPin,
  Clock,
  ArrowSquareOut,
  BookmarkSimple,
  CurrencyCircleDollar,
  WarningCircle,
  Flag
} from '@phosphor-icons/react';
import type { Opportunity } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CompanyLogo } from '../common/CompanyLogo';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onReportClick: (opp: Opportunity) => void;
  onBookmarkChanged?: () => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onReportClick,
  onBookmarkChanged
}) => {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(opportunity.is_bookmarked || false);
  const [loadingBookmark, setLoadingBookmark] = useState(false);

  const handleToggleBookmark = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setLoadingBookmark(true);
    try {
      const res = await api.bookmarks.toggle('OPPORTUNITY', opportunity.id);
      setBookmarked(res.bookmarked);
      if (onBookmarkChanged) onBookmarkChanged();
    } catch {
      // ignore
    } finally {
      setLoadingBookmark(false);
    }
  };

  const isExpired = opportunity.is_expired || opportunity.status === 'EXPIRED';

  return (
    <div className={`bg-white border ${isExpired ? 'border-dashed border-[#d4d4d4] opacity-75' : 'border-[#e5e5e5] hover:border-[#737373]'} transition-all duration-150 rounded-[2px] p-6 flex flex-col justify-between`}>
      <div>
        {/* Header: Company & Bookmark */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CompanyLogo
              name={opportunity.company?.name}
              logoUrl={opportunity.company?.logo_url}
              size="md"
            />
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#525252] font-medium mb-1">
                <span>{opportunity.company?.name || 'Company'}</span>
                {isExpired ? (
                  <Badge variant="neutral" size="sm" className="ml-1 text-[#737373]">
                    Closed / Expired
                  </Badge>
                ) : (
                  <Badge variant="blood" size="sm" className="ml-1">
                    Active Vacancy
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-base text-[#0a0a0a] leading-snug">
                {opportunity.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleBookmark}
              disabled={loadingBookmark}
              className="p-1.5 text-[#737373] hover:text-[#991b1b] hover:bg-[#f5f5f5] rounded-[2px] transition-colors"
              title={bookmarked ? 'Remove saved' : 'Save opportunity'}
            >
              <BookmarkSimple
                size={18}
                weight={bookmarked ? 'fill' : 'duotone'}
                className={bookmarked ? 'text-[#991b1b]' : ''}
              />
            </button>
            <button
              onClick={() => onReportClick(opportunity)}
              className="p-1.5 text-[#a3a3a3] hover:text-[#991b1b] hover:bg-[#f5f5f5] rounded-[2px] transition-colors"
              title="Report vacancy closed or inaccurate"
            >
              <Flag size={16} weight="duotone" />
            </button>
          </div>
        </div>

        {/* Location & Terms */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#737373] mt-3">
          <span className="flex items-center gap-1">
            <MapPin size={14} weight="duotone" />
            {opportunity.location}
          </span>
          <span>•</span>
          <span className="capitalize">{opportunity.work_type}</span>
          <span>•</span>
          <span>{opportunity.period}</span>
        </div>

        {/* Skills */}
        {opportunity.skills && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {opportunity.skills.split(',').map((skill, idx) => (
              <Badge key={idx} variant="neutral" size="sm">
                {skill.trim()}
              </Badge>
            ))}
          </div>
        )}

        {/* Requirements snippet */}
        {opportunity.requirements && (
          <p className="text-xs text-[#525252] mt-3 line-clamp-2 leading-relaxed">
            {opportunity.requirements}
          </p>
        )}
      </div>

      {/* Bottom bar */}
      <div className="mt-6 pt-4 border-t border-[#f5f5f5] flex items-center justify-between">
        <div>
          {opportunity.allowance ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-[#0a0a0a]">
              <CurrencyCircleDollar size={15} weight="duotone" className="text-[#991b1b]" />
              <span>{opportunity.currency} {opportunity.allowance.toLocaleString()}</span>
              <span className="text-[11px] font-normal text-[#737373]">/mo</span>
            </div>
          ) : (
            <span className="text-[11px] text-[#737373]">Allowance undisclosed</span>
          )}

          {opportunity.deadline && (
            <div className="flex items-center gap-1 text-[11px] text-[#737373] mt-0.5">
              <Clock size={12} weight="duotone" />
              <span>Deadline: {opportunity.deadline}</span>
            </div>
          )}
        </div>

        <a
          href={opportunity.apply_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant={isExpired ? 'outline' : 'blood'}
            size="sm"
            disabled={isExpired}
          >
            <span>Apply Official</span>
            <ArrowSquareOut size={14} weight="bold" />
          </Button>
        </a>
      </div>
    </div>
  );
};
