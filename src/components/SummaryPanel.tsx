'use client';

import React, { useState } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { CELL_MODELS_DEFINITIONS } from '@/data/defaultData';
import { CellModelType } from '@/types/production';
import { Clock, Zap, Boxes, Table, FileText, Users, ChevronRight } from 'lucide-react';
import { ReferenceTimesModal } from './ReferenceTimesModal';
import { CalculationMemoryModal } from './CalculationMemoryModal';
import { CellConfigModal } from './CellConfigModal';

interface SummaryPanelProps {}

export const SummaryPanel: React.FC<SummaryPanelProps> = () => {
  const {
    calculatorTotalMinutes,
    calculatorReadableTime,
    selectedOperationIds,
    cellConfig
  } = useProduction();

  const [bagType, setBagType] = useState<CellModelType>('one');
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [isCalculationMemoryOpen, setIsCalculationMemoryOpen] = useState(false);
  const [isCellConfigOpen, setIsCellConfigOpen] = useState(false);

  const selectedModelDef = CELL_MODELS_DEFINITIONS.find(m => m.id === bagType) || CELL_MODELS_DEFINITIONS[0];
  const currentPeople = (cellConfig && (cellConfig as any)[selectedModelDef.configKey]) ?? selectedModelDef.defaultPeople;
  const shiftHours = cellConfig?.shiftHours ?? 8.5;

  const totalTime = calculatorTotalMinutes;
  const er = totalTime > 0 ? (60 / totalTime) * currentPeople : 0;
  const dailyProduction = er * shiftHours;

  return (
    <>
      <div className="sticky top-16 z-30 w-full py-2 -my-2 backdrop-blur-md bg-slate-950/80">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/30 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          
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
                    ER ({selectedModelDef.shortName} × {currentPeople.toFixed(1).replace('.', ',')}p)
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
                    (60÷T×{currentPeople.toFixed(1).replace('.', ',')})
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Produção do Dia (ER × Jornada) */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate">
                  Produção / Dia (ER × {shiftHours.toFixed(1).replace('.', ',')}h)
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

          {/* Right Controls: 6-Model Selector & Action Buttons */}
          <div className="w-full xl:w-auto shrink-0 flex flex-col items-stretch xl:items-end gap-2.5">
            
            {/* Bag/Cell Model Selector: 6 Models + Cell Sizing Button */}
            <div className="flex items-center gap-1.5 w-full xl:w-auto">
              <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner overflow-x-auto custom-scrollbar gap-1 flex-1">
                {CELL_MODELS_DEFINITIONS.map(model => {
                  const isSelected = bagType === model.id;
                  const people = (cellConfig && (cellConfig as any)[model.configKey]) ?? model.defaultPeople;

                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setBagType(model.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                        isSelected
                          ? `bg-gradient-to-r ${model.gradientClass} text-slate-950 shadow-md`
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                      title={model.description}
                    >
                      <span className="whitespace-nowrap">{model.shortName}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded font-mono font-bold ${
                        isSelected
                          ? 'bg-slate-950/30 text-slate-950'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {people.toFixed(1).replace('.', ',')}p
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Cell People Sizing Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCellConfigOpen(true)}
                className="p-2 rounded-xl bg-slate-950/90 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer shrink-0"
                title="Configurar número de operadores/pessoas nas células para cada modelo e horas do turno"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsReferenceModalOpen(true)}
                className="flex-1 xl:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold border border-cyan-500/30 hover:border-cyan-500/50 transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                title="Exibir tabela de tempos padrão e valores de ER de referência dos modelos de Big Bag"
              >
                <Table className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tabela de Tempos</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCalculationMemoryOpen(true)}
                className="flex-1 xl:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/30 hover:border-amber-500/50 transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                title="Ver fórmulas matemáticas, constantes industriais e memorial de cálculo"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Memorial de Cálculo</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Reference Times Modal */}
      <ReferenceTimesModal
        isOpen={isReferenceModalOpen}
        onClose={() => setIsReferenceModalOpen(false)}
      />

      {/* Calculation Memory Modal */}
      <CalculationMemoryModal
        isOpen={isCalculationMemoryOpen}
        onClose={() => setIsCalculationMemoryOpen(false)}
      />

      {/* Cell Sizing / Headcount Config Modal */}
      <CellConfigModal
        isOpen={isCellConfigOpen}
        onClose={() => setIsCellConfigOpen(false)}
      />
    </>
  );
};
