import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChartLineUp,
  Briefcase,
  TrendUp,
  Buildings,
  CurrencyCircleDollar,
  Sparkle,
  ArrowRight,
  ShieldCheck
} from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';

export const CareerInsightsPage: React.FC = () => {
  const allowanceData = [
    { role: 'Software Engineering & Cloud', avg: 'RM 1,450', range: 'RM 1,000 – RM 2,500', demand: '+24% YoY' },
    { role: 'Data Science & Machine Learning', avg: 'RM 1,350', range: 'RM 1,000 – RM 2,200', demand: '+31% YoY' },
    { role: 'Cybersecurity & Infrastructure', avg: 'RM 1,300', range: 'RM 900 – RM 2,000', demand: '+18% YoY' },
    { role: 'UI/UX Design & Product', avg: 'RM 1,150', range: 'RM 800 – RM 1,800', demand: '+15% YoY' },
    { role: 'Business Analytics & Ops', avg: 'RM 1,100', range: 'RM 700 – RM 1,600', demand: '+12% YoY' }
  ];

  const skillTrends = [
    { skill: 'React & TypeScript', category: 'Frontend', pct: 92 },
    { skill: 'Python & FastAPI', category: 'Backend/AI', pct: 88 },
    { skill: 'SQL & Database Optimization', category: 'Data', pct: 85 },
    { skill: 'Docker & Containerization', category: 'DevOps', pct: 76 },
    { skill: 'Tailwind CSS', category: 'Frontend', pct: 74 },
    { skill: 'Git & Trunk Workflow', category: 'Foundations', pct: 95 }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#991b1b] rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Market Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a] mt-1">
            Career & Internship Insights
          </h1>
          <p className="text-sm text-[#737373] mt-1 max-w-2xl">
            Real-world compensation metrics, high-growth skill demands, and industry trends synthesized from student internship reports and national benchmarks.
          </p>
        </div>
        <Link to="/skill-gap">
          <Button variant="outline" size="sm" className="shrink-0">
            Analyze My Skill Gap
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
            National Median Tech Allowance
          </div>
          <div className="text-2xl font-bold text-[#0a0a0a]">RM 1,350/mo</div>
          <div className="text-xs text-[#16a34a] font-medium">+12.5% increase over previous cohort</div>
        </div>
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
            Full-Time Return Offer Rate
          </div>
          <div className="text-2xl font-bold text-[#991b1b]">68.4%</div>
          <div className="text-xs text-[#525252]">For high-performing 6-month industrial interns</div>
        </div>
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
            Primary Internship Locations
          </div>
          <div className="text-2xl font-bold text-[#0a0a0a]">KL & Penang</div>
          <div className="text-xs text-[#525252]">Accounting for 82% of tech placements</div>
        </div>
      </div>

      {/* Compensation Breakdown Table */}
      <div className="bg-white border border-[#e5e5e5] rounded-[2px] overflow-hidden">
        <div className="p-4 border-b border-[#e5e5e5] bg-[#fafafa]">
          <h2 className="text-sm font-bold text-[#0a0a0a]">Monthly Allowance Benchmarks by Specialization</h2>
          <p className="text-xs text-[#737373] mt-0.5">Based on anonymized student submissions across 2024-2026 industrial training.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fafafa] text-[#737373] border-b border-[#e5e5e5] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Median Monthly</th>
                <th className="py-3 px-4">Observed Range</th>
                <th className="py-3 px-4 text-right">Market Demand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {allowanceData.map((row, i) => (
                <tr key={i} className="hover:bg-[#fafafa] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#0a0a0a]">{row.role}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#991b1b]">{row.avg}</td>
                  <td className="py-3 px-4 text-[#525252]">{row.range}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block px-2 py-0.5 bg-green-50 text-[#16a34a] font-bold rounded-[2px] text-[10px]">
                      {row.demand}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Skill Demands */}
      <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#0a0a0a]">Most Requested Skills in Employer Postings</h2>
          <p className="text-xs text-[#737373] mt-0.5">Percentage of internship openings listing proficiency as mandatory or preferred.</p>
        </div>
        <div className="space-y-3">
          {skillTrends.map((st, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#0a0a0a]">{st.skill}</span>
                  <span className="text-[10px] text-[#737373] uppercase tracking-wider px-1.5 py-0.2 bg-[#f5f5f5] rounded-[2px]">
                    {st.category}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#525252]">{st.pct}%</span>
              </div>
              <div className="w-full bg-[#f0f0f0] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#991b1b] h-full rounded-full transition-all duration-500"
                  style={{ width: `${st.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
