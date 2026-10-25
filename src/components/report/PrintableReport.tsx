/**
 * Printable Executive Governance Report
 * Formats review data for client-side print-to-PDF and export.
 */

import React from 'react';
import { Printer, ArrowLeft, Shield, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { VerificationRun } from '../../types';

interface PrintableReportProps {
  review: VerificationRun;
  onBack: () => void;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ review, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Toolbar (hidden during print) */}
      <div className="no-print flex items-center justify-between bg-[#0a0f1f] border border-slate-800 p-4 rounded-xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Ready to save as PDF or print</span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-xs font-semibold text-[#080d1a] bg-cyan-400 hover:bg-cyan-300 px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="print-page bg-white text-slate-900 border border-slate-200 rounded-xl p-8 shadow-sm space-y-8 font-sans">
        {/* Report Header */}
        <div className="border-b border-slate-300 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
              <Shield className="w-4 h-4 text-cyan-600" />
              <span>VERITYX AI · Content Governance &amp; Brand Integrity Audit</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {review.contentTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2 font-mono">
              <span>Review ID: {review.id}</span>
              <span>·</span>
              <span>Category: {review.category}</span>
              <span>·</span>
              <span>Audited: {formattedDate}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase font-mono text-slate-500">Overall Result</div>
            <div className="mt-1">
              {review.overallResult === 'pass' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded">
                  <CheckCircle2 className="w-4 h-4" /> Passed All Checks
                </span>
              )}
              {review.overallResult === 'warning' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded">
                  <AlertTriangle className="w-4 h-4" /> Warnings Detected
                </span>
              )}
              {review.overallResult === 'fail' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1 rounded">
                  <XCircle className="w-4 h-4" /> Governance Violations
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <div>
            <div className="text-xs text-slate-500 font-mono">Word Count</div>
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {review.metrics.wordCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-mono">Rules Evaluated</div>
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {review.metrics.rulesEvaluatedCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-mono">Grounded Claims</div>
            <div className="text-lg font-bold text-emerald-700 font-mono tabular-nums">
              {review.metrics.claimsGrounded}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-mono">Blocking Issues</div>
            <div className="text-lg font-bold text-rose-700 font-mono tabular-nums">
              {review.metrics.failCount}
            </div>
          </div>
        </div>

        {/* Human Approval Status */}
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <h2 className="text-xs uppercase font-mono font-bold text-slate-700 mb-2">
            Human Governance Decision
          </h2>
          {review.humanReviewDecision ? (
            <div className="space-y-2 text-xs text-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Decision:</span>
                <span className="capitalize font-mono font-bold text-slate-900">
                  {review.humanReviewDecision.decision.replace(/_/g, ' ')}
                </span>
                <span>·</span>
                <span className="text-slate-600">Reviewer Label:</span>
                <span className="font-medium">{review.humanReviewDecision.reviewerLabel}</span>
                <span>·</span>
                <span className="text-slate-600 font-mono">
                  {new Date(review.humanReviewDecision.timestamp).toLocaleString()}
                </span>
              </div>
              {review.humanReviewDecision.overrideReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
                  <span className="font-semibold block mb-0.5">Recorded Override Justification:</span>
                  <p>{review.humanReviewDecision.overrideReason}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-600 italic">
              Status: {review.reviewStatus.replace(/_/g, ' ')} — Awaiting formal human sign-off.
            </p>
          )}
        </div>

        {/* Content Under Review */}
        <div>
          <h2 className="text-xs uppercase font-mono font-bold text-slate-700 mb-2">
            Verified Content Text
          </h2>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 font-mono whitespace-pre-wrap">
            {review.rawContent}
          </div>
        </div>

        {/* Detailed Findings & Evidence Citations */}
        <div>
          <h2 className="text-xs uppercase font-mono font-bold text-slate-700 mb-3">
            Evaluation Findings &amp; Evidence Grounding ({review.findings.length})
          </h2>

          {review.findings.length === 0 ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
              No rule violations or unverified claims detected by configured checks.
            </div>
          ) : (
            <div className="space-y-3">
              {review.findings.map((f, i) => (
                <div
                  key={f.id || i}
                  className={`p-4 border rounded-lg text-xs space-y-2 ${
                    f.severity === 'fail'
                      ? 'border-rose-300 bg-rose-50/50 text-rose-950'
                      : f.severity === 'warning'
                      ? 'border-amber-300 bg-amber-50/50 text-amber-950'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{f.ruleName}</span>
                    <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded border font-semibold">
                      {f.severity}
                    </span>
                  </div>

                  <p className="text-slate-800">{f.description}</p>

                  <div className="bg-white/80 p-2 border border-slate-200 rounded font-mono text-[11px]">
                    <span className="text-slate-500 font-sans block text-[10px] uppercase font-bold">
                      Flagged Phrase / Claim:
                    </span>
                    &quot;{f.relevantText}&quot;
                  </div>

                  {f.suggestedCorrection && (
                    <div className="text-[11px] text-emerald-900 bg-emerald-50/80 p-2 border border-emerald-200 rounded">
                      <span className="font-bold">Suggested Correction:</span> {f.suggestedCorrection}
                    </div>
                  )}

                  {f.supportingEvidence && (
                    <div className="text-[11px] text-slate-800 bg-cyan-50/80 p-2 border border-cyan-200 rounded">
                      <span className="font-bold text-cyan-950">Grounding Evidence:</span> Found in &quot;
                      {f.supportingEvidence.documentTitle}&quot; (Confidence: {Math.round(f.supportingEvidence.confidenceScore * 100)}%)
                      <div className="italic text-slate-700 mt-1">
                        {f.supportingEvidence.matchedSnippet}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Limitations & Legal Notice */}
        <div className="p-4 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 text-[11px] leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Info className="w-3.5 h-3.5 text-slate-700" />
            <span>Verification Limitations &amp; Scope</span>
          </div>
          <p>
            This governance review was performed using deterministic client-side evaluation against user-configured brand rules and locally stored reference documents. Lack of evidence indicates an unverified claim, not proof of falsity. This report does not constitute a certificate of legal compliance, guarantee against regulatory enforcement, or comprehensive verification of arbitrary real-world facts.
          </p>
        </div>
      </div>
    </div>
  );
};
