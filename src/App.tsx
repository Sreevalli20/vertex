/**
 * VERITYX AI — Brand Integrity & Content Governance Platform
 * Root Application Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavigationPage } from './components/common/Sidebar';
import { TopBar } from './components/common/TopBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { WorkspaceView } from './components/workspace/WorkspaceView';
import { BrandProfilesView } from './components/brands/BrandProfilesView';
import { KnowledgeBaseView } from './components/knowledge/KnowledgeBaseView';
import { ReviewHistoryView } from './components/history/ReviewHistoryView';
import { GovernanceRulesView } from './components/rules/GovernanceRulesView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { SettingsView } from './components/settings/SettingsView';
import { PrintableReport } from './components/report/PrintableReport';
import { Modal } from './components/common/Modal';

import {
  BrandProfile,
  GovernanceRule,
  KnowledgeDocument,
  VerificationRun,
  AuditEvent,
} from './types';
import { storage } from './lib/storage/indexedDb';
import { AuditLogger } from './lib/audit/auditLogger';
import { VerificationEngine } from './lib/engine/verificationEngine';
import {
  SAMPLE_BRAND_PROFILE,
  SAMPLE_KNOWLEDGE_DOCUMENTS,
  SAMPLE_MARKETING_DRAFT,
} from './lib/sampleData';
import { Menu, X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Core Data Stores
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [rules, setRules] = useState<GovernanceRule[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [reviews, setReviews] = useState<VerificationRun[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  // Active Workspace / Report States
  const [activeWorkspaceReview, setActiveWorkspaceReview] = useState<VerificationRun | null>(null);
  const [reportReview, setReportReview] = useState<VerificationRun | null>(null);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sample data confirmation modal
  const [isSampleDataModalOpen, setIsSampleDataModalOpen] = useState(false);
  const [sampleSuccessToast, setSampleSuccessToast] = useState(false);

  // Refresh all state from IndexedDB
  const refreshAll = useCallback(async () => {
    try {
      await storage.initialize();
      const [allBrands, allRules, allDocs, allReviews, allAudit] = await Promise.all([
        storage.getAllBrands(),
        storage.getAllRules(),
        storage.getAllDocuments(),
        storage.getAllReviews(),
        storage.getAllAuditEvents(),
      ]);

      setBrands(allBrands);
      setRules(allRules);
      setDocuments(allDocs);
      setReviews(allReviews);
      setAuditEvents(allAudit);
    } catch (err) {
      console.error('Failed to load local storage:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Navigate handler
  const handleNavigate = (page: NavigationPage) => {
    setReportReview(null);
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  // New verification shortcut
  const handleNewVerification = () => {
    setActiveWorkspaceReview(null);
    setReportReview(null);
    setCurrentPage('workspace');
    setMobileMenuOpen(false);
  };

  // Open review in workspace
  const handleSelectReview = (review: VerificationRun) => {
    setActiveWorkspaceReview(review);
    setReportReview(null);
    setCurrentPage('workspace');
  };

  // Open printable executive report
  const handleOpenPrintReport = (review: VerificationRun) => {
    setReportReview(review);
  };

  // Save/Update review
  const handleSaveReview = (review: VerificationRun) => {
    setActiveWorkspaceReview(review);
    // Update reviews state
    setReviews((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === review.id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = review;
        return copy;
      }
      return [review, ...prev];
    });
    // refresh audit
    storage.getAllAuditEvents().then(setAuditEvents);
  };

  // Seed sample demo data
  const handleConfirmSeedSampleData = async () => {
    setIsSampleDataModalOpen(false);
    try {
      // 1. Save brand profile if not exists
      await storage.saveBrand(SAMPLE_BRAND_PROFILE);

      // 2. Save sample documents
      for (const doc of SAMPLE_KNOWLEDGE_DOCUMENTS) {
        await storage.saveDocument(doc);
      }

      // 3. Run sample verification on marketing draft
      const activeRules = rules.length > 0 ? rules.filter((r) => r.enabled) : await storage.getAllRules();
      const sampleRun = VerificationEngine.verify({
        contentTitle: SAMPLE_MARKETING_DRAFT.title,
        category: SAMPLE_MARKETING_DRAFT.category,
        rawContent: SAMPLE_MARKETING_DRAFT.content,
        brandProfile: SAMPLE_BRAND_PROFILE,
        governanceRules: activeRules,
        knowledgeDocuments: SAMPLE_KNOWLEDGE_DOCUMENTS,
        version: 1,
      });

      await storage.saveReview(sampleRun);

      await AuditLogger.log(
        'sample_data_loaded',
        'sample-seed',
        'Sample Dataset Seeded',
        { brand: SAMPLE_BRAND_PROFILE.name, docsCount: SAMPLE_KNOWLEDGE_DOCUMENTS.length }
      );

      await refreshAll();

      setActiveWorkspaceReview(sampleRun);
      setCurrentPage('workspace');
      setSampleSuccessToast(true);
      setTimeout(() => setSampleSuccessToast(false), 5000);
    } catch (err) {
      console.error('Failed to seed sample data:', err);
    }
  };

  // Calculate unreviewed count for badges
  const unresolvedCount = reviews.filter(
    (r) => r.reviewStatus === 'changes_required' || r.reviewStatus === 'ready_for_review'
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Initializing VERITYX Local Storage Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col antialiased">
      {/* Mobile Top Navbar (Small screen only) */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#0a0f1d] border-b border-slate-800">
        <div className="font-bold text-sm tracking-tight font-sans">
          VERITYX <span className="text-cyan-400">AI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onNewVerification={handleNewVerification}
            unresolvedReviewsCount={unresolvedCount}
          />
        </div>

        {/* Mobile Slide-over Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-64 h-full bg-[#0a0f1d] flex flex-col">
              <Sidebar
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onNewVerification={handleNewVerification}
                unresolvedReviewsCount={unresolvedCount}
              />
            </div>
          </div>
        )}

        {/* Primary Viewport */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#080d1a] overflow-hidden">
          {/* Top Bar Header */}
          <TopBar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            activeRulesCount={rules.filter((r) => r.enabled).length}
            approvedDocsCount={documents.length}
            onQuickAction={currentPage === 'workspace' ? undefined : handleNewVerification}
            quickActionLabel={currentPage === 'workspace' ? undefined : 'Verify Copy'}
          />

          {/* Success Toast */}
          {sampleSuccessToast && (
            <div className="m-4 p-3 bg-cyan-950/80 border border-cyan-800 text-cyan-200 text-xs rounded-xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Sample dataset loaded: &quot;AuraCloud Enterprise&quot; profile, benchmark specs, and launch draft ready for inspection.
                </span>
              </div>
              <button
                onClick={() => setSampleSuccessToast(false)}
                className="text-cyan-400 hover:text-cyan-200 text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Main Page Canvas */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {reportReview ? (
                <PrintableReport
                  review={reportReview}
                  onBack={() => setReportReview(null)}
                />
              ) : (
                <>
                  {currentPage === 'dashboard' && (
                    <DashboardView
                      reviews={reviews}
                      onNavigate={handleNavigate}
                      onSelectReview={handleSelectReview}
                      onLoadSampleData={() => setIsSampleDataModalOpen(true)}
                    />
                  )}

                  {currentPage === 'workspace' && (
                    <WorkspaceView
                      brands={brands}
                      rules={rules}
                      documents={documents}
                      currentReview={activeWorkspaceReview}
                      onSaveReview={handleSaveReview}
                      onOpenPrintReport={handleOpenPrintReport}
                      onRefreshDocs={refreshAll}
                    />
                  )}

                  {currentPage === 'brands' && (
                    <BrandProfilesView
                      brands={brands}
                      onRefresh={refreshAll}
                    />
                  )}

                  {currentPage === 'knowledge' && (
                    <KnowledgeBaseView
                      documents={documents}
                      onRefresh={refreshAll}
                    />
                  )}

                  {currentPage === 'history' && (
                    <ReviewHistoryView
                      reviews={reviews}
                      onSelectReview={handleSelectReview}
                      onOpenPrintReport={handleOpenPrintReport}
                      onRefresh={refreshAll}
                    />
                  )}

                  {currentPage === 'rules' && (
                    <GovernanceRulesView
                      rules={rules}
                      onRefresh={refreshAll}
                    />
                  )}

                  {currentPage === 'audit' && (
                    <AuditTrailView events={auditEvents} />
                  )}

                  {currentPage === 'settings' && (
                    <SettingsView
                      onRefreshAll={refreshAll}
                      onLoadSampleData={() => setIsSampleDataModalOpen(true)}
                    />
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Sample Demo Data Confirmation Modal */}
      <Modal
        isOpen={isSampleDataModalOpen}
        onClose={() => setIsSampleDataModalOpen(false)}
        title="Load Onboarding Sample Dataset"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-lg text-cyan-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              This will add an enterprise brand profile (<strong>AuraCloud Enterprise</strong>), two audited benchmark reference documents, and a launch campaign draft containing both grounded claims and intentional rule violations.
            </p>
          </div>

          <p className="text-slate-400 text-[11px]">
            You can edit, inspect, or delete these records at any time. Real and sample records remain strictly in your browser&apos;s IndexedDB.
          </p>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              onClick={() => setIsSampleDataModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSeedSampleData}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Load Sample Dataset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
