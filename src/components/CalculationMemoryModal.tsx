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

  const peopleOne = cellConfig?.peopleOne ?? 8.5;
  const peopleTravado = cellConfig?.peopleTravado ?? 11.0;
  const peopleSalaLimpa = cellConfig?.peopleSalaLimpa ?? 8.5;
  const peopleMulti = cellConfig?.peopleMulti ?? 8.5;
  const peopleFertilizante = cellConfig?.peopleFertilizante ?? 8.5;
  const peopleFertilizanteLiner = cellConfig?.peopleFertilizanteLiner ?? 8.5;
  const shiftHours = cellConfig?.shiftHours ?? 8.5;

  const allModels = [
    {
      name: 'Modelo "One"',
      people: peopleOne,
      color: 'border-cyan-500/20 text-cyan-300',
      badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
      desc: 'Montagem direta de Big Bags e Slings convencionais.'
    },
    {
      name: 'Modelo "Travado"',
      people: peopleTravado,
      color: 'border-amber-500/20 text-amber-300',
      badge: 'bg-amber-950 text-amber-300 border-amber-800',
      desc: 'Modelos estruturados com travas internas (baffles).'
    },
    {
      name: 'Modelo "Sala Limpa"',
      people: peopleSalaLimpa,
      color: 'border-emerald-500/20 text-emerald-300',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      desc: 'Ambiente controlado alimentício / farmacêutico.'
    },
    {
      name: 'Modelo "Multi"',
      people: peopleMulti,
      color: 'border-purple-500/20 text-purple-300',
      badge: 'bg-purple-950 text-purple-300 border-purple-800',
      desc: 'Células multifuncionais e montagens compostas.'
    },
    {
      name: 'Modelo "Fertilizante"',
      people: peopleFertilizante,
      color: 'border-lime-500/20 text-lime-300',
      badge: 'bg-lime-950 text-lime-300 border-lime-800',
      desc: 'Big Bags reforçados para fertilizantes e granéis.'
    },
    {
      name: 'Modelo "Fertilizante c/ Liner"',
      people: peopleFertilizanteLiner,
      color: 'border-blue-500/20 text-blue-300',
      badge: 'bg-blue-950 text-blue-300 border-blue-800',
      desc: 'Big Bags para fertilizantes com inserção e fixação de liner.'
    }
  ];

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
          
          {/* Highlight Note: Origin of Headcount Constants */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>O que representam as constantes multiplicadoras?</span>
            </div>
            <p className="text-xs text-cyan-100/90 leading-relaxed">
              As constantes representam o <strong>Número de Pessoas / Operadores alocados na Célula de Costura</strong> de cada tipo de modelo. A capacidade horária unitária de 1 operador é <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-cyan-300">60 ÷ T</code>. Ao multiplicar pelo número de operadores na célula, obtém-se a <strong>Estimativa de Ritmo (ER)</strong>.
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
              <span>2. Estimativa de Ritmo da Célula por Modelo (ER)</span>
            </div>
            <p className="text-xs text-slate-400">
              Fórmula geral: <code className="text-slate-200 font-mono">ER = (60 ÷ T) × (Nº Pessoas na Célula)</code>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {allModels.map((m, idx) => (
                <div key={idx} className={`p-3 rounded-xl bg-slate-900 border ${m.color} space-y-1.5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">{m.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${m.badge}`}>
                      {m.people.toFixed(1).replace('.', ',')} pess.
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950 font-mono text-xs text-center font-bold">
                    ER = (60 ÷ T) × {m.people.toFixed(1).replace('.', ',')}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {m.desc}
                  </p>
                </div>
              ))}
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
