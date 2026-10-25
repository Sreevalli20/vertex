/**
 * Transparent capability and privacy notice component
 * Clarifies local deterministic verification scope vs general world truth.
 */

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface HonestyNoticeProps {
  compact?: boolean;
}

export const HonestyNotice: React.FC<HonestyNoticeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-lg">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong className="text-slate-200">Local-First Engine:</strong> All checks are deterministic and executed in your browser. No content is transmitted externally.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-cyan-950/50 border border-cyan-800/50 rounded-lg text-cyan-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100">Deterministic Governance Scope &amp; Privacy Notice</span>
            <span className="text-slate-500">·</span>
            <span className="text-cyan-400">Browser-Native</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            VERITYX AI evaluates content strictly against configured governance rules, brand profile terminology, and approved knowledge base documents. Lack of evidence in approved documents flags an unverified claim, not proof of falsity. The engine does not make external network calls or send your proprietary marketing copy to cloud models. Local reviewer identities serve as audit labels rather than cryptographic authentication.
          </p>
        </div>
      </div>
    </div>
  );
};
