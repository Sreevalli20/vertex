/**
 * Top Navigation Bar complying with the Top Bar Contract:
 * [Breadcrumb Title] — [Contextual Stats / Nav Links] — [Primary Action]
 */

import React from 'react';
import { ShieldCheck, Download, Plus } from 'lucide-react';
import { NavigationPage } from './Sidebar';

interface TopBarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  activeRulesCount: number;
  approvedDocsCount: number;
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentPage,
  onNavigate,
  activeRulesCount,
  approvedDocsCount,
  onQuickAction,
  quickActionLabel,
}) => {
  const getPageTitle = (page: NavigationPage) => {
    switch (page) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'workspace':
        return 'Content Verification Workspace';
      case 'brands':
        return 'Brand Guidelines & Profiles';
      case 'knowledge':
        return 'Approved Knowledge Base';
      case 'history':
        return 'Review History & Reports';
      case 'rules':
        return 'Governance Rules';
      case 'audit':
        return 'Immutable Audit Trail';
      case 'settings':
        return 'Settings & Data Management';
      default:
        return 'Governance Platform';
    }
  };

  return (
    <header className="h-16 px-6 bg-[#0a0f1d]/90 backdrop-blur border-b border-slate-800/80 flex items-center justify-between gap-8 shrink-0 select-none">
      {/* Zone 1: Breadcrumb Title */}
      <div className="flex items-center gap-2 text-sm text-slate-400 whitespace-nowrap shrink-0">
        <span className="text-slate-400 font-medium">VERITYX Governance</span>
        <span className="text-slate-600">/</span>
        <h1 className="text-sm font-semibold text-white">{getPageTitle(currentPage)}</h1>
      </div>

      {/* Zone 2: Navigation Links & Live Metrics */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-400 whitespace-nowrap shrink-0">
        <button
          onClick={() => onNavigate('rules')}
          className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>Active Rules</span>
          <span className="font-mono tabular-nums text-slate-200 font-medium bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
            {activeRulesCount}
          </span>
        </button>

        <span className="text-slate-700">·</span>

        <button
          onClick={() => onNavigate('knowledge')}
          className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>Approved Knowledge Docs</span>
          <span className="font-mono tabular-nums text-slate-200 font-medium bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
            {approvedDocsCount}
          </span>
        </button>

        <span className="text-slate-700">·</span>

        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Local Engine Active</span>
        </div>
      </div>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        {onQuickAction && quickActionLabel ? (
          <button
            onClick={onQuickAction}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{quickActionLabel}</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="whitespace-nowrap">Backup Data</span>
          </button>
        )}
      </div>
    </header>
  );
};
