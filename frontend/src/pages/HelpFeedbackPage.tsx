import React, { useState } from 'react';
import {
  Question,
  ChatCircleText,
  EnvelopeSimple,
  Buildings,
  CheckCircle,
  FileText,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';

export const HelpFeedbackPage: React.FC = () => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [category, setCategory] = useState('Feedback');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setFeedbackSent(true);
    setMessage('');
    setTimeout(() => setFeedbackSent(false), 4000);
  };

  const faqs = [
    {
      q: 'How does InternScope ensure review authenticity?',
      a: 'All reviews are submitted exclusively by authenticated university students and validated against university enrollment records. Moderators verify offer letters or internship logbooks before experiences receive the Verified Student badge.'
    },
    {
      q: 'Will my employer see my identity if I post an internship review?',
      a: 'No. You can toggle anonymous attribution on any review submission. Employers and external visitors only see your department and general cohort graduation year.'
    },
    {
      q: 'How do I add a new company or internship role not yet listed?',
      a: 'Simply enter the company website URL when sharing an experience or recording an opportunity. InternScope automatically detects the domain and retrieves the official company logo.'
    },
    {
      q: 'How do I get academic credit for my completed industrial training?',
      a: 'Export your application records and weekly logbooks directly through the Application Tracker to present to your academic supervisor at the School of Computing & Informatics.'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#991b1b] rounded-full" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
            Support & Resources
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a] mt-1">
          Help and Feedback
        </h1>
        <p className="text-sm text-[#737373] mt-1">
          Frequently asked questions, Industrial Training Coordinator contacts, and direct platform support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#e5e5e5]">
            <FileText size={18} weight="duotone" className="text-[#991b1b]" />
            <h2 className="text-sm font-bold text-[#0a0a0a]">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] space-y-1.5">
                <div className="text-xs font-bold text-[#0a0a0a] flex items-start gap-2">
                  <span className="text-[#991b1b] font-bold shrink-0">Q:</span>
                  <span>{faq.q}</span>
                </div>
                <div className="text-xs text-[#525252] pl-4 leading-relaxed">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Box */}
          <div className="bg-[#fafafa] border border-[#e5e5e5] p-4 rounded-[2px] space-y-2 mt-4">
            <div className="text-xs font-bold text-[#0a0a0a]">University Industrial Training Coordination Unit</div>
            <p className="text-xs text-[#525252]">
              For official internship syllabus endorsement, faculty advisor assignments, and grading inquiries:
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-[#737373] pt-1">
              <div>Email: <strong className="text-[#0a0a0a]">internship@aiu.edu.my</strong></div>
              <div>Office: <strong className="text-[#0a0a0a]">SCI Academic Complex, Level 2</strong></div>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#e5e5e5]">
            <ChatCircleText size={18} weight="duotone" className="text-[#991b1b]" />
            <h2 className="text-sm font-bold text-[#0a0a0a]">Send Direct Feedback</h2>
          </div>

          {feedbackSent && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-[2px] text-xs text-[#16a34a] font-semibold flex items-center gap-2">
              <CheckCircle size={16} weight="bold" />
              Thank you! Your feedback has been shared with the InternScope team.
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
              >
                <option value="Feedback">General Feedback</option>
                <option value="Bug">Report an Issue / Bug</option>
                <option value="Feature">Suggest a Feature</option>
                <option value="Company">Request Company Addition</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block mb-1">
                Message
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you like or how we can improve InternScope..."
                className="w-full text-xs p-2 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
              />
            </div>

            <Button type="submit" variant="blood" size="sm" className="w-full">
              Submit Feedback
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
