/**
 * Enterprise Sidebar Navigation for VERITYX AI
 */

import React from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  BookmarkCheck,
  Database,
  History,
  SlidersHorizontal,
  ClipboardList,
  Settings,
  Shield,
  PlusCircle,
} from 'lucide-react';

export type NavigationPage =
  | 'dashboard'
  | 'workspace'
  | 'brands'
  | 'knowledge'
  | 'history'
  | 'rules'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onNewVerification: () => void;
  unresolvedReviewsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onNewVerification,
  unresolvedReviewsCount,
}) => {
  const navItems: Array<{
    id: NavigationPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }> = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'workspace', label: 'Verification Workspace', icon: FileCheck2 },
    { id: 'brands', label: 'Brand Guidelines', icon: BookmarkCheck },
    { id: 'knowledge', label: 'Approved Knowledge Base', icon: Database },
    {
      id: 'history',
      label: 'Review History',
      icon: History,
      badgeCount: unresolvedReviewsCount > 0 ? unresolvedReviewsCount : undefined,
    },
    { id: 'rules', label: 'Governance Rules', icon: SlidersHorizontal },
    { id: 'audit', label: 'Audit Trail', icon: ClipboardList },
    { id: 'settings', label: 'Settings & Storage', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col shrink-0 select-none">
      {/* Brand Zone */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-[#080d1a] shadow-sm shadow-cyan-500/20">
          <Shield className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div>
          <span className="font-bold tracking-tight text-white text-base block font-sans">
            VERITYX <span className="text-cyan-400 font-light">AI</span>
          </span>
          <span className="text-[10px] text-slate-400 tracking-wider block font-mono">
            CONTENT GOVERNANCE
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-4 border-b border-slate-800/60">
        <button
          onClick={onNewVerification}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-sm shadow-cyan-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Verification</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-mono tracking-wider text-slate-500">
          Platform Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800/90 text-cyan-300 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                <span className="text-[10px] font-mono tabular-nums text-amber-400 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.5 rounded">
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Local Storage & Audit Indicator */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080d1a]">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Local IndexedDB
          </span>
          <span className="font-mono text-[10px] text-slate-400">Client-Only</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Zero data egress. Verification runs locally in this browser profile.
        </p>
      </div>
    </aside>
  );
};
