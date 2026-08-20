'use client';

import React, { useState } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { Clock, Zap, Boxes, Table, Sparkles } from 'lucide-react';
import { ReferenceTimesModal } from './ReferenceTimesModal';

interface SummaryPanelProps {}

export const SummaryPanel: React.FC<SummaryPanelProps> = () => {
  const {
    calculatorTotalMinutes,
    calculatorReadableTime,
    selectedOperationIds
  } = useProduction();

  const [bagType, setBagType] = useState<'one' | 'travado'>('one');
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);

  const totalTime = calculatorTotalMinutes;
  const constant = bagType === 'one' ? 8.5 : 11;
  const er = totalTime > 0 ? (60 / totalTime) * constant : 0;
  const dailyProduction = er * 8.5;

  return (
    <>
      <div className="sticky top-16 z-30 w-full py-2 -my-2 backdrop-blur-md bg-slate-950/75">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/30 flex flex-col xl:flex-row items-center justify-between gap-4">
          
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full xl:w-auto flex-1">
            
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

            {/* Card 2: ER (Estimativa de Ritmo) */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                    ER ({bagType === 'one' ? 'One × 8.5' : 'Travado × 11'})
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono">
                    {er.toFixed(1).replace('.', ',')}
                  </span>
                  <span className="text-xs font-bold text-amber-400/80 font-mono">
                    (~{Math.round(er)})
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1 font-mono">
                    (60÷T×{constant})
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Produção do Dia (ER × 8,50) */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate">
                  Produção / Dia (ER × 8,50)
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-mono">
                    {dailyProduction.toFixed(1).replace('.', ',')}
                  </span>
                  <span className="text-xs font-bold text-emerald-400/80">bags/dia</span>
                  <span className="text-[10px] text-slate-500 ml-1 font-mono">
                    (~{Math.round(dailyProduction)} un)
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Controls: Type Selector & Table Button */}
          <div className="w-full xl:w-auto shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-3">
            
            {/* Bag Type Selector: One vs Travado */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setBagType('one')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  bagType === 'one'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>One</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  bagType === 'one' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-900 text-slate-400'
                }`}>8.5</span>
              </button>

              <button
                type="button"
                onClick={() => setBagType('travado')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  bagType === 'travado'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Travado</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  bagType === 'travado' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-900 text-slate-400'
                }`}>11</span>
              </button>
            </div>

            {/* Open Reference Table Button */}
            <button
              type="button"
              onClick={() => setIsReferenceModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold border border-cyan-500/30 hover:border-cyan-500/50 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
              title="Exibir tabela de tempos padrão e valores de ER de referência dos modelos de Big Bag"
            >
              <Table className="w-4 h-4 text-cyan-400" />
              <span>Exibir Tabela de Tempos</span>
            </button>

          </div>

        </div>
      </div>

      {/* Reference Times Modal */}
      <ReferenceTimesModal
        isOpen={isReferenceModalOpen}
        onClose={() => setIsReferenceModalOpen(false)}
      />
    </>
  );
};
