/**
 * Approved Knowledge Base View
 * Ingestion of TXT, MD, CSV, JSON and manual facts for deterministic grounding.
 */

import React, { useState, useRef } from 'react';
import {
  Database,
  Upload,
  Plus,
  Search,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { KnowledgeDocument } from '../../types';
import { KnowledgeEditorModal } from './KnowledgeEditorModal';
import { DocumentParser } from '../../lib/engine/parser';
import { storage } from '../../lib/storage/indexedDb';
import { AuditLogger } from '../../lib/audit/auditLogger';

interface KnowledgeBaseViewProps {
  documents: KnowledgeDocument[];
  onRefresh: () => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  documents,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState<KnowledgeDocument | null>(null);
  const [inspectDoc, setInspectDoc] = useState<KnowledgeDocument | null>(documents[0] || null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch =
      searchTerm.trim() === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const parsed = await DocumentParser.parseFile(file);
      const newDoc: KnowledgeDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: parsed.title,
        category: 'product_specs',
        filename: file.name,
        fileType: parsed.fileType,
        content: parsed.content,
        summary: parsed.summary,
        characterCount: parsed.characterCount,
        wordCount: parsed.wordCount,
        parsedFactsCount: parsed.parsedFactsCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await storage.saveDocument(newDoc);
      await AuditLogger.log(
        'knowledge_document_added',
        newDoc.id,
        newDoc.title,
        { fileType: newDoc.fileType, characterCount: newDoc.characterCount }
      );

      setActionSuccess(`Uploaded and indexed document "${newDoc.title}"`);
      setTimeout(() => setActionSuccess(null), 3000);
      setInspectDoc(newDoc);
      onRefresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveManualFact = async (doc: KnowledgeDocument) => {
    const isNew = !documents.some((d) => d.id === doc.id);
    await storage.saveDocument(doc);
    await AuditLogger.log(
      isNew ? 'knowledge_document_added' : 'knowledge_document_updated',
      doc.id,
      doc.title,
      { category: doc.category, wordCount: doc.wordCount }
    );

    setActionSuccess(`Saved reference fact "${doc.title}"`);
    setTimeout(() => setActionSuccess(null), 3000);
    setInspectDoc(doc);
    onRefresh();
  };

  const handleDelete = async (doc: KnowledgeDocument) => {
    if (!window.confirm(`Delete reference document "${doc.title}"?`)) return;

    await storage.deleteDocument(doc.id);
    await AuditLogger.log('knowledge_document_deleted', doc.id, doc.title);

    if (inspectDoc?.id === doc.id) {
      setInspectDoc(null);
    }
    setActionSuccess(`Deleted document "${doc.title}"`);
    setTimeout(() => setActionSuccess(null), 3000);
    onRefresh();
  };

  const getFileIcon = (type: KnowledgeDocument['fileType']) => {
    switch (type) {
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'json':
        return <FileCode className="w-4 h-4 text-amber-400" />;
      case 'md':
      case 'txt':
      default:
        return <FileText className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1f] border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Approved Knowledge Base</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audited facts, benchmark statistics, and product specifications used to deterministically verify claims.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.md,.markdown,.csv,.json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isUploading ? 'Parsing File...' : 'Upload File (.txt, .md, .csv, .json)'}</span>
          </button>

          <button
            onClick={() => {
              setDocToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Fact</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0a0f1f] border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search approved facts, documents, or statistics..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Categories ({documents.length})</option>
            <option value="product_specs">Product Specifications</option>
            <option value="benchmarks">Benchmarks &amp; Performance</option>
            <option value="pricing_terms">Pricing &amp; Terms</option>
            <option value="certifications">Compliance &amp; Certifications</option>
            <option value="legal_disclaimers">Legal Disclaimers</option>
            <option value="brand_voice">Brand Voice</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Approved Documents Stored</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Upload specification sheets or add internal benchmark records. Claims in marketing copy are verified against these sources.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              Upload Text File
            </button>
            <button
              onClick={() => {
                setDocToEdit(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Add Manual Fact
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Document List Table (5 cols) */}
          <div className="lg:col-span-5 bg-[#0a0f1f] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Indexed Documents ({filteredDocs.length})</span>
              <span className="text-[10px] text-slate-400 font-mono">Normalized Tokens</span>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto">
              {filteredDocs.map((doc) => {
                const isSelected = inspectDoc?.id === doc.id;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setInspectDoc(doc)}
                    className={`p-3.5 text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-800/90 border-l-2 border-l-cyan-400' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        {getFileIcon(doc.fileType)}
                        <span className="font-medium text-slate-200 truncate">{doc.title}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded shrink-0">
                        {doc.fileType}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {doc.summary || doc.content.slice(0, 120)}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-2">
                      <span className="capitalize">{doc.category.replace(/_/g, ' ')}</span>
                      <span>·</span>
                      <span className="tabular-nums">{doc.wordCount} words</span>
                      <span>·</span>
                      <span className="tabular-nums">{doc.characterCount} chars</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Content Inspector (7 cols) */}
          <div className="lg:col-span-7 bg-[#0a0f1f] border border-slate-800 rounded-xl p-5 space-y-4">
            {inspectDoc ? (
              <>
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{inspectDoc.title}</h3>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded uppercase">
                        {inspectDoc.fileType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                      <span>Category: {inspectDoc.category.replace(/_/g, ' ')}</span>
                      <span>·</span>
                      <span>Audited: {new Date(inspectDoc.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setDocToEdit(inspectDoc);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Document"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(inspectDoc)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {inspectDoc.summary && (
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5 font-bold">
                      Document Digest
                    </span>
                    <p className="text-slate-300 leading-relaxed">{inspectDoc.summary}</p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-bold">
                    Exact Grounding Text (Used for Verification Search)
                  </span>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg max-h-[360px] overflow-y-auto text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                    {inspectDoc.content}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                Select a document from the list to inspect its source text.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Fact Editor Modal */}
      <KnowledgeEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        docToEdit={docToEdit}
        onSave={handleSaveManualFact}
      />
    </div>
  );
};
