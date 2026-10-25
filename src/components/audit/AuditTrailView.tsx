/**
 * Audit Trail View
 * Persistent, append-only application audit log recording all operational events.
 */

import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  Shield,
  Clock,
  User,
  Filter,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { AuditEvent } from '../../types';

interface AuditTrailViewProps {
  events: AuditEvent[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      e.recordTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.actorLabel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || e.eventType === typeFilter;
    return matchesSearch && matchesType;
  });

  const getEventTypeLabel = (type: AuditEvent['eventType']) => {
    switch (type) {
      case 'verification_run_executed':
        return 'Verification Executed';
      case 'review_approved':
        return 'Review Approved';
      case 'review_rejected':
        return 'Review Rejected';
      case 'review_override_recorded':
        return 'Override Recorded';
      case 'brand_profile_created':
        return 'Brand Profile Created';
      case 'brand_profile_updated':
        return 'Brand Profile Updated';
      case 'brand_profile_deleted':
        return 'Brand Profile Deleted';
      case 'governance_rule_created':
        return 'Rule Created';
      case 'governance_rule_updated':
        return 'Rule Updated';
      case 'governance_rule_toggled':
        return 'Rule Toggled';
      case 'knowledge_document_added':
        return 'Document Added';
      case 'knowledge_document_deleted':
        return 'Document Deleted';
      case 'data_exported':
        return 'Data Exported';
      case 'data_imported':
        return 'Data Imported';
      case 'sample_data_loaded':
        return 'Sample Data Loaded';
      case 'database_cleared':
        return 'Database Cleared';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const getEventTypeColor = (type: AuditEvent['eventType']) => {
    if (type.includes('approved') || type.includes('created') || type.includes('added')) {
      return 'text-emerald-400 border-emerald-800/80 bg-emerald-950/60';
    }
    if (type.includes('override') || type.includes('toggled')) {
      return 'text-amber-400 border-amber-800/80 bg-amber-950/60';
    }
    if (type.includes('rejected') || type.includes('deleted') || type.includes('cleared')) {
      return 'text-rose-400 border-rose-800/80 bg-rose-950/60';
    }
    return 'text-cyan-400 border-cyan-800/80 bg-cyan-950/60';
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1f] border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-cyan-400" />
            <span>Application Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Append-only record of verification runs, rule changes, approval decisions, and overrides.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Recorded Events: <span className="text-cyan-300 font-bold">{events.length}</span>
        </div>
      </div>

      {/* Honest Audit Storage Notice */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-200">
            Local Audit Log Operational Boundaries
          </span>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            This audit trail is append-only through standard user interface actions and is stored in browser IndexedDB. Please note: browser-local storage can be inspected or cleared by anyone with local device or developer console access; it is designed for operational traceability, not cryptographic multi-tenant non-repudiation.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0a0f1f] border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit events by record, event type, or actor..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Event Types</option>
            <option value="verification_run_executed">Verification Executed</option>
            <option value="review_approved">Review Approved</option>
            <option value="review_override_recorded">Override Recorded</option>
            <option value="review_rejected">Review Rejected</option>
            <option value="brand_profile_created">Brand Profile Created</option>
            <option value="brand_profile_updated">Brand Profile Updated</option>
            <option value="governance_rule_toggled">Rule Toggled</option>
            <option value="governance_rule_created">Rule Created</option>
            <option value="knowledge_document_added">Document Added</option>
          </select>
        </div>
      </div>

      {/* Audit Log Timeline / Table */}
      {events.length === 0 ? (
        <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">Audit Trail is Empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Operating actions such as running a verification, toggling rules, or recording approvals will automatically register persistent entries here.
          </p>
        </div>
      ) : (
        <div className="bg-[#0a0f1f] border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
          {filteredEvents.map((event) => {
            const isExpanded = expandedEventId === event.id;
            const dateStr = new Date(event.timestamp).toLocaleString();

            return (
              <div key={event.id} className="p-4 text-xs hover:bg-slate-800/20 transition-colors">
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-500 hover:text-slate-300">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${getEventTypeColor(
                        event.eventType
                      )}`}
                    >
                      {getEventTypeLabel(event.eventType)}
                    </span>

                    <span className="font-semibold text-slate-200">{event.recordTitle}</span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-400 text-[11px] font-mono sm:text-right shrink-0">
                    <span className="flex items-center gap-1 text-slate-300">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{event.actorLabel}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{dateStr}</span>
                    </span>
                  </div>
                </div>

                {/* Expanded Details JSON / breakdown */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/60 pl-7 space-y-2 text-[11px]">
                    <div className="flex items-center gap-2 font-mono text-slate-400">
                      <span>Event ID: {event.id}</span>
                      <span>·</span>
                      <span>Target Record ID: {event.recordId}</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-cyan-300 overflow-x-auto">
                      <pre>{JSON.stringify(event.details, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
