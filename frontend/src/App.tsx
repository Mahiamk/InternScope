import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ExperienceDetailPage } from './pages/ExperienceDetailPage';
import { ShareExperiencePage } from './pages/ShareExperiencePage';
import { CompaniesPage } from './pages/CompaniesPage';
import { CompanyDetailPage } from './pages/CompanyDetailPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SkillGapPage } from './pages/SkillGapPage';
import { AskSeniorPage } from './pages/AskSeniorPage';
import { InterviewPrepPage } from './pages/InterviewPrepPage';
import { CareerInsightsPage } from './pages/CareerInsightsPage';
import { CommunityPage } from './pages/CommunityPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpFeedbackPage } from './pages/HelpFeedbackPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { CVAnalyserPage } from './pages/CVAnalyserPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Standalone Guided Onboarding View */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Dedicated App Workspace (Separated from marketing landing page) */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/skill-gap" element={<SkillGapPage />} />
              <Route path="/ask-a-senior" element={<AskSeniorPage />} />
              <Route path="/cv-analyser" element={<CVAnalyserPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/interview-prep" element={<InterviewPrepPage />} />
              <Route path="/career-insights" element={<CareerInsightsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpFeedbackPage />} />
              <Route path="/share" element={<ShareExperiencePage />} />
              <Route path="/experiences/:id/edit" element={<ShareExperiencePage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>

            {/* Public Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/experiences/:id" element={<ExperienceDetailPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/:slug" element={<CompanyDetailPage />} />
              <Route path="/opportunities" element={<OpportunitiesPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
}



export default App;
