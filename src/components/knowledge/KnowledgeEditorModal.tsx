/**
 * Manual Verified Fact Entry Modal
 * Allows users to add or edit approved claims, benchmarks, and product facts manually.
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { KnowledgeDocument } from '../../types';

interface KnowledgeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  docToEdit: KnowledgeDocument | null;
  onSave: (doc: KnowledgeDocument) => void;
}

export const KnowledgeEditorModal: React.FC<KnowledgeEditorModalProps> = ({
  isOpen,
  onClose,
  docToEdit,
  onSave,
}) => {
  const [title, setTitle] = useState(docToEdit?.title || '');
  const [category, setCategory] = useState<KnowledgeDocument['category']>(
    docToEdit?.category || 'product_specs'
  );
  const [content, setContent] = useState(docToEdit?.content || '');
  const [summary, setSummary] = useState(docToEdit?.summary || '');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter a Document Title.');
      return;
    }

    if (!content.trim()) {
      setFormError('Please provide the verified fact content or reference text.');
      return;
    }

    const words = content.trim().split(/\s+/).filter(Boolean);
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 5);

    const doc: KnowledgeDocument = {
      id: docToEdit?.id || `doc-manual-${Date.now()}`,
      title: title.trim(),
      category,
      fileType: 'manual',
      content: content.trim(),
      summary: summary.trim() || content.slice(0, 180) + (content.length > 180 ? '...' : ''),
      characterCount: content.trim().length,
      wordCount: words.length,
      parsedFactsCount: sentences.length,
      createdAt: docToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(doc);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={docToEdit ? 'Edit Approved Reference Fact' : 'Add Approved Reference Fact'}
      subtitle="Ground quantitative claims and specifications in verified internal records."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Fact Title / Citation Source <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AuraDB Q3 2026 Laboratory Throughput Benchmark"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Knowledge Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as KnowledgeDocument['category'])}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:border-cyan-500 text-xs cursor-pointer"
          >
            <option value="product_specs">Product Specifications</option>
            <option value="benchmarks">Benchmarks &amp; Performance Claims</option>
            <option value="pricing_terms">Pricing &amp; Contract Terms</option>
            <option value="certifications">Compliance &amp; Certifications</option>
            <option value="legal_disclaimers">Legal Disclaimers</option>
            <option value="brand_voice">Brand Voice &amp; Terminology</option>
            <option value="general">General Reference</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Brief Summary (Optional)</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summary of certified performance metrics and test conditions"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Exact Verified Content / Source Text <span className="text-rose-400">*</span>
          </label>
          <textarea
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter the exact approved sentences, numbers, percentages, or specifications..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs font-mono leading-relaxed"
          />
        </div>

        {formError && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg">
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
            className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] rounded-lg transition-colors cursor-pointer"
          >
            Save Reference Fact
          </button>
        </div>
      </form>
    </Modal>
  );
};
