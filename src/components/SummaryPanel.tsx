'use client';

import React from 'react';
import { useProduction } from '@/context/ProductionContext';
import { Copy, Clock, Zap, Boxes } from 'lucide-react';

interface SummaryPanelProps {}

export const SummaryPanel: React.FC<SummaryPanelProps> = () => {
  const {
    calculatorTotalMinutes,
    calculatorReadableTime,
    selectedOperationIds,
    operations,
    categories,
    showToast
  } = useProduction();

  const totalTime = calculatorTotalMinutes;
  const bagsPerHour = totalTime > 0 ? 60 / totalTime : 0;
  const bagsPerDay = totalTime > 0 ? (60 / totalTime) * 8.5 : 0;

  const handleCopySummary = () => {
    let summaryText = `📋 **RESUMO DO TEMPO DE PRODUÇÃO & ESTIMATIVA DE RITMO (ER)**\n\n`;
    let grandTotal = 0;

    categories.forEach(config => {
      const catOps = operations.filter(
        op => op.category === config.key && selectedOperationIds.includes(op.id)
      );
      const catTotal = catOps.reduce((sum, op) => sum + op.time, 0);
      grandTotal += catTotal;

      if (catOps.length > 0) {
        summaryText += `🔹 **${config.title}** (Total: ${catTotal.toFixed(2).replace('.', ',')} min)\n`;
        catOps.forEach(item => {
          const timeFormatted =
            item.time >= 0
              ? `+${item.time.toFixed(2)}m`
              : `${item.time.toFixed(2)}m`;
          summaryText += `  - [x] ${item.name} (${timeFormatted})\n`;
        });
        summaryText += `\n`;
      }
    });

    const absMinutes = Math.abs(grandTotal);
    const wholeMinutes = Math.floor(absMinutes);
    const seconds = Math.round((absMinutes - wholeMinutes) * 60);
    const readableStr = `${wholeMinutes}m ${seconds}s`;

    const erPerHour = grandTotal > 0 ? (60 / grandTotal).toFixed(1).replace('.', ',') : '0,0';
    const erPerDay = grandTotal > 0 ? ((60 / grandTotal) * 8.5).toFixed(1).replace('.', ',') : '0,0';
    const erPerDayInt = grandTotal > 0 ? Math.floor((60 / grandTotal) * 8.5) : 0;

    summaryText += `===================================\n`;
    summaryText += `⏱️ **Tempo Total Padrão por Bag:** ${grandTotal.toFixed(2).replace('.', ',')} min (${readableStr})\n`;
    summaryText += `⚡ **Produção por Hora (60 ÷ T):** ${erPerHour} bags/h\n`;
    summaryText += `🏭 **Produção por Dia (8,5h):** ${erPerDay} bags/dia (~${erPerDayInt} bags)\n`;
    summaryText += `📦 Operações Selecionadas: ${selectedOperationIds.length}\n`;

    navigator.clipboard
      .writeText(summaryText)
      .then(() => {
        showToast('Resumo técnico e ER copiados para a área de transferência!', 'success');
      })
      .catch(() => {
        showToast('Erro ao copiar resumo.', 'error');
      });
  };

  return (
    <div className="sticky top-16 z-30 w-full py-2 -my-2 backdrop-blur-md bg-slate-950/75">
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/30 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Left & Center KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full lg:w-auto flex-1">
          
          {/* Card 1: Tempo Total / Bag */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                  Tempo Total / Bag
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold shrink-0">
                  {selectedOperationIds.length} itens
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 font-mono">
                  {totalTime.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs font-bold text-teal-400">min</span>
                <span className="text-[11px] text-slate-400 font-mono ml-1 truncate">
                  ({calculatorReadableTime})
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: ER Produção por Hora (60 / T) */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate">
                Ritmo / Hora (60 ÷ T)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono">
                  {bagsPerHour.toFixed(1).replace('.', ',')}
                </span>
                <span className="text-xs font-bold text-amber-400/80">bags/h</span>
                <span className="text-[10px] text-slate-500 hidden sm:inline ml-1 font-mono">
                  (ER)
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: ER Produção por Dia (8,5h) */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate">
                Produção / Dia (8,5h)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-mono">
                  {bagsPerDay.toFixed(1).replace('.', ',')}
                </span>
                <span className="text-xs font-bold text-emerald-400/80">bags/dia</span>
                <span className="text-[10px] text-slate-500 hidden sm:inline ml-1 font-mono">
                  (~{Math.floor(bagsPerDay)} un)
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Action Button */}
        <div className="w-full lg:w-auto shrink-0 flex items-center">
          <button
            onClick={handleCopySummary}
            className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:via-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title="Copiar texto técnico com tempos e estimativas de produção por hora e dia"
          >
            <Copy className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Copiar Resumo & ER</span>
          </button>
        </div>

      </div>
    </div>
  );
};
