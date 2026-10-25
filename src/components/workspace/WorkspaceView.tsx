/**
 * Content Verification Workspace
 * Interactive editor, deterministic verification runner, finding inspector,
 * evidence grounding viewer, version comparison, and human sign-off.
 */

import React, { useState, useRef } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
  Download,
  Printer,
  History,
  ShieldCheck,
  Tag,
  AlertCircle,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import {
  BrandProfile,
  GovernanceRule,
  KnowledgeDocument,
  VerificationRun,
  Finding,
} from '../../types';
import { VerificationEngine } from '../../lib/engine/verificationEngine';
import { DocumentParser } from '../../lib/engine/parser';
import { storage } from '../../lib/storage/indexedDb';
import { AuditLogger } from '../../lib/audit/auditLogger';
import { VersionDiffModal } from './VersionDiffModal';
import { ApprovalModal } from './ApprovalModal';
import { HonestyNotice } from '../common/HonestyNotice';

interface WorkspaceViewProps {
  brands: BrandProfile[];
  rules: GovernanceRule[];
  documents: KnowledgeDocument[];
  currentReview: VerificationRun | null;
  onSaveReview: (review: VerificationRun) => void;
  onOpenPrintReport: (review: VerificationRun) => void;
  onRefreshDocs: () => void;
}

