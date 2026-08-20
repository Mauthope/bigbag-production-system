'use client';

import React from 'react';
import { X, FileText, Calculator, Zap, Boxes, Clock, CheckCircle2, HelpCircle } from 'lucide-react';

interface CalculationMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculationMemoryModal: React.FC<CalculationMemoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Memorial de Cálculo & Metodologia
              </h2>
              <p className="text-xs text-slate-400">
                Detalhamento das fórmulas industriais, constantes de ritmo e projeções de produção
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed">
          
          {/* Section 1: Tempo Total */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>1. Tempo Total Padrão por Bag (T)</span>
            </div>
            <p className="text-xs text-slate-400">
              É a somatória de todos os tempos cronometrados e padronizados das operações ativas selecionadas para a confecção do Big Bag:
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-xs">
              T = Σ (Tempo das Operações Selecionadas) [em minutos decimais]
            </div>
          </div>

          {/* Section 2: Estimativa de Ritmo (ER) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>2. Estimativa de Ritmo Fabril (ER)</span>
            </div>
            <p className="text-xs text-slate-400">
              A base de cálculo parte do ritmo horário (60 min ÷ Tempo Total) multiplicado pelo coeficiente multiplicador de complexidade construtiva do modelo:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              
              {/* Box Tipo One */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Tipo "One"</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                    Constante = 8,5
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 font-mono text-cyan-300 text-xs text-center">
                  ER = (60 ÷ T) × 8,5
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Aplicado para modelos convencionais de Big Bags, Slings e Alçadores com padrão de montagem direta.
                </p>
              </div>

              {/* Box Tipo Travado */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Tipo "Travado"</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                    Constante = 11,0
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 font-mono text-amber-300 text-xs text-center">
                  ER = (60 ÷ T) × 11,0
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Aplicado para modelos que possuem travas internas estruturais (baffles), exigindo costuras de reforço adicionais.
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: Produção Diária */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Boxes className="w-4 h-4" />
              <span>3. Produção do Dia (Jornada Padrão de 8,5 Horas)</span>
            </div>
            <p className="text-xs text-slate-400">
              Projeta a meta de produção diária por turno de trabalho de 8,50 horas úteis:
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-300 text-xs">
              Produção do Dia = ER × 8,50 [bags / dia]
            </div>
          </div>

          {/* Section 4: Exemplo Numérico */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-teal-400" />
              <span>Exemplo Prático: BIG BAG C6 C/LINER (T = 11,83 min)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">1. Ritmo Base / Hora</span>
                <span className="text-slate-200 font-bold">60 ÷ 11,83 = 5,07 un/h</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">2. Cálculo da ER (One)</span>
                <span className="text-cyan-300 font-bold">5,07 × 8,5 = 43,11 (43 ER)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">3. Produção Diária (8,5h)</span>
                <span className="text-emerald-300 font-bold">43,11 × 8,50 = 366 bags/dia</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center text-xs text-slate-400">
          <span>Engenharia de Processos & Cronoanálise Industrial</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
