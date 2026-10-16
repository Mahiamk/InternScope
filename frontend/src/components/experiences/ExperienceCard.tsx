import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  CalendarBlank,
  Star,
  BookmarkSimple,
  Buildings,
  CheckCircle,
  CurrencyCircleDollar
} from '@phosphor-icons/react';
import type { InternshipExperience } from '../../types';
import { Badge } from '../ui/Badge';
import { CompanyLogo } from '../common/CompanyLogo';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ExperienceCardProps {
  experience: InternshipExperience;
  onBookmarkChanged?: () => void;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({
  experience,
  onBookmarkChanged
}) => {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(experience.is_bookmarked || false);
  const [bookmarking, setBookmarking] = useState(false);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setBookmarking(true);
    try {
      const res = await api.bookmarks.toggle('EXPERIENCE', experience.id);
      setBookmarked(res.bookmarked);
      if (onBookmarkChanged) onBookmarkChanged();
    } catch {
      // ignore
    } finally {
      setBookmarking(false);
    }
  };

  const workTypeLabels: Record<string, string> = {
    onsite: 'On-site',
    hybrid: 'Hybrid',
    remote: 'Remote',
  };

  return (
    <Link
      to={`/experiences/${experience.id}`}
      className="group block bg-white border border-[#e5e5e5] hover:border-[#737373] transition-all duration-150 rounded-[2px] p-5 relative"
    >
      {/* Top row: Company & Bookmark */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <CompanyLogo
            name={experience.company?.name}
            logoUrl={experience.company?.logo_url}
            size="md"
          />
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#525252] font-medium mb-0.5">
              <span>{experience.company?.name || 'Company'}</span>
              {experience.company?.is_verified && (
                <span title="Verified Company">
                  <CheckCircle size={13} weight="fill" className="text-[#16a34a]" />
                </span>
              )}
            </div>
            <h3 className="font-semibold text-base text-[#0a0a0a] group-hover:text-[#991b1b] transition-colors leading-snug">
              {experience.position}
            </h3>
          </div>
        </div>

        <button
          onClick={handleToggleBookmark}
          disabled={bookmarking}
          className="p-1.5 text-[#737373] hover:text-[#991b1b] hover:bg-[#f5f5f5] rounded-[2px] transition-colors"
          title={bookmarked ? 'Remove bookmark' : 'Bookmark experience'}
        >
          <BookmarkSimple
            size={20}
            weight={bookmarked ? 'fill' : 'duotone'}
            className={bookmarked ? 'text-[#991b1b]' : ''}
          />
        </button>
      </div>

      {/* Meta tags: Location, Work type, Duration */}
      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#737373] mt-3">
        <span className="flex items-center gap-1">
          <MapPin size={14} weight="duotone" />
          {experience.location}
        </span>
        <span>•</span>
        <span className="capitalize">{workTypeLabels[experience.work_type] || experience.work_type}</span>
        {experience.duration_weeks && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CalendarBlank size={14} weight="duotone" />
              {experience.duration_weeks} weeks
            </span>
          </>
        )}
      </div>

      {/* Excerpt */}
      <p className="text-xs text-[#525252] mt-3 line-clamp-2 leading-relaxed">
        {experience.responsibilities}
      </p>

      {/* Tech Tags */}
      {experience.technologies && experience.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {experience.technologies.slice(0, 4).map((tech) => (
            <Badge key={tech.id} variant="neutral" size="sm">
              {tech.name}
            </Badge>
          ))}
          {experience.technologies.length > 4 && (
            <span className="text-[11px] text-[#737373] self-center">
              +{experience.technologies.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Footer / Compensation & Contributor */}
      <div className="mt-5 pt-3.5 border-t border-[#f5f5f5] flex items-center justify-between">
        <div>
          {experience.is_allowance_disclosed && experience.allowance ? (
            <div className="flex items-center gap-1 font-semibold text-xs text-[#0a0a0a]">
              <CurrencyCircleDollar size={16} weight="duotone" className="text-[#991b1b]" />
              <span>
                {experience.currency} {experience.allowance.toLocaleString()}
              </span>
              <span className="font-normal text-[11px] text-[#737373]">
                /{experience.allowance_period === 'monthly' ? 'mo' : experience.allowance_period}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[#737373] italic">
              Allowance undisclosed
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center text-xs font-semibold text-[#0a0a0a]">
            <Star size={14} weight="fill" className="text-[#eab308] mr-0.5" />
            <span>{experience.overall_rating}.0</span>
          </div>
          <span className="text-[11px] text-[#a3a3a3]">•</span>
          <span className="text-[11px] text-[#737373]">
            {experience.anonymous_display ? 'Anonymous Senior' : (experience.author?.full_name?.split(' ')[0] || 'Senior')}
          </span>
        </div>
      </div>
    </Link>
  );
};
