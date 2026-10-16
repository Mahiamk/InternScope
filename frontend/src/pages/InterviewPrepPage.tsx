import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Sparkle,
  PlusCircle,
  Buildings,
  CheckCircle,
  Lightbulb,
  ChatCircleDots,
  ShieldCheck,
  Star,
  MagnifyingGlass,
  ArrowRight
} from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const InterviewPrepPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'technical' | 'behavioral' | 'culture'>('all');

  const interviewTips = [
    {
      company: 'Grab Malaysia',
      role: 'Software Engineering Intern',
      difficulty: 'Medium-Hard',
      rating: 4,
      category: 'technical',
      questions: [
        'How would you design a real-time driver dispatch queue handling location updates?',
        'Explain the difference between optimistic and pessimistic locking in databases.',
        'Implement debounce in JavaScript and explain where it would be used in a ride-hailing app.'
      ],
      tip: 'Focus on clean modular code and be ready to explain time/space complexity tradeoffs. Grab interviewers appreciate students who ask clarifying questions before jumping into code.',
      student: 'Computer Science • Class of 2025'
    },
    {
      company: 'PETRONAS Digital',
      role: 'Data Science & Analytics Intern',
      difficulty: 'Medium',
      rating: 3,
      category: 'technical',
      questions: [
        'Walk through your data cleaning and preprocessing pipeline on messy industrial sensor data.',
        'What is cross-validation and why is K-Fold better than a simple train-test split?',
        'How would you handle highly imbalanced datasets when predicting equipment failure?'
      ],
      tip: 'Be confident in SQL (window functions and CTEs) and explain how data insights translate directly into operational cost savings.',
      student: 'Information Technology • Class of 2024'
    },
    {
      company: 'Intel Malaysia',
      role: 'Firmware & Embedded Systems Intern',
      difficulty: 'Hard',
      rating: 5,
      category: 'technical',
      questions: [
        'Explain bitwise masking and how interrupt service routines (ISR) work in microcontrollers.',
        'What is memory fragmentation and how do you prevent buffer overflow vulnerabilities?',
        'Describe a time your code caused a system freeze and how you systematically debugged it using oscilloscopes/logs.'
      ],
      tip: 'Review C pointers, memory layout (stack vs heap), and state machines. They test your fundamental problem-solving persistence.',
      student: 'Computer Engineering • Class of 2025'
    },
    {
      company: 'Shopee / SeaMoney',
      role: 'Frontend Engineering Intern',
      difficulty: 'Medium',
      rating: 3,
      category: 'behavioral',
      questions: [
        'Describe a situation where team members disagreed on UI architecture and how you reached consensus.',
        'How do you prioritize multiple feature deadlines during high-traffic campaign seasons (11.11 / 12.12)?',
        'Tell us about a technical project you built completely from scratch outside university assignments.'
      ],
      tip: 'Use the STAR method (Situation, Task, Action, Result). Highlight your bias for action and eagerness to take full ownership.',
      student: 'Software Engineering • Class of 2024'
    }
  ];

  const filteredTips = interviewTips.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.questions.some((q) => q.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#991b1b] rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Career Growth Resources
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a] mt-1">
            Interview Prep & Knowledge Base
          </h1>
          <p className="text-sm text-[#737373] mt-1 max-w-2xl">
            Real interview questions, evaluation criteria, and insider advice submitted by verified university students and alumni across leading employers.
          </p>
        </div>
        <Link to="/share">
          <Button variant="blood" size="sm" className="shrink-0">
            <PlusCircle size={16} weight="bold" />
            Share Interview Experience
          </Button>
        </Link>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
            Avg Technical Rounds
          </div>
          <div className="text-2xl font-bold text-[#0a0a0a] mt-1">2.4 Rounds</div>
          <div className="text-xs text-[#525252] mt-0.5">
            Screening + Live coding/take-home + Manager chat
          </div>
        </div>
        <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
            Verified Question Pool
          </div>
          <div className="text-2xl font-bold text-[#991b1b] mt-1">120+ Questions</div>
          <div className="text-xs text-[#525252] mt-0.5">
            Collected from 18 verified partner companies
          </div>
        </div>
        <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
            Student Offer Rate
          </div>
          <div className="text-2xl font-bold text-[#16a34a] mt-1">78.5%</div>
          <div className="text-xs text-[#525252] mt-0.5">
            For students who prepped with verified company tips
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
          <input
            type="text"
            placeholder="Search company, role, or question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'technical', 'behavioral'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0a0a0a] text-white'
                  : 'bg-[#fafafa] text-[#525252] hover:bg-[#f0f0f0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Interview Question Cards */}
      <div className="space-y-4">
        {filteredTips.map((tip, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] hover:border-[#a3a3a3] transition-colors space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f5f5f5]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#0a0a0a]">{tip.company}</span>
                  <span className="text-xs text-[#737373]">•</span>
                  <span className="text-xs text-[#525252] font-medium">{tip.role}</span>
                </div>
                <div className="text-[11px] text-[#737373] mt-0.5">{tip.student}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#f5f5f5] text-[#525252] rounded-[2px]">
                  {tip.difficulty}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-red-50 text-[#991b1b] rounded-[2px]">
                  {tip.category}
                </span>
              </div>
            </div>

            {/* Questions Asked */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#737373] flex items-center gap-1.5">
                <ChatCircleDots size={14} weight="bold" />
                Actual Interview Questions Asked
              </div>
              <ul className="space-y-1.5 pl-2">
                {tip.questions.map((q, qIdx) => (
                  <li key={qIdx} className="text-xs text-[#0a0a0a] flex items-start gap-2">
                    <span className="text-[#991b1b] font-bold shrink-0">{qIdx + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Student Advice */}
            <div className="bg-[#fafafa] border border-[#f0f0f0] p-3 rounded-[2px] flex items-start gap-2.5">
              <Lightbulb size={18} weight="duotone" className="text-[#991b1b] shrink-0 mt-0.5" />
              <div className="text-xs text-[#525252] leading-relaxed">
                <strong className="text-[#0a0a0a] font-semibold">Student Tip: </strong>
                {tip.tip}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
