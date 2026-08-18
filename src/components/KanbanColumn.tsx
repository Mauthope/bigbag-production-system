'use client';

import React from 'react';
import { ComponentCategoryConfig, OperationItem } from '@/types/production';
import { Check } from 'lucide-react';

interface KanbanColumnProps {
  config: ComponentCategoryConfig;
  items: OperationItem[];
  selectedIds: string[];
  totalTime: number;
  onToggle: (id: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  config,
  items,
  selectedIds,
  totalTime,
  onToggle
}) => {
  const activeCount = items.filter(item => selectedIds.includes(item.id)).length;

  return (
    <section
      className="flex flex-col min-h-[460px] rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 shadow-xl hover:shadow-2xl hover:border-slate-700/80 transition-all duration-300 relative group overflow-hidden"
      style={{
        borderTop: `4px solid ${config.colorHex}`
      }}
    >
      {/* Background Subtle Gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-24 opacity-10 pointer-events-none transition-opacity group-hover:opacity-20"
        style={{
          background: `radial-gradient(ellipse at top, ${config.colorHex}, transparent 70%)`
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${config.colorHex}20`,
              color: config.colorHex
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d={config.icon} />
            </svg>
          </div>
          <h2
            className="text-base font-bold truncate tracking-tight"
            style={{ color: config.colorHex }}
            title={config.title}
          >
            {config.title}
          </h2>
        </div>

        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50 shrink-0">
          {activeCount}/{items.length}
        </span>
      </div>

      {/* Options List */}
      <div className="flex flex-col gap-2 flex-grow mb-4 overflow-y-auto max-h-[480px] pr-1 relative z-10 custom-scrollbar">
        {items.map(item => {
          const isChecked = selectedIds.includes(item.id);
          const timeFormatted =
            item.time >= 0
              ? `+${item.time.toFixed(2).replace('.', ',')} min`
              : `${item.time.toFixed(2).replace('.', ',')} min`;

          return (
            <label
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all duration-200 select-none group/item relative overflow-hidden ${
                isChecked
                  ? 'bg-slate-800/90 border-slate-700 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700/60'
              }`}
            >
              {/* Active Indicator Bar */}
              {isChecked && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                  style={{ backgroundColor: config.colorHex }}
                />
              )}

              {/* Checkbox & Name */}
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                    isChecked
                      ? 'text-slate-950'
                      : 'border border-slate-600 bg-transparent group-hover/item:border-slate-400'
                  }`}
                  style={{
                    backgroundColor: isChecked ? config.colorHex : 'transparent',
                    borderColor: isChecked ? config.colorHex : undefined
                  }}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span
                  className={`text-xs leading-snug transition-colors line-clamp-2 ${
                    isChecked ? 'text-white font-medium' : 'text-slate-400 group-hover/item:text-slate-300'
                  }`}
                >
                  {item.name}
                </span>
              </div>

              {/* Time Badge */}
              <span
                className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md border shrink-0 transition-colors ${
                  isChecked
                    ? 'text-white border-transparent'
                    : 'text-slate-500 bg-slate-900 border-slate-800'
                }`}
                style={{
                  backgroundColor: isChecked ? `${config.colorHex}25` : undefined,
                  color: isChecked ? config.colorHex : undefined,
                  borderColor: isChecked ? `${config.colorHex}40` : undefined
                }}
              >
                {timeFormatted}
              </span>
            </label>
          );
        })}
      </div>

      {/* Column Totalizer */}
      <div
        className="mt-auto p-3 rounded-xl bg-slate-950/70 border border-dashed flex items-center justify-between relative z-10 transition-colors"
        style={{
          borderColor: activeCount > 0 ? `${config.colorHex}50` : 'rgba(255, 255, 255, 0.08)'
        }}
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Totalizador
        </span>
        <span
          className="text-base font-extrabold font-mono transition-colors"
          style={{ color: activeCount > 0 ? config.colorHex : '#94a3b8' }}
        >
          {totalTime.toFixed(2).replace('.', ',')} min
        </span>
      </div>
    </section>
  );
};
