/**
 * Brand Profile Editor Modal
 * Create or edit brand profiles with approved terms, prohibited terms, and disclaimers.
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { BrandProfile } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface BrandEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandToEdit: BrandProfile | null;
  onSave: (brand: BrandProfile) => void;
}

export const BrandEditorModal: React.FC<BrandEditorModalProps> = ({
  isOpen,
  onClose,
  brandToEdit,
  onSave,
}) => {
  const [name, setName] = useState(brandToEdit?.name || '');
  const [description, setDescription] = useState(brandToEdit?.description || '');
  const [tagline, setTagline] = useState(brandToEdit?.tagline || '');
  const [productNamesInput, setProductNamesInput] = useState(
    brandToEdit?.approvedProductNames?.join(', ') || ''
  );

  // Terminology states
  const [approvedTerms, setApprovedTerms] = useState<
    Array<{ original: string; canonical: string; context?: string }>
  >(brandToEdit?.approvedTerminology || [{ original: '', canonical: '', context: '' }]);

  const [prohibitedTerms, setProhibitedTerms] = useState<
    Array<{ term: string; reason: string; suggestedAlternative?: string }>
  >(brandToEdit?.prohibitedTerminology || [{ term: '', reason: '', suggestedAlternative: '' }]);

  const [disclaimers, setDisclaimers] = useState<
    Array<{ id: string; name: string; text: string; appliesTo?: string }>
  >(brandToEdit?.requiredDisclaimers || [{ id: 'disc-1', name: '', text: '' }]);

  const [toneGuidelinesInput, setToneGuidelinesInput] = useState(
    brandToEdit?.toneGuidelines?.join('\n') || ''
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddApprovedTerm = () => {
    setApprovedTerms([...approvedTerms, { original: '', canonical: '', context: '' }]);
  };

  const handleRemoveApprovedTerm = (index: number) => {
    setApprovedTerms(approvedTerms.filter((_, i) => i !== index));
  };

  const handleAddProhibitedTerm = () => {
    setProhibitedTerms([...prohibitedTerms, { term: '', reason: '', suggestedAlternative: '' }]);
  };

  const handleRemoveProhibitedTerm = (index: number) => {
    setProhibitedTerms(prohibitedTerms.filter((_, i) => i !== index));
  };

  const handleAddDisclaimer = () => {
    setDisclaimers([
      ...disclaimers,
      { id: `disc-${Date.now()}`, name: '', text: '', appliesTo: '' },
    ]);
  };

  const handleRemoveDisclaimer = (index: number) => {
    setDisclaimers(disclaimers.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please provide a Brand Name.');
      return;
    }

    const cleanApprovedTerms = approvedTerms.filter(
      (t) => t.original.trim() && t.canonical.trim()
    );
    const cleanProhibitedTerms = prohibitedTerms.filter((t) => t.term.trim());
    const cleanDisclaimers = disclaimers.filter((d) => d.name.trim() && d.text.trim());

    const productNames = productNamesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const toneGuidelines = toneGuidelinesInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedProfile: BrandProfile = {
      id: brandToEdit?.id || `brand-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      tagline: tagline.trim() || undefined,
      approvedProductNames: productNames,
      approvedTerminology: cleanApprovedTerms,
      prohibitedTerminology: cleanProhibitedTerms,
      requiredDisclaimers: cleanDisclaimers,
      toneGuidelines,
      customRules: brandToEdit?.customRules || [],
      createdAt: brandToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedProfile);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={brandToEdit ? 'Edit Brand Profile' : 'Create Brand Profile'}
      subtitle="Define terminology, disclaimers, and voice standards for deterministic verification."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Basic Brand Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-200 uppercase font-mono text-[11px]">
            Brand Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Brand Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AuraCloud Enterprise"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. The Unified Resilient Cloud Architecture"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description / Positioning</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enterprise cloud platform targeting Fortune 500 engineering leaders"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Approved Product Names (comma separated)
            </label>
            <input
              type="text"
              value={productNamesInput}
              onChange={(e) => setProductNamesInput(e.target.value)}
              placeholder="AuraCloud Core, AuraDB Distributed, AuraMesh Gateway"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
            />
          </div>
        </div>

        {/* Prohibited Terminology */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-rose-300 uppercase font-mono text-[11px]">
                Prohibited Terminology &amp; Slang
              </h3>
              <p className="text-slate-400 text-[11px]">
                Restricted phrases that trigger a blocking or warning finding.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddProhibitedTerm}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Term</span>
            </button>
          </div>

          <div className="space-y-2">
            {prohibitedTerms.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={item.term}
                    onChange={(e) => {
                      const updated = [...prohibitedTerms];
                      updated[idx].term = e.target.value;
                      setProhibitedTerms(updated);
                    }}
                    placeholder="Prohibited phrase (e.g. dirt cheap)"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 text-xs focus:border-cyan-500 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={item.suggestedAlternative || ''}
                    onChange={(e) => {
                      const updated = [...prohibitedTerms];
                      updated[idx].suggestedAlternative = e.target.value;
                      setProhibitedTerms(updated);
                    }}
                    placeholder="Suggested alternative (e.g. cost-effective)"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 text-xs focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.reason}
                    onChange={(e) => {
                      const updated = [...prohibitedTerms];
                      updated[idx].reason = e.target.value;
                      setProhibitedTerms(updated);
                    }}
                    placeholder="Reason (e.g. Devalues enterprise positioning)"
                    className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 text-xs focus:border-cyan-500 focus:outline-hidden"
                  />
                  {prohibitedTerms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProhibitedTerm(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approved Canonical Terminology */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-emerald-300 uppercase font-mono text-[11px]">
                Approved Canonical Terminology
              </h3>
              <p className="text-slate-400 text-[11px]">
                Enforces approved standard naming over outdated or colloquial aliases.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddApprovedTerm}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Canonical Pair</span>
            </button>
          </div>

          <div className="space-y-2">
            {approvedTerms.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.original}
                  onChange={(e) => {
                    const updated = [...approvedTerms];
                    updated[idx].original = e.target.value;
                    setApprovedTerms(updated);
                  }}
                  placeholder="Legacy or informal alias (e.g. Aura Core)"
                  className="w-1/2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 text-xs focus:border-cyan-500 focus:outline-hidden"
                />
                <span className="text-slate-500 text-xs font-mono">→</span>
                <input
                  type="text"
                  value={item.canonical}
                  onChange={(e) => {
                    const updated = [...approvedTerms];
                    updated[idx].canonical = e.target.value;
                    setApprovedTerms(updated);
                  }}
                  placeholder="Approved canonical standard (e.g. AuraCloud Core)"
                  className="w-1/2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 text-xs focus:border-cyan-500 focus:outline-hidden"
                />
                {approvedTerms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveApprovedTerm(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Required Disclaimers */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-cyan-300 uppercase font-mono text-[11px]">
                Required Disclaimers
              </h3>
              <p className="text-slate-400 text-[11px]">
                Mandatory disclosure clauses required in verified content.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddDisclaimer}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Disclaimer</span>
            </button>
          </div>

          <div className="space-y-2">
            {disclaimers.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const updated = [...disclaimers];
                      updated[idx].name = e.target.value;
                      setDisclaimers(updated);
                    }}
                    placeholder="Disclaimer Title (e.g. Performance Benchmark Disclaimer)"
                    className="w-3/4 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 text-xs focus:border-cyan-500 focus:outline-hidden font-medium"
                  />
                  {disclaimers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDisclaimer(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={item.text}
                  onChange={(e) => {
                    const updated = [...disclaimers];
                    updated[idx].text = e.target.value;
                    setDisclaimers(updated);
                  }}
                  placeholder="Exact mandatory disclaimer wording..."
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 text-xs focus:border-cyan-500 focus:outline-hidden font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tone and Style Guidelines */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <label className="block text-slate-300 font-semibold">
            Tone &amp; Style Instructions (One per line)
          </label>
          <textarea
            rows={3}
            value={toneGuidelinesInput}
            onChange={(e) => setToneGuidelinesInput(e.target.value)}
            placeholder="Direct, authoritative, technically rigorous.&#10;Back every quantitative metric with verified benchmark citations.&#10;Never promise unconditional zero-downtime."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs leading-relaxed"
          />
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
            {errorMessage}
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
            Save Brand Profile
          </button>
        </div>
      </form>
    </Modal>
  );
};
