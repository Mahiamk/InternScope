import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Sparkle,
  UploadSimple,
  CheckCircle,
  Warning,
  Copy,
  Check,
  Target,
  ChartBar,
  ArrowCounterClockwise,
  Lightning,
  Info,
  X,
  FilePdf,
  CaretRight
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { CVAnalysisResponse } from '../types';

const SAMPLE_RESUME = `Tariq Mansoor
Kuala Lumpur, Malaysia | tariq@example.com | github.com/tariqmansoor | linkedin.com/in/tariqmansoor

EDUCATION
Bachelor of Computer Science (Hons)
Albukhary International University | CGPA: 3.82 | Expected Nov 2026
Relevant Coursework: Data Structures, Algorithms, Database Systems, Web Development, Software Engineering

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, SQL, HTML/CSS
Frameworks & Libraries: React, Node.js, FastAPI, Express.js, Tailwind CSS
Databases & Cloud: PostgreSQL, SQLite, Supabase, Git, Docker (Basic)

EXPERIENCE & PROJECTS
Full-Stack Web Developer Intern — Local Tech Solutions
Jun 2025 - Sep 2025 | Penang, Malaysia
- Worked on frontend user interface using React and Tailwind CSS.
- Assisted backend team with building REST APIs in Python FastAPI for authentication.
- Fixed bugs and helped test database queries in PostgreSQL.
- Participated in weekly sprint meetings and code reviews with senior engineers.

Campus Food Delivery Web Platform (Capstone Project)
Jan 2025 - Apr 2025
- Built a web application allowing university students to order from local campus vendors.
- Implemented user authentication and ordering workflows using React and Supabase.
- Designed database schema for orders, menus, and user profiles.
- Integrated payment status tracking and WhatsApp notifications for vendors.

LEADERSHIP & ACTIVITIES
- Lead Organizer, AIU Annual Hackathon 2025 (120+ student participants)
- Vice President, Computing & Technology Student Society (2024 - 2025)`;

const POPULAR_ROLES = [
  'Software Engineering Intern',
  'Frontend / Full-Stack Intern',
  'Backend & Cloud Intern',
  'Data Science & Analytics Intern',
  'UI/UX & Product Design Intern',
  'Finance & Accounting Intern',
  'Digital Marketing Intern',
  'Cybersecurity Analyst Intern'
];

