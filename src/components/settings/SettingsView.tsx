/**
 * Settings & Data Management View
 * Full database backup, schema-validated import, data purge, and capability disclosure.
 */

import React, { useState, useRef } from 'react';
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  Lock,
} from 'lucide-react';
import { storage } from '../../lib/storage/indexedDb';
import { AuditLogger } from '../../lib/audit/auditLogger';
import { ExportDataPackage } from '../../types';
import { Modal } from '../common/Modal';

interface SettingsViewProps {
  onRefreshAll: () => void;
  onLoadSampleData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onRefreshAll,
  onLoadSampleData,
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full JSON Export
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const data = await storage.exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verityx-governance-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      await AuditLogger.log(
        'data_exported',
        'export-full',
        'Complete Database Backup',
        {
          brandsCount: data.brands.length,
          rulesCount: data.rules.length,
          documentsCount: data.documents.length,
          reviewsCount: data.reviews.length,
        }
      );

      setFeedback({
        type: 'success',
        message: 'Successfully exported full local database backup file.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Import JSON with Schema Validation
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setFeedback(null);

    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Selected file is not valid JSON.');
      }

      const pkg = parsed as ExportDataPackage;
      const res = await storage.importData(pkg);

      await AuditLogger.log(
        'data_imported',
        'import-full',
        'Database Backup Restored',
        res.counts
      );

      setFeedback({
        type: 'success',
        message: res.message,
      });
      onRefreshAll();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Import failed: ${err instanceof Error ? err.message : 'Invalid backup schema'}`,
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clear Database
  const handleConfirmClear = async () => {
    if (confirmInput !== 'DELETE ALL DATA') {
      return;
    }

    try {
      await storage.clearAllData();
      await storage.initialize(); // restore default built-in rules
      await AuditLogger.log('database_cleared', 'db-purge', 'All User Records Purged');
      setIsClearModalOpen(false);
      setConfirmInput('');
      setFeedback({
        type: 'success',
        message: 'All local records deleted and built-in rules reinitialized.',
      });
      onRefreshAll();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Failed to clear storage: ${err instanceof Error ? err.message : 'Storage error'}`,
      });
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="bg-[#0a0f1f] border border-slate-800 p-5 rounded-xl">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>Platform Settings &amp; Data Management</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Control local IndexedDB persistence, perform full portable backups, or load tutorial samples.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 text-xs rounded-lg flex items-center gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="p-5 bg-[#0a0f1f] border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Full Data Export (Backup)</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Downloads a complete JSON export of all configured brand profiles, governance rules, indexed knowledge documents, review runs, and append-only audit events.
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isExporting ? 'Exporting...' : 'Export Complete Backup (JSON)'}</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="p-5 bg-[#0a0f1f] border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Restore Backup</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Restores brand guidelines, governance rules, and reference documents from a previously exported VERITYX backup file with schema validation.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isImporting ? 'Validating...' : 'Import Backup File'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial / Demo Data Seeder */}
      <div className="p-5 bg-[#0a0f1f] border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold text-xs">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Interactive Onboarding &amp; Tutorial Dataset</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">
          Load clearly labeled sample data (&quot;AuraCloud Enterprise&quot; brand profile, audited Q3 performance benchmark documents, and a test marketing campaign containing sample violations) to explore deterministic verification in action.
        </p>

        <div className="pt-2">
          <button
            onClick={onLoadSampleData}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm shadow-cyan-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Demo Dataset</span>
          </button>
        </div>
      </div>

      {/* Honest Capability & Limitations Ledger */}
      <div className="p-5 bg-[#0a0f1f] border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-xs">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Architecture &amp; Deterministic Capabilities Disclosure</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
            <span className="font-semibold text-emerald-400 block font-mono text-[11px] uppercase">
              What VERITYX AI Does
            </span>
            <ul className="text-slate-300 space-y-1 text-[11px] list-disc list-inside">
              <li>100% deterministic, local-first rule evaluations.</li>
              <li>Evaluates prohibited terms, product names, and disclaimers.</li>
              <li>Extracts numerical and multiplier claims (&quot;99.99%&quot;, &quot;4.2x&quot;).</li>
              <li>Grounds claims via lexical token matching in approved docs.</li>
              <li>Enforces human review lifecycle with mandatory override logs.</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
            <span className="font-semibold text-amber-400 block font-mono text-[11px] uppercase">
              Current Deterministic Boundaries
            </span>
            <ul className="text-slate-300 space-y-1 text-[11px] list-disc list-inside">
              <li>Does not query external real-world web fact checkers.</li>
              <li>Does not guarantee formal legal/regulatory compliance.</li>
              <li>Unverified claims indicate lack of evidence, not proof of falsity.</li>
              <li>Local reviewer names are audit labels, not cryptographic auth.</li>
              <li>Does not transmit proprietary copy to remote cloud servers.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Danger Zone: Clear Storage */}
      <div className="p-5 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Danger Zone: Purge Local Storage</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">
          Permanently wipes all local brand profiles, uploaded documents, verification records, and audit events from your browser&apos;s IndexedDB. Built-in governance rules will be restored to their factory defaults.
        </p>

        <button
          onClick={() => setIsClearModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Purge All Local Records</span>
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirm Complete Data Purge"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            This action cannot be undone. All locally stored brands, uploaded knowledge documents, verification runs, and audit logs will be permanently deleted from this browser.
          </p>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Type <strong className="text-rose-400 font-mono">DELETE ALL DATA</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="DELETE ALL DATA"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-hidden focus:border-rose-500 text-xs font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              onClick={() => setIsClearModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClear}
              disabled={confirmInput !== 'DELETE ALL DATA'}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Confirm and Purge
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
