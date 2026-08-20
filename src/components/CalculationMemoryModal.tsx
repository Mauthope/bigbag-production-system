'use client';

import React from 'react';
import { useProduction } from '@/context/ProductionContext';
import { X, FileText, Calculator, Zap, Boxes, Clock, Users, Info } from 'lucide-react';

interface CalculationMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculationMemoryModal: React.FC<CalculationMemoryModalProps> = ({ isOpen, onClose }) => {
  const { cellConfig } = useProduction();

  if (!isOpen) return null;

  const peopleOne = cellConfig?.peopleOne || 8.5;
  const peopleTravado = cellConfig?.peopleTravado || 11.0;
  const shiftHours = cellConfig?.shiftHours || 8.5;

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
                Memorial de Cálculo & Dimensionamento de Célula
              </h2>
              <p className="text-xs text-slate-400">
                Significado das constantes, fórmulas industriais e projeções de capacidade
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
          
          {/* Highlight Note: Origin of 8.5 * 8.5 */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>O que representam as constantes 8,5 e 11,0?</span>
            </div>
            <p className="text-xs text-cyan-100/90 leading-relaxed">
              As constantes representam o <strong>Número de Pessoas / Operadores alocados na Célula de Costura</strong>. Por esse motivo, no modelo <em>One</em> a conta diária é <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-cyan-300">8,5 × 8,5</code>: são <strong>8,5 pessoas</strong> na célula multiplicadas por uma jornada de <strong>8,5 horas por dia</strong>!
            </p>
          </div>

          {/* Section 1: Tempo Total */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>1. Tempo Total Padrão por Bag (T)</span>
            </div>
            <p className="text-xs text-slate-400">
              Somatória dos tempos cronometrados de cada operação selecionada para o modelo:
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-xs">
              T = Σ (Tempo das Operações Selecionadas) [em minutos decimais]
            </div>
          </div>

          {/* Section 2: Estimativa de Ritmo (ER) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>2. Estimativa de Ritmo da Célula (ER)</span>
            </div>
            <p className="text-xs text-slate-400">
              O ritmo horário unitário de 1 operador é <code className="text-slate-300 font-mono">60 ÷ T</code> (bags/hora/pessoa). Ao multiplicar pelo número de operadores na célula, obtém-se a capacidade horária da célula inteira (ER):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              
              {/* Box Tipo One */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Modelo Tipo "One"</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold">
                    {peopleOne.toFixed(1).replace('.', ',')} operadores
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 font-mono text-cyan-300 text-xs text-center">
                  ER = (60 ÷ T) × {peopleOne.toFixed(1).replace('.', ',')}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Célula dimensionada para montagem direta de Big Bags e Slings convencionais.
                </p>
              </div>

              {/* Box Tipo Travado */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Modelo Tipo "Travado"</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                    {peopleTravado.toFixed(1).replace('.', ',')} operadores
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 font-mono text-amber-300 text-xs text-center">
                  ER = (60 ÷ T) × {peopleTravado.toFixed(1).replace('.', ',')}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Célula com mais postos de trabalho para costura das travas estruturais internas (baffles).
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: Produção Diária */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Boxes className="w-4 h-4" />
              <span>3. Produção do Dia (Jornada de {shiftHours.toFixed(1).replace('.', ',')} Horas Úteis)</span>
            </div>
            <p className="text-xs text-slate-400">
              A produção diária total da célula resulta da multiplicação do ritmo horário (ER) pelas horas do turno de trabalho:
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-emerald-300 text-xs space-y-1">
              <div>Produção do Dia = ER × {shiftHours.toFixed(2).replace('.', ',')} [bags / dia]</div>
              <div className="text-[11px] text-slate-500">
                Equivalente a: (60 ÷ T) × (Nº Pessoas) × ({shiftHours.toFixed(1).replace('.', ',')} horas/dia)
              </div>
            </div>
          </div>

          {/* Section 4: Exemplo Numérico */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-teal-400" />
              <span>Exemplo Prático: BIG BAG C6 C/LINER (T = 11,83 min | One)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">1. Ritmo de 1 Operador</span>
                <span className="text-slate-200 font-bold">60 ÷ 11,83 = 5,07 un/h/pessoa</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">2. Ritmo da Célula ({peopleOne} pess)</span>
                <span className="text-cyan-300 font-bold">5,07 × {peopleOne} = 43,11 (43 ER)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">3. Produção Dia ({shiftHours}h)</span>
                <span className="text-emerald-300 font-bold">43,11 × {shiftHours} = 366 bags/dia</span>
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
