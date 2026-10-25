/**
 * Brand Guidelines & Profiles View
 * Allows users to create, inspect, edit, and delete configured brand profiles.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, AlertOctagon, FileText, BookmarkCheck } from 'lucide-react';
import { BrandProfile } from '../../types';
import { BrandEditorModal } from './BrandEditorModal';
import { storage } from '../../lib/storage/indexedDb';
import { AuditLogger } from '../../lib/audit/auditLogger';

interface BrandProfilesViewProps {
  brands: BrandProfile[];
  onRefresh: () => void;
}

export const BrandProfilesView: React.FC<BrandProfilesViewProps> = ({ brands, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<BrandProfile | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(brands[0]?.id || '');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activeBrand = brands.find((b) => b.id === selectedBrandId) || brands[0] || null;

  const handleCreateNew = () => {
    setBrandToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (brand: BrandProfile) => {
    setBrandToEdit(brand);
    setIsModalOpen(true);
  };

  const handleDelete = async (brand: BrandProfile) => {
    if (!window.confirm(`Are you sure you want to delete brand profile "${brand.name}"?`)) {
      return;
    }

    await storage.deleteBrand(brand.id);
    await AuditLogger.log('brand_profile_deleted', brand.id, brand.name);
    setFeedbackMsg(`Deleted brand profile "${brand.name}"`);
    setTimeout(() => setFeedbackMsg(null), 3000);
    onRefresh();
  };

  const handleSaveBrand = async (brand: BrandProfile) => {
    const isNew = !brands.some((b) => b.id === brand.id);
    await storage.saveBrand(brand);
    await AuditLogger.log(
      isNew ? 'brand_profile_created' : 'brand_profile_updated',
      brand.id,
      brand.name,
      {
        approvedTermsCount: brand.approvedTerminology.length,
        prohibitedTermsCount: brand.prohibitedTerminology.length,
        disclaimersCount: brand.requiredDisclaimers.length,
      }
    );

    setSelectedBrandId(brand.id);
    setFeedbackMsg(`Saved brand profile "${brand.name}"`);
    setTimeout(() => setFeedbackMsg(null), 3000);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1f] border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-cyan-400" />
            <span>Brand Guidelines &amp; Profiles</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure brand naming rules, prohibited hyperbole, canonical terminology, and required legal disclaimers.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Brand Profile</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {brands.length === 0 ? (
        <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <BookmarkCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Brand Profiles Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Create a brand profile to enforce product terminology, approved alternatives, and mandatory disclaimers.
          </p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Create First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Profile Selector List (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-500 px-1">
              Configured Profiles ({brands.length})
            </div>

            <div className="space-y-2">
              {brands.map((b) => {
                const isSelected = activeBrand?.id === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBrandId(b.id)}
                    className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/80 border-cyan-500/80 text-white'
                        : 'bg-[#0a0f1f] border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-xs text-white">{b.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(b);
                          }}
                          className="p-1 text-slate-400 hover:text-cyan-300 rounded cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(b);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {b.tagline && (
                      <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-1">
                        &quot;{b.tagline}&quot;
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-3">
                      <span>{b.prohibitedTerminology.length} prohibited</span>
                      <span>·</span>
                      <span>{b.approvedTerminology.length} canonical</span>
                      <span>·</span>
                      <span>{b.requiredDisclaimers.length} disclaimers</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile Inspection Details (8 cols) */}
          {activeBrand && (
            <div className="lg:col-span-8 bg-[#0a0f1f] border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">{activeBrand.name}</h3>
                  {activeBrand.tagline && (
                    <p className="text-xs text-cyan-300 italic mt-0.5">&quot;{activeBrand.tagline}&quot;</p>
                  )}
                  {activeBrand.description && (
                    <p className="text-xs text-slate-400 mt-1">{activeBrand.description}</p>
                  )}
                </div>

                <button
                  onClick={() => handleEdit(activeBrand)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Approved Products */}
              {activeBrand.approvedProductNames.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-2">
                    Approved Product Names
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeBrand.approvedProductNames.map((p, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded font-mono"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Prohibited Terminology Table */}
              <div>
                <h4 className="text-[11px] font-mono uppercase text-rose-400 font-semibold mb-2 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Prohibited Terminology &amp; Hyperbole ({activeBrand.prohibitedTerminology.length})</span>
                </h4>

                {activeBrand.prohibitedTerminology.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No prohibited terms added.</p>
                ) : (
                  <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800/80">
                    {activeBrand.prohibitedTerminology.map((item, i) => (
                      <div key={i} className="p-3 text-xs bg-slate-950 flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-rose-300 font-mono">
                            &quot;{item.term}&quot;
                          </span>
                          <p className="text-[11px] text-slate-400">{item.reason}</p>
                        </div>
                        {item.suggestedAlternative && (
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-500 uppercase font-mono block">
                              Approved Alternative
                            </span>
                            <span className="text-emerald-400 font-medium font-mono text-[11px]">
                              {item.suggestedAlternative}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Canonical Standards */}
              <div>
                <h4 className="text-[11px] font-mono uppercase text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Canonical Standards ({activeBrand.approvedTerminology.length})</span>
                </h4>

                {activeBrand.approvedTerminology.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No canonical term pairs added.</p>
                ) : (
                  <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800/80">
                    {activeBrand.approvedTerminology.map((item, i) => (
                      <div key={i} className="p-2.5 text-xs bg-slate-950 flex items-center justify-between">
                        <span className="font-mono text-slate-400 line-through">&quot;{item.original}&quot;</span>
                        <span className="font-mono text-slate-600">→</span>
                        <span className="font-mono font-medium text-emerald-300">
                          &quot;{item.canonical}&quot;
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Required Disclaimers */}
              <div>
                <h4 className="text-[11px] font-mono uppercase text-cyan-400 font-semibold mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Required Disclaimers ({activeBrand.requiredDisclaimers.length})</span>
                </h4>

                {activeBrand.requiredDisclaimers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No required disclaimers configured.</p>
                ) : (
                  <div className="space-y-2">
                    {activeBrand.requiredDisclaimers.map((disc, i) => (
                      <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                        <div className="font-semibold text-slate-200">{disc.name}</div>
                        <div className="text-[11px] text-slate-300 italic font-mono bg-slate-900 p-2 rounded border border-slate-800/60">
                          &quot;{disc.text}&quot;
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      <BrandEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        brandToEdit={brandToEdit}
        onSave={handleSaveBrand}
      />
    </div>
  );
};
