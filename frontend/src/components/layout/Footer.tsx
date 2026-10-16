import React from 'react';
import { Link } from 'react-router-dom';
import { Buildings, Compass, Briefcase, PlusCircle, ShieldCheck } from '@phosphor-icons/react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#e5e5e5] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#e5e5e5]">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-[#991b1b]" />
              <span className="font-bold text-lg tracking-tight text-[#0a0a0a]">
                Intern<span className="text-[#991b1b]">Scope</span>
              </span>
            </div>
            <p className="text-sm text-[#525252] max-w-md leading-relaxed">
              "Your next internship starts with someone else's experience."
            </p>
            <p className="text-xs text-[#737373] leading-relaxed">
              A student-powered industrial training knowledge base. Designed with Swiss minimalism, strict typography, and authentic student peer reviews.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#f5f5f5] border border-[#e5e5e5] text-[11px] text-[#404040]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
              Inter-University Industrial Training Network • Malaysia
            </div>
          </div>

          {/* Col 2: Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">Discovery</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explore" className="text-[#525252] hover:text-[#991b1b] flex items-center gap-2">
                  <Compass size={14} weight="duotone" />
                  Experience Feed
                </Link>
              </li>
              <li>
                <Link to="/companies" className="text-[#525252] hover:text-[#991b1b] flex items-center gap-2">
                  <Buildings size={14} weight="duotone" />
                  Company Directory
                </Link>
              </li>
              <li>
                <Link to="/opportunities" className="text-[#525252] hover:text-[#991b1b] flex items-center gap-2">
                  <Briefcase size={14} weight="duotone" />
                  Active Vacancies
                </Link>
              </li>
              <li>
                <Link to="/share" className="text-[#525252] hover:text-[#991b1b] flex items-center gap-2">
                  <PlusCircle size={14} weight="duotone" />
                  Share Report
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Principles & Moderation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">Community</h4>
            <ul className="space-y-2 text-sm text-[#525252]">
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} weight="duotone" className="text-[#991b1b]" />
                Moderated Submissions
              </li>
              <li>Optional Salary Anonymity</li>
              <li>Direct Application Links</li>
              <li>Fair Workplace Accountability</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#737373] gap-4">
          <p>© {new Date().getFullYear()} InternScope Platform. Built for Malaysian University Students.</p>
          <p className="text-[11px] text-[#a3a3a3]">
            Disclaimer: All reviews, advice, and allowances are self-reported by students.
          </p>
        </div>
      </div>
    </footer>
  );
};
