'use client';

import React from 'react';
import { useProduction } from '@/context/ProductionContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useProduction();

  if (!toast.show) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/30 bg-slate-900/95 text-emerald-100 shadow-emerald-500/10',
    error: 'border-rose-500/30 bg-slate-900/95 text-rose-100 shadow-rose-500/10',
    info: 'border-cyan-500/30 bg-slate-900/95 text-cyan-100 shadow-cyan-500/10'
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${
          borders[toast.type]
        }`}
      >
        {icons[toast.type]}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
};
