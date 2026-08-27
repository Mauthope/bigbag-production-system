'use client';

import React, { useState, useEffect } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { X, DollarSign, RotateCcw, Check, Sparkles } from 'lucide-react';

interface SectorCostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SectorCostModal: React.FC<SectorCostModalProps> = ({ isOpen, onClose }) => {
  const { categories, financialConfig, updateFinancialConfig } = useProduction();
  const [rates, setRates] = useState<Record<string, number>>({});
  const [defaultRate, setDefaultRate] = useState<number>(28.5);

  useEffect(() => {
    if (financialConfig) {
      setRates(financialConfig.sectorHourlyRates || {});
      setDefaultRate(financialConfig.defaultHourlyRate || 28.5);
    }
  }, [financialConfig, isOpen]);

  if (!isOpen) return null;

  const handleRateChange = (categoryKey: string, value: string) => {
    const num = parseFloat(value.replace(',', '.'));
    setRates(prev => ({
      ...prev,
      [categoryKey]: isNaN(num) ? defaultRate : num
    }));
  };

  const handleApplyToAll = () => {
    const updated: Record<string, number> = {};
    categories.forEach(cat => {
      updated[cat.key] = defaultRate;
    });
    setRates(updated);
  };

  const handleSave = async () => {
    await updateFinancialConfig({
      defaultHourlyRate: defaultRate,
      sectorHourlyRates: rates
    });
    onClose();
  };

  const handleReset = () => {
    setRates({});
    setDefaultRate(28.5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Custo Hora-Homem por Setor
              </h2>
              <p className="text-xs text-slate-400">
                Configure o valor em R$/hora da mão-de-obra direta para cada componente
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          
          {/* Default Rate Control */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white block">Custo Hora Padrão Global</span>
              <span className="text-[11px] text-slate-400">
                Aplicado automaticamente nos setores sem valor individual definido
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-32">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={defaultRate}
                  onChange={e => setDefaultRate(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-right text-sm font-bold text-emerald-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyToAll}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                title="Copiar esse valor para todos os setores"
              >
                Aplicar a Todos
              </button>
            </div>
          </div>

          {/* Sector Breakdown Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Personalização por Setor de Costura / Montagem ({categories.length} setores)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map(cat => {
                const currentVal = rates[cat.key] !== undefined ? rates[cat.key] : defaultRate;

                return (
                  <div
                    key={cat.key}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.colorHex || '#06b6d4' }}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-200 block truncate">
                          {cat.title}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {cat.description || 'Setor de produção'}
                        </span>
                      </div>
                    </div>

                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">R$</span>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={currentVal}
                        onChange={e => handleRateChange(cat.key, e.target.value)}
                        className="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-right text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-950/30 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Custos</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
