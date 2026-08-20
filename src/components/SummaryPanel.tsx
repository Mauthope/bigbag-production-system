'use client';

import React from 'react';
import { useProduction } from '@/context/ProductionContext';
import { Copy, PlusCircle, Clock, Sparkles } from 'lucide-react';

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

  const handleCopySummary = () => {
    let summaryText = `📋 **RESUMO DO TEMPO DE PRODUÇÃO - BIG BAGS**\n\n`;
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
      } else {
        summaryText += `🔹 **${config.title}** (Vazio / 0,00 min)\n\n`;
      }
    });

    const absMinutes = Math.abs(grandTotal);
    const wholeMinutes = Math.floor(absMinutes);
    const seconds = Math.round((absMinutes - wholeMinutes) * 60);
    const readableStr = `${wholeMinutes}m ${seconds}s`;

    summaryText += `===================================\n`;
    summaryText += `⏱️ **Tempo Total Padrão por Bag:** ${grandTotal.toFixed(2).replace('.', ',')} min (${readableStr})\n`;
    summaryText += `📦 Operações Selecionadas: ${selectedOperationIds.length}\n`;

    navigator.clipboard
      .writeText(summaryText)
      .then(() => {
        showToast('Resumo técnico copiado para a área de transferência!', 'success');
      })
      .catch(() => {
        showToast('Erro ao copiar resumo.', 'error');
      });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-30">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/80 shadow-2xl shadow-cyan-950/40">
        
        {/* Totalizer Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Tempo Total de Costura / Bag
              </span>
              <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold">
                {selectedOperationIds.length} itens
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 font-mono tracking-tight">
                {calculatorTotalMinutes.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-sm font-bold text-teal-400">min</span>
              <span className="text-xs font-medium text-slate-400 ml-2 hidden sm:inline">
                ({calculatorReadableTime})
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleCopySummary}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:via-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
            title="Copiar texto técnico formatado"
          >
            <Copy className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Copiar Resumo Técnico</span>
          </button>
        </div>

      </div>
    </div>
  );
};
