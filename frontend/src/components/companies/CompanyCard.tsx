import React from 'react';
import { Link } from 'react-router-dom';
import {
  Buildings,
  CheckCircle,
  MapPin,
  Briefcase,
  Article,
  CurrencyCircleDollar
} from '@phosphor-icons/react';
import type { Company } from '../../types';
import { Badge } from '../ui/Badge';
import { CompanyLogo } from '../common/CompanyLogo';

interface CompanyCardProps {
  company: Company;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <Link
      to={`/companies/${company.slug}`}
      className="group block bg-white border border-[#e5e5e5] hover:border-[#737373] transition-all duration-150 rounded-[2px] p-6 relative"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CompanyLogo
            name={company.name}
            logoUrl={company.logo_url}
            size="md"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-base text-[#0a0a0a] group-hover:text-[#991b1b] transition-colors leading-tight">
                {company.name}
              </h3>
              {company.is_verified && (
                <span title="Verified Company">
                  <CheckCircle size={15} weight="fill" className="text-[#16a34a]" />
                </span>
              )}
            </div>
            <span className="text-xs text-[#737373] font-medium">{company.industry}</span>
          </div>
        </div>

        {company.opportunities_count ? (
          <Badge variant="blood" size="sm">
            {company.opportunities_count} hiring
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-xs text-[#737373] mt-3">
        <MapPin size={14} weight="duotone" />
        <span>{company.headquarters}</span>
      </div>

      {company.description && (
        <p className="text-xs text-[#525252] mt-3 line-clamp-2 leading-relaxed">
          {company.description}
        </p>
      )}

      {/* Tech Stack Preview */}
      {company.top_technologies && company.top_technologies.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {company.top_technologies.slice(0, 4).map((tech, idx) => (
            <span key={idx} className="text-[11px] px-2 py-0.5 bg-[#f5f5f5] text-[#525252] rounded-[2px]">
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Footer Metrics */}
      <div className="mt-5 pt-3.5 border-t border-[#f5f5f5] grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-[#525252]">
          <Article size={15} weight="duotone" className="text-[#991b1b]" />
          <span>{company.experiences_count || 0} reviews</span>
        </div>

        <div className="flex items-center gap-1.5 justify-end font-medium text-[#0a0a0a]">
          {company.avg_allowance ? (
            <>
              <CurrencyCircleDollar size={15} weight="duotone" className="text-[#991b1b]" />
              <span>RM {Math.round(company.avg_allowance)}/mo avg</span>
            </>
          ) : (
            <span className="text-[#a3a3a3] font-normal text-[11px]">Unreported</span>
          )}
        </div>
      </div>
    </Link>
  );
};