export const CVAnalyserPage: React.FC = () => {
  // Input state
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineering Intern');
  const [targetIndustry, setTargetIndustry] = useState('Technology');
  const [dragActive, setDragActive] = useState(false);

  // System Status state
  const [hasServerKey, setHasServerKey] = useState(true);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [analysisResult, setAnalysisResult] = useState<CVAnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check server API key status
  useEffect(() => {
    api.cv.getStatus()
      .then(res => setHasServerKey(res.has_server_key))
      .catch(() => setHasServerKey(true));
  }, []);

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'txt' && ext !== 'md') {
      setErrorMsg('Please upload a PDF (.pdf) or text (.txt, .md) resume document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size must be under 10MB.');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
  };

  // Run CV Analysis
  const handleRunAnalysis = async () => {
    if (activeTab === 'upload' && !selectedFile) {
      setErrorMsg('Please select or drag a PDF resume file to analyze.');
      return;
    }

    if (activeTab === 'paste' && (!resumeText.trim() || resumeText.trim().length < 50)) {
      setErrorMsg('Please paste at least 50 characters of your CV or resume content.');
      return;
    }

    setErrorMsg(null);
    setAnalyzing(true);
    setAnalysisProgress('Connecting to Gemini AI Engine...');

    try {
      const progressTimer1 = setTimeout(() => {
        setAnalysisProgress('Scanning ATS format, hierarchy & typography...');
      }, 1500);

      const progressTimer2 = setTimeout(() => {
        setAnalysisProgress('Evaluating quantifiable impact metrics (XYZ & STAR)...');
      }, 3500);

      const progressTimer3 = setTimeout(() => {
        setAnalysisProgress('Synthesizing recruiter recommendations and rewrites...');
      }, 6000);

      let result: CVAnalysisResponse;

      if (activeTab === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('target_role', targetRole);
        formData.append('target_industry', targetIndustry);
        result = await api.cv.analyzeFile(formData);
      } else {
        result = await api.cv.analyzeText({
          resume_text: resumeText,
          target_role: targetRole,
          target_industry: targetIndustry,
        });
      }

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      setAnalysisResult(result);
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze CV with Gemini. Please try again.');
    } finally {
      setAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  const handleCopyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500';
    if (score >= 70) return 'text-[#991b1b] dark:text-[#ef4444] border-[#991b1b] dark:border-[#ef4444]';
    if (score >= 55) return 'text-amber-600 dark:text-amber-400 border-amber-500';
    return 'text-rose-600 dark:text-rose-400 border-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-50 dark:bg-emerald-950/20';
    if (score >= 70) return 'bg-red-50 dark:bg-red-950/20';
    if (score >= 55) return 'bg-amber-50 dark:bg-amber-950/20';
    return 'bg-rose-50 dark:bg-rose-950/20';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="border-b border-[#e5e5e5] dark:border-[#262626] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-[#991b1b] dark:bg-[#ef4444] rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373] dark:text-[#888888]">
              AI Career Intelligence
            </span>
            <Badge variant="blood" size="sm" className="gap-1 font-mono">
              <Sparkle size={12} weight="fill" />
              Gemini Powered
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a] dark:text-white">
            AI CV Analyser & Recruiter Rating
          </h1>
          <p className="text-sm text-[#737373] dark:text-[#888888] mt-1 max-w-2xl">
            Evaluate your CV against top tech & MNC recruitment benchmarks, benchmark ATS compatibility, and receive intelligent line-by-line rewrite suggestions.
          </p>
        </div>

        {/* AI System Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] text-xs font-medium text-[#525252] dark:text-[#a3a3a3] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] text-[#0a0a0a] dark:text-white font-semibold">Gemini AI Engine</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-[2px] text-xs text-[#991b1b] dark:text-[#ef4444] flex items-start gap-3">
          <Warning size={18} weight="fill" className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Analysis Notice: </span>
            {errorMsg}
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-[#991b1b] dark:text-[#ef4444] hover:opacity-75"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Main Configuration & Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: CV Input */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] p-5 shadow-2xs space-y-4">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#262626] pb-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[2px] transition-colors ${
                    activeTab === 'upload'
                      ? 'bg-[#0a0a0a] text-white dark:bg-white dark:text-[#0a0a0a]'
                      : 'text-[#737373] hover:text-[#0a0a0a] dark:hover:text-white'
                  }`}
                >
                  <UploadSimple size={14} weight="bold" />
                  Upload PDF / Resume
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[2px] transition-colors ${
                    activeTab === 'paste'
                      ? 'bg-[#0a0a0a] text-white dark:bg-white dark:text-[#0a0a0a]'
                      : 'text-[#737373] hover:text-[#0a0a0a] dark:hover:text-white'
                  }`}
                >
                  <FileText size={14} weight="bold" />
                  Paste CV Text
                </button>
              </div>

              {activeTab === 'paste' && (
                <button
                  type="button"
                  onClick={() => {
                    setResumeText(SAMPLE_RESUME);
                    setTargetRole('Software Engineering Intern');
                  }}
                  className="text-[11px] text-[#991b1b] dark:text-[#ef4444] font-semibold hover:underline flex items-center gap-1"
                >
                  <Sparkle size={12} weight="fill" />
                  Load Sample Candidate CV
                </button>
              )}
            </div>

            {/* Upload Tab View */}
            {activeTab === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[2px] p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-[#991b1b] bg-red-50/50 dark:bg-red-950/10'
                      : 'border-[#e5e5e5] dark:border-[#262626] hover:border-[#a3a3a3] dark:hover:border-[#404040] bg-[#fafafa] dark:bg-[#171717]'
                  }`}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 text-[#991b1b] dark:text-[#ef4444] rounded-full flex items-center justify-center mx-auto">
                        <FilePdf size={24} weight="duotone" />
                      </div>
                      <div className="font-bold text-sm text-[#0a0a0a] dark:text-white">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-[#737373]">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                      </div>
                      <div className="pt-2">
                        <Badge variant="neutral" size="sm">
                          Ready for AI Analysis
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-[#f5f5f5] dark:bg-[#222222] text-[#737373] dark:text-[#a3a3a3] rounded-full flex items-center justify-center mx-auto">
                        <UploadSimple size={24} weight="duotone" />
                      </div>
                      <div className="text-xs font-semibold text-[#0a0a0a] dark:text-white">
                        Drag and drop your PDF resume here, or <span className="text-[#991b1b] dark:text-[#ef4444] underline">browse file</span>
                      </div>
                      <p className="text-[11px] text-[#737373] max-w-sm mx-auto">
                        Supports PDF, TXT, or Markdown formats up to 10MB. Text, formatting, and layout will be parsed by Gemini.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Paste Tab View */}
            {activeTab === 'paste' && (
              <div className="space-y-2">
                <textarea
                  rows={14}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your complete resume or CV text here (Education, Experience, Technical Skills, Projects, Leadership)..."
                  className="w-full p-3 font-mono text-xs border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] bg-white dark:bg-[#171717] text-[#0a0a0a] dark:text-[#f5f5f5] focus:border-[#0a0a0a] dark:focus:border-[#525252] outline-hidden leading-relaxed resize-y"
                />
                <div className="flex items-center justify-between text-[11px] text-[#737373]">
                  <span>{resumeText.length} characters</span>
                  <span>Minimum 50 characters required</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Target Role & Action Settings */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f5f5f5] dark:border-[#222222]">
              <Target size={16} weight="duotone" className="text-[#991b1b] dark:text-[#ef4444]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white">
                Target Internship Role
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0a0a0a] dark:text-white">
                Internship Title / Domain *
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineering Intern"
                className="w-full px-3 py-2 text-xs border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] bg-white dark:bg-[#171717] text-[#0a0a0a] dark:text-white focus:border-[#0a0a0a] outline-hidden"
              />
            </div>

            {/* Quick role suggestions */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-[#737373]">Popular Benchmarks:</div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_ROLES.slice(0, 5).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`text-[10px] px-2 py-1 rounded-[2px] border transition-colors ${
                      targetRole === role
                        ? 'bg-[#0a0a0a] text-white border-[#0a0a0a] dark:bg-white dark:text-[#0a0a0a]'
                        : 'bg-[#fafafa] dark:bg-[#1a1a1a] text-[#525252] dark:text-[#a3a3a3] border-[#e5e5e5] dark:border-[#262626] hover:border-[#a3a3a3]'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-[#0a0a0a] dark:text-white">
                Target Industry
              </label>
              <input
                type="text"
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                placeholder="e.g. Technology / FinTech / Consulting"
                className="w-full px-3 py-2 text-xs border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] bg-white dark:bg-[#171717] text-[#0a0a0a] dark:text-white focus:border-[#0a0a0a] outline-hidden"
              />
            </div>

            <div className="pt-4 border-t border-[#f5f5f5] dark:border-[#222222] space-y-3">
              <Button
                variant="blood"
                size="md"
                disabled={analyzing}
                onClick={handleRunAnalysis}
                className="w-full justify-center gap-2 font-semibold shadow-xs"
              >
                {analyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={16} weight="fill" />
                    <span>Analyze & Rate My CV</span>
                  </>
                )}
              </Button>

              {analyzing && (
                <div className="text-center space-y-1 animate-pulse">
                  <div className="text-xs font-semibold text-[#991b1b] dark:text-[#ef4444]">
                    {analysisProgress}
                  </div>
                  <div className="text-[11px] text-[#737373]">
                    Synthesizing ATS scores and XYZ bullet rewrites...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results View */}
      {analysisResult && (
        <div className="space-y-6 pt-4 border-t border-[#e5e5e5] dark:border-[#262626]">
          {/* Hero Score Section */}
          <div className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] p-6 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Score Dial */}
              <div className="md:col-span-4 text-center md:border-r border-[#e5e5e5] dark:border-[#262626] md:pr-6 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Overall Recruiter Score
                </div>
                <div className={`w-28 h-28 mx-auto rounded-full border-4 flex flex-col items-center justify-center ${getScoreColor(analysisResult.overall_score)} ${getScoreBg(analysisResult.overall_score)}`}>
                  <span className="text-4xl font-extrabold tracking-tight">
                    {analysisResult.overall_score}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                    out of 100
                  </span>
                </div>
                <div>
                  <Badge variant={analysisResult.overall_score >= 75 ? 'blood' : 'neutral'} size="sm">
                    {analysisResult.score_tier}
                  </Badge>
                </div>
              </div>

              {/* Recruiter Summary & Role Benchmark */}
              <div className="md:col-span-8 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#991b1b] dark:text-[#ef4444]">
                    Recruiter Assessment
                  </span>
                  <span className="text-xs text-[#737373]">•</span>
                  <span className="text-xs font-semibold text-[#0a0a0a] dark:text-white">
                    Benchmarked for {analysisResult.target_role}
                  </span>
                </div>
                <p className="text-sm text-[#0a0a0a] dark:text-[#f5f5f5] leading-relaxed">
                  {analysisResult.summary}
                </p>

                {/* 4 Pillars Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px]">
                    <div className="text-[10px] uppercase font-bold text-[#737373]">Impact & Metrics</div>
                    <div className="text-lg font-bold text-[#0a0a0a] dark:text-white mt-0.5">
                      {analysisResult.breakdown.impact_metrics}%
                    </div>
                    <div className="w-full bg-[#e5e5e5] dark:bg-[#333333] h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-[#991b1b] dark:bg-[#ef4444] h-full"
                        style={{ width: `${analysisResult.breakdown.impact_metrics}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px]">
                    <div className="text-[10px] uppercase font-bold text-[#737373]">ATS Readability</div>
                    <div className="text-lg font-bold text-[#0a0a0a] dark:text-white mt-0.5">
                      {analysisResult.breakdown.ats_readability}%
                    </div>
                    <div className="w-full bg-[#e5e5e5] dark:bg-[#333333] h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-[#991b1b] dark:bg-[#ef4444] h-full"
                        style={{ width: `${analysisResult.breakdown.ats_readability}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px]">
                    <div className="text-[10px] uppercase font-bold text-[#737373]">Structure</div>
                    <div className="text-lg font-bold text-[#0a0a0a] dark:text-white mt-0.5">
                      {analysisResult.breakdown.structure_conciseness}%
                    </div>
                    <div className="w-full bg-[#e5e5e5] dark:bg-[#333333] h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-[#991b1b] dark:bg-[#ef4444] h-full"
                        style={{ width: `${analysisResult.breakdown.structure_conciseness}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px]">
                    <div className="text-[10px] uppercase font-bold text-[#737373]">Keywords</div>
                    <div className="text-lg font-bold text-[#0a0a0a] dark:text-white mt-0.5">
                      {analysisResult.breakdown.keywords_alignment}%
                    </div>
                    <div className="w-full bg-[#e5e5e5] dark:bg-[#333333] h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-[#991b1b] dark:bg-[#ef4444] h-full"
                        style={{ width: `${analysisResult.breakdown.keywords_alignment}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Red Flags Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#f5f5f5] dark:border-[#222222]">
                <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white">
                  Demonstrated Strengths
                </h3>
              </div>
              <ul className="space-y-2.5">
                {analysisResult.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[#525252] dark:text-[#cccccc] leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red Flags / Improvements */}
            <div className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#f5f5f5] dark:border-[#222222]">
                <Warning size={18} weight="fill" className="text-[#991b1b] dark:text-[#ef4444]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white">
                  Critical Areas for Improvement
                </h3>
              </div>
              <ul className="space-y-2.5">
                {analysisResult.improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[#525252] dark:text-[#cccccc] leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#991b1b] dark:bg-[#ef4444] mt-1.5 shrink-0" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Line-by-Line / Bullet Point Rewrites (High-Impact Section) */}
          {analysisResult.bullet_rewrites && analysisResult.bullet_rewrites.length > 0 && (
            <div className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#f5f5f5] dark:border-[#222222]">
                <div className="flex items-center gap-2">
                  <Lightning size={18} weight="duotone" className="text-[#991b1b] dark:text-[#ef4444]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white">
                    Smart Bullet Rewrites (Google XYZ Formula)
                  </h3>
                </div>
                <Badge variant="neutral" size="sm">
                  Actionable Upgrades
                </Badge>
              </div>

              <div className="space-y-4">
                {analysisResult.bullet_rewrites.map((rw, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#fafafa] dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] space-y-3"
                  >
                    {/* Before */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Original From CV (Task-Oriented):
                      </div>
                      <div className="text-xs text-[#737373] italic pl-2.5 border-l-2 border-rose-300 dark:border-rose-900/40">
                        "{rw.original}"
                      </div>
                    </div>

                    {/* After */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Recommended High-Impact Rewrite:
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyBullet(rw.improved, idx)}
                          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-white dark:bg-[#222222] border border-[#e5e5e5] dark:border-[#333333] hover:border-[#0a0a0a] text-[#0a0a0a] dark:text-white rounded-[2px] transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check size={12} weight="bold" className="text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} weight="bold" />
                              <span>Copy Rewrite</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-xs font-semibold text-[#0a0a0a] dark:text-white pl-2.5 border-l-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 p-2 rounded-[2px]">
                        {rw.improved}
                      </div>
                    </div>

                    {/* Rationale */}
                    <div className="text-[11px] text-[#737373] flex items-start gap-1.5 pt-0.5">
                      <Info size={14} weight="duotone" className="shrink-0 text-[#991b1b] dark:text-[#ef4444] mt-0.5" />
                      <span><strong>Recruiter Rationale:</strong> {rw.rationale}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendations */}
          <div className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f5f5f5] dark:border-[#222222]">
              <Sparkle size={18} weight="duotone" className="text-[#991b1b] dark:text-[#ef4444]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white">
                Step-by-Step Enhancement Roadmap
              </h3>
            </div>

            <div className="space-y-3">
              {analysisResult.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#fafafa] dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">
                        {rec.title}
                      </span>
                    </div>
                    <p className="text-xs text-[#525252] dark:text-[#a3a3a3] leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                  <Badge
                    variant={rec.priority === 'HIGH' ? 'blood' : (rec.priority === 'MEDIUM' ? 'neutral' : 'outline')}
                    size="sm"
                    className="shrink-0"
                  >
                    {rec.priority} PRIORITY
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* ATS Keyword Gap Analysis */}
          <div className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f5f5f5] dark:border-[#222222]">
              <Target size={18} weight="duotone" className="text-[#991b1b] dark:text-[#ef4444]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white">
                ATS Keyword Gap Analysis
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Detected */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle size={14} weight="fill" />
                  Keywords Found in Your CV ({analysisResult.keywords.detected.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.keywords.detected.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-[2px]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended / Missing */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#991b1b] dark:text-[#ef4444] flex items-center gap-1.5">
                  <Warning size={14} weight="fill" />
                  Recommended Missing Keywords for {analysisResult.target_role}:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.keywords.recommended.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-red-50 dark:bg-red-950/20 text-[#991b1b] dark:text-[#ef4444] border border-red-200 dark:border-red-900/40 rounded-[2px]"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

