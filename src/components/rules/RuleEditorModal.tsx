/**
 * Governance Rule Editor Modal
 * Create or configure deterministic rules with instant safe pattern testing.
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { GovernanceRule, RuleCategory, RuleType, SeverityLevel } from '../../types';
import { VerificationEngine } from '../../lib/engine/verificationEngine';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface RuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit: GovernanceRule | null;
  onSave: (rule: GovernanceRule) => void;
}

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({
  isOpen,
  onClose,
  ruleToEdit,
  onSave,
}) => {
  const [name, setName] = useState(ruleToEdit?.name || '');
  const [description, setDescription] = useState(ruleToEdit?.description || '');
  const [category, setCategory] = useState<RuleCategory>(ruleToEdit?.category || 'governance');
  const [severity, setSeverity] = useState<SeverityLevel>(ruleToEdit?.severity || 'warning');
  const [ruleType, setRuleType] = useState<RuleType>(ruleToEdit?.ruleType || 'prohibited_phrase');
  const [pattern, setPattern] = useState(ruleToEdit?.pattern || '');
  const [replacement, setReplacement] = useState(ruleToEdit?.replacement || '');
  const [explanation, setExplanation] = useState(ruleToEdit?.explanation || '');
  const [enabled, setEnabled] = useState(ruleToEdit?.enabled ?? true);

  // Safe pattern test state
  const [testSampleText, setTestSampleText] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleTestPattern = () => {
    setTestResult(null);
    if (!pattern.trim()) {
      setTestResult('Please enter a pattern to test.');
      return;
    }
    if (!testSampleText.trim()) {
      setTestResult('Please enter sample test text.');
      return;
    }

    try {
      if (ruleType === 'regex_pattern' || ruleType === 'prohibited_phrase' || ruleType === 'absolute_language') {
        const regex = VerificationEngine.compileSafeRegex(pattern);
        if (!regex) {
          setTestResult('Error: Invalid regular expression syntax.');
          return;
        }
        const matches = testSampleText.match(regex);
        if (matches && matches.length > 0) {
          setTestResult(`Match detected: Found ${matches.length} instance(s): "${matches.join('", "')}"`);
        } else {
          setTestResult('No match detected in sample text.');
        }
      } else if (ruleType === 'exact_phrase_required' || ruleType === 'required_disclaimer') {
        const isMatch = VerificationEngine.checkFuzzyOrExactMatch(testSampleText, pattern, 0.85);
        if (isMatch) {
          setTestResult('Phrase verified: Found in sample text.');
        } else {
          setTestResult('Phrase missing: Not detected in sample text.');
        }
      } else {
        setTestResult('Rule syntax is valid.');
      }
    } catch (e) {
      setTestResult(`Evaluation error: ${e instanceof Error ? e.message : 'Invalid pattern'}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please provide a Rule Name.');
      return;
    }

    // Validate regex if regex rule
    if (ruleType === 'regex_pattern' || ruleType === 'prohibited_phrase' || ruleType === 'absolute_language') {
      if (pattern.trim()) {
        const regex = VerificationEngine.compileSafeRegex(pattern);
        if (!regex) {
          setFormError('Invalid regular expression pattern. Please check bracket balance and escaping.');
          return;
        }
      }
    }

    const rule: GovernanceRule = {
      id: ruleToEdit?.id || `rule-custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      severity,
      ruleType,
      pattern: pattern.trim(),
      replacement: replacement.trim() || undefined,
      explanation: explanation.trim() || description.trim(),
      enabled,
      isBuiltIn: ruleToEdit?.isBuiltIn ?? false,
      createdAt: ruleToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(rule);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ruleToEdit ? 'Edit Governance Rule' : 'Create Governance Rule'}
      subtitle="Define deterministic criteria, matching patterns, and author feedback."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Rule Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Prohibit Unsubstantiated Green / Eco Claims"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RuleCategory)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-cyan-500 text-xs cursor-pointer"
            >
              <option value="brand_consistency">Brand Consistency</option>
              <option value="content_integrity">Content Integrity</option>
              <option value="governance">Governance</option>
              <option value="legal_compliance">Legal Compliance</option>
              <option value="performance_claims">Performance Claims</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-cyan-500 text-xs cursor-pointer"
            >
              <option value="fail">Fail (Blocking)</option>
              <option value="warning">Warning (Requires Review)</option>
              <option value="info">Info / Suggestion</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Rule Type</label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as RuleType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-cyan-500 text-xs cursor-pointer"
            >
              <option value="prohibited_phrase">Prohibited Phrase / Word</option>
              <option value="exact_phrase_required">Required Exact Phrase</option>
              <option value="required_disclaimer">Required Disclaimer</option>
              <option value="absolute_language">Absolute Language Flag</option>
              <option value="numerical_claim_requires_reference">Numerical Claim Reference</option>
              <option value="regex_pattern">Custom Safe RegExp</option>
              <option value="repeated_phrase_check">Duplicate Text Detector</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Matching Value / Pattern / Regex
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={
              ruleType === 'regex_pattern'
                ? '\\b(zero-?carbon|100%\\s*recycled)\\b'
                : 'Phrase or pattern to evaluate'
            }
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Suggested Correction / Approved Alternative (Optional)
          </label>
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Approved substitute phrase for authors"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Explanation / Guidance for Authors
          </label>
          <textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explain why this rule exists and how authors should rectify violations..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
          />
        </div>

        {/* Live Safe Regex & Pattern Tester */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
          <span className="text-[11px] font-semibold text-cyan-300 uppercase font-mono block">
            Interactive Safe Rule Tester
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={testSampleText}
              onChange={(e) => setTestSampleText(e.target.value)}
              placeholder="Paste sample copy here to test this rule..."
              className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 text-xs focus:border-cyan-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleTestPattern}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-medium cursor-pointer"
            >
              Test
            </button>
          </div>
          {testResult && (
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-cyan-300 font-mono">
              {testResult}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="ruleEnabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="ruleEnabled" className="text-slate-300 font-medium cursor-pointer">
            Rule is active and will be evaluated during verification
          </label>
        </div>

        {formError && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
            {formError}
          </div>
        )}

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] rounded-lg transition-colors cursor-pointer"
          >
            Save Governance Rule
          </button>
        </div>
      </form>
    </Modal>
  );
};
