/**
 * Governance Rules Management View
 * Allows authors and admins to inspect, configure, test, and toggle deterministic rules.
 */

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit2,
  Trash2,
  Power,
  Shield,
} from 'lucide-react';
import { GovernanceRule, RuleCategory } from '../../types';
import { RuleEditorModal } from './RuleEditorModal';
import { storage } from '../../lib/storage/indexedDb';
import { AuditLogger } from '../../lib/audit/auditLogger';

interface GovernanceRulesViewProps {
  rules: GovernanceRule[];
  onRefresh: () => void;
}

export const GovernanceRulesView: React.FC<GovernanceRulesViewProps> = ({
  rules,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<GovernanceRule | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const filteredRules = rules.filter((r) => {
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesSearch =
      searchTerm.trim() === '' ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pattern.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleRule = async (rule: GovernanceRule) => {
    const updatedRule: GovernanceRule = {
      ...rule,
      enabled: !rule.enabled,
      updatedAt: new Date().toISOString(),
    };
    await storage.saveRule(updatedRule);
    await AuditLogger.log(
      'governance_rule_toggled',
      rule.id,
      rule.name,
      { enabled: updatedRule.enabled }
    );
    onRefresh();
  };

  const handleSaveRule = async (rule: GovernanceRule) => {
    const isNew = !rules.some((r) => r.id === rule.id);
    await storage.saveRule(rule);
    await AuditLogger.log(
      isNew ? 'governance_rule_created' : 'governance_rule_updated',
      rule.id,
      rule.name,
      { category: rule.category, severity: rule.severity, ruleType: rule.ruleType }
    );
    setActionSuccess(`Saved rule "${rule.name}"`);
    setTimeout(() => setActionSuccess(null), 3000);
    onRefresh();
  };

  const handleDeleteRule = async (rule: GovernanceRule) => {
    if (!window.confirm(`Delete governance rule "${rule.name}"?`)) return;

    await storage.deleteRule(rule.id);
    await AuditLogger.log('governance_rule_deleted', rule.id, rule.name);
    setActionSuccess(`Deleted rule "${rule.name}"`);
    setTimeout(() => setActionSuccess(null), 3000);
    onRefresh();
  };

  const getSeverityBadge = (severity: GovernanceRule['severity']) => {
    switch (severity) {
      case 'fail':
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-rose-800/80 bg-rose-950/60 text-rose-300 font-semibold">
            Fail (Blocking)
          </span>
        );
      case 'warning':
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-amber-800/80 bg-amber-950/60 text-amber-300 font-semibold">
            Warning
          </span>
        );
      case 'info':
      default:
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-cyan-800/80 bg-cyan-950/60 text-cyan-300 font-semibold">
            Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1f] border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            <span>Governance Rules Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic rules executed during content verification. Malformed regular expressions are validated safely.
          </p>
        </div>

        <button
          onClick={() => {
            setRuleToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Rule</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0a0f1f] border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search rules by title, pattern, or description..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Categories ({rules.length})</option>
            <option value="brand_consistency">Brand Consistency</option>
            <option value="content_integrity">Content Integrity</option>
            <option value="governance">Governance</option>
            <option value="legal_compliance">Legal Compliance</option>
            <option value="performance_claims">Performance Claims</option>
          </select>
        </div>
      </div>

      {/* Rules Table / Cards */}
      <div className="space-y-3">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 rounded-xl border transition-colors ${
              rule.enabled
                ? 'bg-[#0a0f1f] border-slate-800'
                : 'bg-[#080d1a] border-slate-900 opacity-60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-xs text-white">{rule.name}</h3>
                  {getSeverityBadge(rule.severity)}
                  <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                    {rule.ruleType.replace(/_/g, ' ')}
                  </span>
                  {rule.isBuiltIn && (
                    <span className="text-[10px] font-mono text-cyan-400">Standard Rule</span>
                  )}
                </div>

                <p className="text-xs text-slate-400">{rule.description}</p>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleRule(rule)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                    rule.enabled
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/40'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                >
                  <Power className="w-3 h-3" />
                  <span className="font-mono text-[10px] uppercase">
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setRuleToEdit(rule);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Edit Rule"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {!rule.isBuiltIn && (
                  <button
                    onClick={() => handleDeleteRule(rule)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Rule Pattern and Replacement details */}
            <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {rule.pattern && (
                <div className="p-2 bg-slate-950 border border-slate-800/80 rounded font-mono text-[11px] text-slate-300 truncate">
                  <span className="text-[10px] uppercase text-slate-500 block font-sans font-bold">
                    Pattern
                  </span>
                  {rule.pattern}
                </div>
              )}

              {rule.replacement && (
                <div className="p-2 bg-slate-950 border border-slate-800/80 rounded font-mono text-[11px] text-emerald-300 truncate">
                  <span className="text-[10px] uppercase text-slate-500 block font-sans font-bold">
                    Suggested Alternative
                  </span>
                  {rule.replacement}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rule Editor Modal */}
      <RuleEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ruleToEdit={ruleToEdit}
        onSave={handleSaveRule}
      />
    </div>
  );
};
