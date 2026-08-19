'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { ProductionOrder, ComponentCategoryKey } from '@/types/production';
import {
  X,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Gauge,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecordTimeModalProps {
  order: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordTimeModal: React.FC<RecordTimeModalProps> = ({ order, isOpen, onClose }) => {
  const { recordOrderTime, categories, categoriesConfig, operations, showToast } = useProduction();

  const [producedQuantity, setProducedQuantity] = useState<number>(1);
  const [actualTotalMinutes, setActualTotalMinutes] = useState<number>(0);
  const [showComponentBreakdown, setShowComponentBreakdown] = useState<boolean>(false);
  const [componentTimes, setComponentTimes] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (order) {
      setProducedQuantity(order.producedQuantity > 0 ? order.producedQuantity : order.targetQuantity);
      setActualTotalMinutes(
        order.actualTimeTotal || Number((order.standardTimePerBag * (order.producedQuantity || order.targetQuantity)).toFixed(1))
      );
      if (order.componentTimes) {
        setComponentTimes(order.componentTimes as Record<string, number>);
      }
      setNotes(order.notes || '');
    }
  }, [order]);

  // If user edits component times, sync total
  const handleComponentTimeChange = (cat: string, val: number) => {
    const next = { ...componentTimes, [cat]: Math.max(0, val) };
    setComponentTimes(next);
    const sum = Object.values(next).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      setActualTotalMinutes(sum);
    }
  };

  const standardExpectedForProduced = useMemo(() => {
    if (!order) return 0;
    return order.standardTimePerBag * producedQuantity;
  }, [order, producedQuantity]);

  const efficiency = useMemo(() => {
    if (actualTotalMinutes <= 0 || standardExpectedForProduced <= 0) return 100;
    return (standardExpectedForProduced / actualTotalMinutes) * 100;
  }, [standardExpectedForProduced, actualTotalMinutes]);

  const timeDeviation = useMemo(() => {
    return actualTotalMinutes - standardExpectedForProduced;
  }, [actualTotalMinutes, standardExpectedForProduced]);

  if (!isOpen || !order) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (actualTotalMinutes <= 0) {
      showToast('O tempo real apontado deve ser maior que zero.', 'error');
      return;
    }

    await recordOrderTime(
      order.id,
      actualTotalMinutes,
      showComponentBreakdown ? componentTimes : undefined,
      producedQuantity,
      notes
    );

    if (producedQuantity >= order.targetQuantity) {
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.7 }
        });
      } catch {}
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Apontamento de Produção</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-cyan-400 border border-slate-700">
                  {order.opNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">{order.client} &bull; {order.modelDescription}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          
          {/* Efficiency Gauge Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Eficiência Operacional Calculada
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl font-extrabold font-mono ${
                    efficiency >= 100
                      ? 'text-emerald-400'
                      : efficiency >= 85
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {efficiency.toFixed(1)}%
                </span>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  {efficiency >= 100 ? (
                    <span className="text-emerald-400 flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 inline mr-0.5" /> Alta Produtividade
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center">
                      <TrendingDown className="w-3.5 h-3.5 inline mr-0.5" /> Abaixo da Meta
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-300 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
              <div>
                <span className="text-slate-500 block">Tempo Previsto:</span>
                <strong className="font-mono text-sm text-cyan-300">
                  {standardExpectedForProduced.toFixed(1)} min
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  ({(standardExpectedForProduced / 60).toFixed(1)} h)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Desvio de Tempo:</span>
                <strong
                  className={`font-mono text-sm ${
                    timeDeviation <= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {timeDeviation <= 0 ? '' : '+'}
                  {timeDeviation.toFixed(1)} min
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  {timeDeviation <= 0 ? 'economia' : 'atraso'}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity & Total Actual Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantidade Realizada (Bags)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  required
                  value={producedQuantity}
                  onChange={e => setProducedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                />
                <span className="text-xs text-slate-500 shrink-0">de {order.targetQuantity}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tempo Real Total Gasto (minutos)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={actualTotalMinutes}
                onChange={e => setActualTotalMinutes(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Equivalente a {(actualTotalMinutes / 60).toFixed(2)} horas de trabalho
              </span>
            </div>
          </div>

          {/* Toggle Granular Component Breakdown */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowComponentBreakdown(!showComponentBreakdown)}
              className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Apontar Tempos Específicos por Componente (Alça, Fundo, Fechamento...)</span>
              </div>
              {showComponentBreakdown ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showComponentBreakdown && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in">
                {categories.map(config => {
                  return (
                    <div key={config.key}>
                      <label
                        className="block text-[11px] font-semibold truncate mb-1"
                        style={{ color: config.colorHex }}
                      >
                        {config.title}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={componentTimes[config.key] || ''}
                        onChange={e => handleComponentTimeChange(config.key, parseFloat(e.target.value) || 0)}
                        placeholder="0 min"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observações / Motivo de Eventuais Desvios
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Troca de linha, quebra de agulha, tecido mais espesso..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar Apontamento
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