const CATEGORIES = [
  'Advertisements',
  'Website Copy',
  'Product Descriptions',
  'Email Campaigns',
  'Social Media Posts',
  'Press Releases',
  'Technical Datasheets',
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  brands,
  rules,
  documents,
  currentReview,
  onSaveReview,
  onOpenPrintReport,
  onRefreshDocs,
}) => {
  // Local form state
  const [contentTitle, setContentTitle] = useState(currentReview?.contentTitle || '');
  const [category, setCategory] = useState(currentReview?.category || 'Website Copy');
  const [rawContent, setRawContent] = useState(currentReview?.rawContent || '');
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    currentReview?.brandProfileId && currentReview.brandProfileId !== 'none'
      ? currentReview.brandProfileId
      : brands[0]?.id || ''
  );
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>(
    currentReview?.enabledRuleIds || rules.filter((r) => r.enabled).map((r) => r.id)
  );

  // Active run state
  const [activeRun, setActiveRun] = useState<VerificationRun | null>(currentReview);
  const [previousRun, setPreviousRun] = useState<VerificationRun | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Status flags
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) || null;

  // Word and character counts
  const wordCount = rawContent.trim() ? rawContent.trim().split(/\s+/).length : 0;
  const charCount = rawContent.length;

  // Handle on-the-fly document upload to knowledge base
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    setUploadError(null);

    try {
      const parsed = await DocumentParser.parseFile(file);
      const newDoc: KnowledgeDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: parsed.title,
        category: 'general',
        filename: file.name,
        fileType: parsed.fileType,
        content: parsed.content,
        summary: parsed.summary,
        characterCount: parsed.characterCount,
        wordCount: parsed.wordCount,
        parsedFactsCount: parsed.parsedFactsCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await storage.saveDocument(newDoc);
      await AuditLogger.log(
        'knowledge_document_added',
        newDoc.id,
        newDoc.title,
        { fileType: newDoc.fileType, characterCount: newDoc.characterCount }
      );

      onRefreshDocs();
      setSaveSuccessMsg(`Uploaded and indexed reference document: "${newDoc.title}"`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Run deterministic verification
  const handleRunVerification = async () => {
    if (!rawContent.trim()) return;

    setIsVerifying(true);
    setSaveSuccessMsg(null);

    // Save previous version if re-running
    if (activeRun) {
      setPreviousRun(activeRun);
    }

    const nextVersion = activeRun ? activeRun.version + 1 : 1;

    // Filter rules
    const activeRules = rules.filter((r) => selectedRuleIds.includes(r.id));

    // Allow browser tick to show progress indicator
    setTimeout(async () => {
      const run = VerificationEngine.verify({
        contentTitle: contentTitle.trim() || 'Untitled Content Draft',
        category,
        rawContent,
        brandProfile: selectedBrand,
        governanceRules: activeRules,
        knowledgeDocuments: documents,
        version: nextVersion,
      });

      setActiveRun(run);
      setSelectedFindingId(run.findings[0]?.id || null);
      setIsVerifying(false);

      // Persist run
      await storage.saveReview(run);
      await AuditLogger.log(
        'verification_run_executed',
        run.id,
        run.contentTitle,
        {
          version: run.version,
          overallResult: run.overallResult,
          findingsCount: run.findings.length,
          failCount: run.metrics.failCount,
        }
      );

      onSaveReview(run);
    }, 150);
  };

  // Handle human review sign-off decision
  const handleConfirmDecision = async (decision: {
    decision: 'approved' | 'rejected' | 'overridden_and_approved';
    reviewerLabel: string;
    notes?: string;
    overrideReason?: string;
    unresolvedBlockingFindingsOverridden?: string[];
  }) => {
    if (!activeRun) return;

    const nextStatus =
      decision.decision === 'rejected'
        ? 'rejected'
        : decision.decision === 'overridden_and_approved' || decision.decision === 'approved'
        ? 'approved'
        : 'analyzed';

    const updatedRun: VerificationRun = {
      ...activeRun,
      reviewStatus: nextStatus,
      humanReviewDecision: {
        ...decision,
        timestamp: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    setActiveRun(updatedRun);
    await storage.saveReview(updatedRun);

    if (decision.decision === 'overridden_and_approved') {
      await AuditLogger.log(
        'review_override_recorded',
        updatedRun.id,
        updatedRun.contentTitle,
        {
          reviewerLabel: decision.reviewerLabel,
          overrideReason: decision.overrideReason,
          overriddenFindings: decision.unresolvedBlockingFindingsOverridden,
        },
        decision.reviewerLabel
      );
    } else if (decision.decision === 'approved') {
      await AuditLogger.log(
        'review_approved',
        updatedRun.id,
        updatedRun.contentTitle,
        { reviewerLabel: decision.reviewerLabel, notes: decision.notes },
        decision.reviewerLabel
      );
    } else {
      await AuditLogger.log(
        'review_rejected',
        updatedRun.id,
        updatedRun.contentTitle,
        { reviewerLabel: decision.reviewerLabel, notes: decision.notes },
        decision.reviewerLabel
      );
    }

    onSaveReview(updatedRun);
    setSaveSuccessMsg(`Recorded human governance decision: ${decision.decision.replace(/_/g, ' ')}`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Highlight or scroll to text snippet when clicking a finding
  const handleSelectFinding = (finding: Finding) => {
    setSelectedFindingId(finding.id);
    if (textareaRef.current && typeof finding.startIndex === 'number' && typeof finding.endIndex === 'number') {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(finding.startIndex, finding.endIndex);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!activeRun) return;
    const blob = new Blob([JSON.stringify(activeRun, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verityx-review-${activeRun.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!activeRun) return;
    const headers = [
      'Finding ID',
      'Rule Name',
      'Severity',
      'Evidence Status',
      'Relevant Text',
      'Description',
      'Suggested Correction',
      'Supporting Source',
    ];
    const rows = activeRun.findings.map((f) => [
      `"${f.id}"`,
      `"${f.ruleName.replace(/"/g, '""')}"`,
      `"${f.severity}"`,
      `"${f.evidenceStatus}"`,
      `"${f.relevantText.replace(/"/g, '""')}"`,
      `"${f.description.replace(/"/g, '""')}"`,
      `"${(f.suggestedCorrection || '').replace(/"/g, '""')}"`,
      `"${(f.supportingEvidence?.documentTitle || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verityx-findings-${activeRun.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedFinding = activeRun?.findings.find((f) => f.id === selectedFindingId);

  return (
    <div className="space-y-6">
      <HonestyNotice compact />

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Workspace 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor & Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Content Meta Header */}
          <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Content Title
                </label>
                <input
                  type="text"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="e.g. Q4 Global Infrastructure Launch Copy"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Content Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-cyan-500 text-xs cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Profile & Knowledge Base Attachment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                  <span>Brand Profile</span>
                  <span className="text-[10px] text-cyan-400">
                    {selectedBrand ? `${selectedBrand.approvedTerminology.length} terms` : 'None'}
                  </span>
                </label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-cyan-500 text-xs cursor-pointer"
                >
                  <option value="">No Brand Profile (Generic Checks Only)</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                  <span>Grounding Reference Docs</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {documents.length} indexed
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.md,.markdown,.csv,.json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingDoc}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isUploadingDoc ? 'Parsing...' : 'Upload Reference File'}</span>
                  </button>
                </div>
              </div>
            </div>

            {uploadError && (
              <div className="p-2 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded">
                {uploadError}
              </div>
            )}
          </div>

          {/* Textarea Editor */}
          <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-200">Content Editor</span>
                {activeRun && (
                  <span className="font-mono text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
                    Version {activeRun.version}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="tabular-nums">{wordCount} words</span>
                <span className="text-slate-600">·</span>
                <span className="tabular-nums">{charCount} chars</span>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              rows={14}
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Paste or enter marketing copy, website copy, product announcements, email campaigns, or press releases here for verification..."
              className="w-full p-4 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-hidden text-xs leading-relaxed font-mono resize-y"
            />

            {/* Editor Action Strip */}
            <div className="p-4 bg-[#080d1a] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunVerification}
                  disabled={isVerifying || !rawContent.trim()}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    !rawContent.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : isVerifying
                      ? 'bg-cyan-600 text-white animate-pulse'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] shadow-sm shadow-cyan-500/20'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {isVerifying
                      ? 'Evaluating Local Rules...'
                      : activeRun
                      ? 'Re-Run Verification'
                      : 'Run Verification'}
                  </span>
                </button>

                {activeRun && previousRun && (
                  <button
                    type="button"
                    onClick={() => setIsDiffModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Compare with v{previousRun.version}</span>
                  </button>
                )}
              </div>

              {activeRun && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsApprovalModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Human Sign-Off</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPrintReport(activeRun)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Print Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Verification Results & Finding Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {!activeRun ? (
            <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Verification Run Yet</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
                Enter your marketing text on the left and click &quot;Run Verification&quot; to test brand terminology, required disclosures, and grounding.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                {rules.filter((r) => r.enabled).length} active governance rules loaded
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Executive Result Summary Header */}
              <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-slate-400">
                      Automated Scan Status
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {activeRun.overallResult === 'pass' && (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4" /> Passed Configured Checks
                        </div>
                      )}
                      {activeRun.overallResult === 'warning' && (
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                          <AlertTriangle className="w-4 h-4" /> Potential Risks Detected
                        </div>
                      )}
                      {activeRun.overallResult === 'fail' && (
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-sm">
                          <XCircle className="w-4 h-4" /> Blocking Violations Detected
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">
                      Human Review
                    </span>
                    <span className="text-xs font-semibold uppercase text-slate-200 font-mono">
                      {activeRun.reviewStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-4 gap-2 pt-3 text-center">
                  <div className="p-2 bg-slate-900/60 rounded">
                    <div className="text-[10px] font-mono text-slate-400">Blocking</div>
                    <div className="text-sm font-bold text-rose-400 font-mono tabular-nums">
                      {activeRun.metrics.failCount}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded">
                    <div className="text-[10px] font-mono text-slate-400">Warnings</div>
                    <div className="text-sm font-bold text-amber-400 font-mono tabular-nums">
                      {activeRun.metrics.warningCount}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded">
                    <div className="text-[10px] font-mono text-slate-400">Grounded</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                      {activeRun.metrics.claimsGrounded}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded">
                    <div className="text-[10px] font-mono text-slate-400">Unverified</div>
                    <div className="text-sm font-bold text-slate-300 font-mono tabular-nums">
                      {activeRun.metrics.unverifiedClaims}
                    </div>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Findings List */}
              <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Evaluation Findings ({activeRun.findings.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Click item to inspect</span>
                </div>

                {activeRun.findings.length === 0 ? (
                  <div className="p-6 text-center text-xs text-emerald-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-80" />
                    <p className="font-medium">No rule issues detected by configured checks.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ready for editorial and human review.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80 max-h-[360px] overflow-y-auto">
                    {activeRun.findings.map((f) => {
                      const isSelected = selectedFindingId === f.id;

                      return (
                        <div
                          key={f.id}
                          onClick={() => handleSelectFinding(f)}
                          className={`p-3 text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-slate-800/90 border-l-2 border-l-cyan-400'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-200 truncate">{f.ruleName}</span>
                            <span
                              className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                                f.severity === 'fail'
                                  ? 'text-rose-400 border-rose-800/80 bg-rose-950/60'
                                  : f.severity === 'warning'
                                  ? 'text-amber-400 border-amber-800/80 bg-amber-950/60'
                                  : 'text-emerald-400 border-emerald-800/80 bg-emerald-950/60'
                              }`}
                            >
                              {f.severity}
                            </span>
                          </div>

                          <div className="mt-1 font-mono text-[11px] text-slate-300 truncate">
                            &quot;{f.relevantText}&quot;
                          </div>

                          {f.suggestedCorrection && (
                            <div className="mt-1 text-[11px] text-cyan-300 flex items-center gap-1">
                              <ArrowRight className="w-3 h-3 text-cyan-400" />
                              <span className="truncate">Fix: {f.suggestedCorrection}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Finding Detail Inspector Drawer */}
              {selectedFinding && (
                <div className="bg-[#0a0f1f] border border-cyan-800/50 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-semibold text-cyan-300 text-xs">Finding Inspection</span>
                    <span className="font-mono text-[10px] text-slate-400">{selectedFinding.id}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                      Evaluated Rule
                    </span>
                    <p className="text-white font-medium">{selectedFinding.ruleName}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{selectedFinding.explanation}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                      Matched Phrase in Copy
                    </span>
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded font-mono text-slate-200">
                      &quot;{selectedFinding.relevantText}&quot;
                    </div>
                  </div>

                  {selectedFinding.suggestedCorrection && (
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                        Defensible Correction
                      </span>
                      <div className="p-2 bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 rounded font-mono">
                        {selectedFinding.suggestedCorrection}
                      </div>
                    </div>
                  )}

                  {selectedFinding.supportingEvidence && (
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                        Approved Evidence Source Match
                      </span>
                      <div className="p-2.5 bg-cyan-950/30 border border-cyan-800/60 rounded space-y-1">
                        <div className="flex items-center justify-between text-cyan-200 font-semibold">
                          <span>{selectedFinding.supportingEvidence.documentTitle}</span>
                          <span className="font-mono text-[10px] text-cyan-400">
                            {Math.round(selectedFinding.supportingEvidence.confidenceScore * 100)}% match
                          </span>
                        </div>
                        <div className="italic text-slate-300 text-[11px]">
                          {selectedFinding.supportingEvidence.matchedSnippet}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Version Diff Modal */}
      {activeRun && (
        <VersionDiffModal
          isOpen={isDiffModalOpen}
          onClose={() => setIsDiffModalOpen(false)}
          currentRun={activeRun}
          previousRun={previousRun}
        />
      )}

      {/* Human Approval Sign-off Modal */}
      {activeRun && (
        <ApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          review={activeRun}
          onConfirmDecision={handleConfirmDecision}
        />
      )}
    </div>
  );
};
