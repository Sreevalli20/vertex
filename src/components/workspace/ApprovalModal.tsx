/**
 * Human Approval & Governance Sign-off Modal
 * Enforces review lifecycle, blocking rule override requirements, and audit labels.
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { VerificationRun } from '../../types';
import { ShieldCheck, AlertOctagon, UserCheck, XCircle } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: VerificationRun;
  onConfirmDecision: (decision: {
    decision: 'approved' | 'rejected' | 'overridden_and_approved';
    reviewerLabel: string;
    notes?: string;
    overrideReason?: string;
    unresolvedBlockingFindingsOverridden?: string[];
  }) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  review,
  onConfirmDecision,
}) => {
  const [reviewerLabel, setReviewerLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'override'>('approve');
  const [formError, setFormError] = useState<string | null>(null);

  const blockingFindings = review.findings.filter((f) => f.severity === 'fail');
  const hasBlockingFindings = blockingFindings.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!reviewerLabel.trim()) {
      setFormError('Please enter a reviewer identifier or display name for the audit trail.');
      return;
    }

    if (selectedAction === 'approve' && hasBlockingFindings) {
      setFormError('Cannot approve content with unresolved blocking violations. You must record an explicit override reason or reject.');
      return;
    }

    if (selectedAction === 'override') {
      if (!overrideReason.trim() || overrideReason.trim().length < 10) {
        setFormError('Mandatory override reason requires at least 10 characters detailing the legal or governance exception.');
        return;
      }

      onConfirmDecision({
        decision: 'overridden_and_approved',
        reviewerLabel: reviewerLabel.trim(),
        notes: notes.trim() || undefined,
        overrideReason: overrideReason.trim(),
        unresolvedBlockingFindingsOverridden: blockingFindings.map((f) => f.id),
      });
      onClose();
      return;
    }

    if (selectedAction === 'reject') {
      onConfirmDecision({
        decision: 'rejected',
        reviewerLabel: reviewerLabel.trim(),
        notes: notes.trim() || undefined,
      });
      onClose();
      return;
    }

    // Standard approval
    onConfirmDecision({
      decision: 'approved',
      reviewerLabel: reviewerLabel.trim(),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Human Governance Decision"
      subtitle="Manual sign-off lifecycle for content publication."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Audit Identity Notice */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
          <div className="flex items-center gap-2 font-medium text-slate-200 mb-1">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Audit Label Notice</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            In this local environment, the reviewer name entered below acts as an audit log label for traceability, not cryptographically verified authentication.
          </p>
        </div>

        {/* Blocking findings banner if present */}
        {hasBlockingFindings && (
          <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-lg text-rose-200">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>{blockingFindings.length} Unresolved Blocking Violations</span>
            </div>
            <p className="text-[11px] text-rose-300/90">
              Standard publication approval is locked. To publish anyway, you must explicitly select &quot;Record Authorized Override&quot; and enter an audited exception justification.
            </p>
          </div>
        )}

        {/* Decision Selection */}
        <div>
          <label className="block text-slate-300 font-semibold mb-2">Select Human Decision</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={hasBlockingFindings}
              onClick={() => {
                setSelectedAction('approve');
                setFormError(null);
              }}
              className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                hasBlockingFindings
                  ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/50 text-slate-500'
                  : selectedAction === 'approve'
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Approve</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 mt-2">Passes all checks without overrides</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedAction('override');
                setFormError(null);
              }}
              className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                selectedAction === 'override'
                  ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Record Override</span>
                <AlertOctagon className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-[10px] text-slate-400 mt-2">Approve with mandatory exception reason</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedAction('reject');
                setFormError(null);
              }}
              className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                selectedAction === 'reject'
                  ? 'border-rose-500 bg-rose-950/40 text-rose-200'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Reject</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-[10px] text-slate-400 mt-2">Requires revision before publication</span>
            </button>
          </div>
        </div>

        {/* Reviewer Identifier */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Reviewer Identifier / Display Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={reviewerLabel}
            onChange={(e) => setReviewerLabel(e.target.value)}
            placeholder="e.g., Sarah Chen (Brand Director) or ID-4092"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
          />
        </div>

        {/* Override reason (only if override selected) */}
        {selectedAction === 'override' && (
          <div>
            <label className="block text-amber-300 font-semibold mb-1">
              Mandatory Override Justification <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="State the legal counsel sign-off, contractual exemption, or specific factual grounds for overriding unresolved blocking findings..."
              className="w-full px-3 py-2 bg-slate-950 border border-amber-800/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-400 text-xs"
            />
          </div>
        )}

        {/* General Notes */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Governance Notes (Optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional context for editorial archives..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
          />
        </div>

        {formError && (
          <div className="p-2.5 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-lg">
            {formError}
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              selectedAction === 'reject'
                ? 'bg-rose-500 hover:bg-rose-400 text-white'
                : selectedAction === 'override'
                ? 'bg-amber-500 hover:bg-amber-400 text-[#080d1a]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-[#080d1a]'
            }`}
          >
            Confirm Decision
          </button>
        </div>
      </form>
    </Modal>
  );
};
