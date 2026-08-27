'use client';

import React, { useState } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { X, Calendar, Plus, Check } from 'lucide-react';

interface NewMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewMonthModal: React.FC<NewMonthModalProps> = ({ isOpen, onClose }) => {
  const { financialConfig, startNewMonth } = useProduction();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [initialVolume, setInitialVolume] = useState<number>(financialConfig?.monthlyVolume || 20000);

  if (!isOpen) return null;

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const handleCreateMonth = async () => {
    const formattedMonth = String(selectedMonth).padStart(2, '0');
    const monthKey = `${selectedYear}-${formattedMonth}`;
    const monthLabel = `${months[selectedMonth - 1].label}/${selectedYear}`;

    // Starts the new month with all baselines advanced and zero balance
    await startNewMonth(monthKey, initialVolume, monthLabel);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Iniciar Novo Mês de Produção
              </h2>
              <p className="text-xs text-slate-400">
                Configure a virada de mês para separar volumes e histórico
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

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">
                Mês de Referência
              </label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">
                Ano
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value, 10) || currentYear)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">
              Volume Previsto do Mês (Quantidade de Bags)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1000"
                min="0"
                value={initialVolume}
                onChange={e => setInitialVolume(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-bold text-sm focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                bags/mês
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Como cada mês tem sua sazonalidade, esse volume será exclusivo deste período.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <span className="text-base leading-none">🌱</span>
            <p className="text-[11px] leading-relaxed text-slate-300">
              <strong className="text-emerald-300">Balanço 100% Zerado:</strong> A última medição registrada de cada operação se tornará a nova referência inicial. Os ganhos e perdas começarão do zero e registrarão apenas as novas medições feitas neste mês.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreateMonth}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-bold hover:brightness-110 shadow-lg shadow-cyan-950/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar / Ativar Mês</span>
          </button>
        </div>

      </div>
    </div>
  );
};
