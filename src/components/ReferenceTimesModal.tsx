'use client';

import React from 'react';
import { X, Table, Zap } from 'lucide-react';

interface ReferenceModelItem {
  modelo: string;
  tempo: number;
  er: number;
  descricao?: string;
}

export const REFERENCE_MODELS: ReferenceModelItem[] = [
  { modelo: 'BIG BAG C6 C/LINER', tempo: 11.83, er: 43, descricao: 'Big Bag 6 componentes com liner interno' },
  { modelo: 'BIG BAG C6 S/LINER', tempo: 11.18, er: 46, descricao: 'Big Bag 6 componentes sem liner' },
  { modelo: 'BIG BAG C4 C/LINER', tempo: 11.33, er: 45, descricao: 'Big Bag 4 componentes com liner interno' },
  { modelo: 'BIG BAG C4 S/LINER', tempo: 10.68, er: 48, descricao: 'Big Bag 4 componentes sem liner' },
  { modelo: 'SLING SIMPLES', tempo: 15.32, er: 33, descricao: 'Estrutura sling simples para movimentacao' },
  { modelo: 'SLING CAIXA', tempo: 15.75, er: 32, descricao: 'Estrutura sling tipo caixa reforcada' },
  { modelo: 'ALCADOR DOBRA /GUIA', tempo: 12.30, er: 41, descricao: 'Conjunto alcador com dobra e guia especial' },
  { modelo: 'ALCADOR', tempo: 10.83, er: 47, descricao: 'Alcador padrao' }
];

interface ReferenceTimesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferenceTimesModal: React.FC<ReferenceTimesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Tabela de Tempos & ER de Referência
              </h2>
              <p className="text-xs text-slate-400">
                Parâmetros industriais padronizados da fábrica
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-start gap-2.5 text-xs text-cyan-200">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Fórmula ER (Estimativa de Ritmo):</strong> <code className="bg-slate-950/70 px-1.5 py-0.5 rounded font-mono text-cyan-300">ER = (60 ÷ Tempo Total) × Constante</code> (8,5 para tipo <em>One</em> ou 11 para tipo <em>Travado</em>).
            </span>
          </div>

          {/* Styled Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900/60 to-cyan-900/60 border-b border-slate-800 text-white font-bold">
                  <th className="py-3 px-4 uppercase tracking-wider text-xs">MODELO</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-xs text-center">TEMPO (min)</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-xs text-center text-cyan-300">ER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {REFERENCE_MODELS.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-slate-100 flex flex-col">
                      <span>{item.modelo}</span>
                      {item.descricao && (
                        <span className="text-[11px] font-normal text-slate-400 mt-0.5">
                          {item.descricao}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-teal-300">
                      {item.tempo.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-extrabold text-cyan-300 text-base">
                      {item.er}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center text-xs text-slate-400">
          <span>Total de 8 modelos de referência</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
