/**
 * Overview Dashboard
 * Displays real statistics calculated strictly from locally saved IndexedDB records.
 * Zero fabricated numbers, zero synthetic activity.
 */

import React from 'react';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  ListFilter,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { VerificationRun } from '../../types';
import { NavigationPage } from '../common/Sidebar';
import { HonestyNotice } from '../common/HonestyNotice';

interface DashboardViewProps {
  reviews: VerificationRun[];
  onNavigate: (page: NavigationPage) => void;
  onSelectReview: (review: VerificationRun) => void;
  onLoadSampleData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  reviews,
  onNavigate,
  onSelectReview,
  onLoadSampleData,
}) => {
  // Compute actual real statistics from persisted reviews
  const totalReviews = reviews.length;
  const requiringAttention = reviews.filter(
    (r) => r.reviewStatus === 'changes_required' || r.reviewStatus === 'ready_for_review'
  ).length;
  const passedReviews = reviews.filter((r) => r.overallResult === 'pass').length;

  let unresolvedFindingsCount = 0;
  const ruleViolationCounts: Record<string, { name: string; count: number; severity: string }> = {};

  for (const r of reviews) {
    if (r.reviewStatus !== 'approved') {
      for (const finding of r.findings) {
        if (finding.severity === 'fail' || finding.severity === 'warning') {
          unresolvedFindingsCount++;
        }
      }
    }

    // Tally all rule violations for frequency chart
    for (const finding of r.findings) {
      if (finding.severity === 'fail' || finding.severity === 'warning') {
        const key = finding.ruleId || finding.ruleName;
        if (!ruleViolationCounts[key]) {
          ruleViolationCounts[key] = {
            name: finding.ruleName,
            count: 0,
            severity: finding.severity,
          };
        }
        ruleViolationCounts[key].count++;
      }
    }
  }

  // Sort violations by frequency
  const topViolations = Object.values(ruleViolationCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentReviews = reviews.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <HonestyNotice />

      {/* Actual Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <div className="p-5 bg-[#0a0f1f] border border-slate-800 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 font-mono">
              Total Reviews
            </span>
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
              {totalReviews}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {totalReviews === 0 ? 'No local reviews stored' : 'Locally persisted in IndexedDB'}
            </p>
          </div>
        </div>

        {/* Requiring Attention */}
        <div className="p-5 bg-[#0a0f1f] border border-slate-800 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 font-mono">
              Requires Attention
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-amber-400 font-mono tabular-nums">
              {requiringAttention}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Changes required or awaiting sign-off
            </p>
          </div>
        </div>

        {/* Passed Checks */}
        <div className="p-5 bg-[#0a0f1f] border border-slate-800 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 font-mono">
              Passed Checks
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-emerald-400 font-mono tabular-nums">
              {passedReviews}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Zero rule violations detected
            </p>
          </div>
        </div>

        {/* Unresolved Findings */}
        <div className="p-5 bg-[#0a0f1f] border border-slate-800 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 font-mono">
              Unresolved Findings
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-rose-400 font-mono tabular-nums">
              {unresolvedFindingsCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Open blocking or warning items
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Activity & Frequent Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Review Activity (2 columns) */}
        <div className="lg:col-span-2 bg-[#0a0f1f] border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Verification Activity</h2>
              <p className="text-xs text-slate-400">Calculated from saved verification runs</p>
            </div>
            {totalReviews > 0 && (
              <button
                onClick={() => onNavigate('history')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>View All History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {totalReviews === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-800/80 rounded-lg">
              <Layers className="w-10 h-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-medium text-slate-200">No verification reviews yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
                Paste marketing copy in the Verification Workspace to evaluate brand guidelines and knowledge grounding.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('workspace')}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Open Workspace
                </button>
                <button
                  onClick={onLoadSampleData}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Load Sample Demo Data</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {recentReviews.map((rev) => {
                const dateFormatted = new Date(rev.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={rev.id}
                    onClick={() => onSelectReview(rev)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate group-hover:text-cyan-300">
                          {rev.contentTitle}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {rev.brandProfileName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span className="font-mono">{rev.category}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{rev.metrics.wordCount} words</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="font-mono tabular-nums">{dateFormatted}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {rev.overallResult === 'pass' && (
                        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                          Pass
                        </span>
                      )}
                      {rev.overallResult === 'warning' && (
                        <span className="text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                          {rev.metrics.warningCount} Warning{rev.metrics.warningCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {rev.overallResult === 'fail' && (
                        <span className="text-[11px] font-medium text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
                          {rev.metrics.failCount} Failing
                        </span>
                      )}

                      <span className="text-xs text-slate-400 uppercase font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">
                        {rev.reviewStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most Frequent Rule Violations */}
        <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="pb-4 border-b border-slate-800 mb-4">
            <h2 className="text-sm font-semibold text-white">Most Frequent Rule Violations</h2>
            <p className="text-xs text-slate-400">Ranked across verified records</p>
          </div>

          {topViolations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <ListFilter className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">No violations recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {topViolations.map((v, idx) => (
                <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-200 truncate pr-2">{v.name}</span>
                    <span className="font-mono tabular-nums text-slate-300 font-semibold shrink-0">
                      {v.count} hit{v.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${
                        v.severity === 'fail' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (v.count / Math.max(1, totalReviews)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <button
              onClick={() => onNavigate('rules')}
              className="w-full py-2 px-3 text-xs text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors text-center cursor-pointer"
            >
              Configure Governance Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
