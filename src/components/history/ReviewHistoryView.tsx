/**
 * Review History View
 * Persistent ledger of past verification runs, export actions, and print report shortcuts.
 */

import React, { useState } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Printer,
  Trash2,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { VerificationRun } from '../../types';
import { storage } from '../../lib/storage/indexedDb';
import { AuditLogger } from '../../lib/audit/auditLogger';

interface ReviewHistoryViewProps {
  reviews: VerificationRun[];
  onSelectReview: (review: VerificationRun) => void;
  onOpenPrintReport: (review: VerificationRun) => void;
  onRefresh: () => void;
}

export const ReviewHistoryView: React.FC<ReviewHistoryViewProps> = ({
  reviews,
  onSelectReview,
  onOpenPrintReport,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      r.contentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.brandProfileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.reviewStatus === statusFilter;
    const matchesResult = resultFilter === 'all' || r.overallResult === resultFilter;

    return matchesSearch && matchesStatus && matchesResult;
  });

  const handleDelete = async (review: VerificationRun) => {
    if (!window.confirm(`Delete review "${review.contentTitle}"?`)) return;

    await storage.deleteReview(review.id);
    await AuditLogger.log('review_deleted', review.id, review.contentTitle);
    onRefresh();
  };

  const handleExportJSON = (review: VerificationRun) => {
    const blob = new Blob([JSON.stringify(review, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verityx-review-${review.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = (review: VerificationRun) => {
    const headers = ['Finding ID', 'Rule Name', 'Severity', 'Relevant Text', 'Explanation'];
    const rows = review.findings.map((f) => [
      `"${f.id}"`,
      `"${f.ruleName.replace(/"/g, '""')}"`,
      `"${f.severity}"`,
      `"${f.relevantText.replace(/"/g, '""')}"`,
      `"${f.explanation.replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verityx-review-${review.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1f] border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Verification Review History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Persisted records of all evaluated marketing content, finding breakdowns, and human sign-off status.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Persisted: <span className="text-cyan-300 font-bold">{reviews.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0a0f1f] border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by content title, brand profile, or category..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="analyzed">Analyzed</option>
            <option value="changes_required">Changes Required</option>
            <option value="ready_for_review">Ready for Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Results</option>
            <option value="pass">Pass</option>
            <option value="warning">Warning</option>
            <option value="fail">Fail</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {reviews.length === 0 ? (
        <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Review History Recorded</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Verification runs performed in the workspace are automatically persisted here in IndexedDB.
          </p>
        </div>
      ) : (
        <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080d1a] border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Content Title &amp; Brand</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Findings</th>
                  <th className="px-4 py-3">Governance Status</th>
                  <th className="px-4 py-3">Audited</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredReviews.map((rev) => {
                  const dateStr = new Date(rev.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={rev.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white group-hover:text-cyan-300">
                          {rev.contentTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {rev.brandProfileName} · v{rev.version}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-300">
                        {rev.category}
                      </td>

                      <td className="px-4 py-3">
                        {rev.overallResult === 'pass' && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> Pass
                          </span>
                        )}
                        {rev.overallResult === 'warning' && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" /> Warning
                          </span>
                        )}
                        {rev.overallResult === 'fail' && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3" /> Fail
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-300 tabular-nums">
                        {rev.findings.length} item{rev.findings.length !== 1 ? 's' : ''}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-300">
                          {rev.reviewStatus.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectReview(rev)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Open in Workspace"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenPrintReport(rev)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Print / View Executive Report"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExportJSON(rev)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Export JSON"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rev)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
