/**
 * Version Comparison Modal
 * Compares findings and metrics between two verification runs.
 */

import React from 'react';
import { Modal } from '../common/Modal';
import { VerificationRun } from '../../types';
import { CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';

interface VersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRun: VerificationRun;
  previousRun: VerificationRun | null;
}

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  isOpen,
  onClose,
  currentRun,
  previousRun,
}) => {
  if (!previousRun) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Version Comparison" maxWidth="lg">
        <div className="text-center py-6 text-xs text-slate-400">
          No previous version available to compare. Re-run verification on modified content to generate version comparison.
        </div>
      </Modal>
    );
  }

  // Find resolved findings (were in previous run, but no longer in current run)
  const currentFindingRules = new Set(currentRun.findings.map((f) => f.ruleId));
  const previousFindingRules = new Set(previousRun.findings.map((f) => f.ruleId));

  const resolvedFindings = previousRun.findings.filter((f) => !currentFindingRules.has(f.ruleId));
  const newFindings = currentRun.findings.filter((f) => !previousFindingRules.has(f.ruleId));
  const persistingFindings = currentRun.findings.filter((f) => previousFindingRules.has(f.ruleId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verification Version Comparison"
      subtitle={`Comparing Version ${currentRun.version} with Version ${previousRun.version}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Metric comparison strip */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg text-center text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Resolved Issues</div>
            <div className="text-base font-bold text-emerald-400 font-mono tabular-nums">
              +{resolvedFindings.length}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">New Issues</div>
            <div className="text-base font-bold text-rose-400 font-mono tabular-nums">
              +{newFindings.length}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Persisting Issues</div>
            <div className="text-base font-bold text-amber-400 font-mono tabular-nums">
              {persistingFindings.length}
            </div>
          </div>
        </div>

        {/* Resolved findings section */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Resolved in Current Version ({resolvedFindings.length})</span>
          </div>

          {resolvedFindings.length === 0 ? (
            <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded text-xs text-slate-400">
              No previous issues were marked resolved.
            </div>
          ) : (
            <div className="space-y-1.5">
              {resolvedFindings.map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 bg-emerald-950/20 border border-emerald-800/40 rounded text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-emerald-200">{f.ruleName}</span>
                    <span className="text-slate-400 block text-[11px]">
                      &quot;{f.relevantText}&quot; was corrected or removed.
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Resolved</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New findings section */}
        {newFindings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
              <PlusCircle className="w-4 h-4" />
              <span>Newly Introduced Issues ({newFindings.length})</span>
            </div>
            <div className="space-y-1.5">
              {newFindings.map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 bg-rose-950/20 border border-rose-800/40 rounded text-xs"
                >
                  <div className="font-medium text-rose-200">{f.ruleName}</div>
                  <div className="text-slate-400 text-[11px]">&quot;{f.relevantText}&quot;</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Persisting findings section */}
        {persistingFindings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>Remaining Issues ({persistingFindings.length})</span>
            </div>
            <div className="space-y-1.5">
              {persistingFindings.map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 bg-slate-900/60 border border-slate-800 rounded text-xs"
                >
                  <div className="font-medium text-slate-200">{f.ruleName}</div>
                  <div className="text-slate-400 text-[11px]">&quot;{f.relevantText}&quot;</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
