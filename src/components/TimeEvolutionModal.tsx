'use client';

import React, { useState, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { OperationItem, OperationTimeHistoryEntry } from '@/types/production';
import {
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Award,
  Layers,
  History,
  Info,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface TimeEvolutionModalProps {
  operation: OperationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TimeEvolutionModal: React.FC<TimeEvolutionModalProps> = ({
  operation,
  isOpen,
  onClose
}) => {
  const { categoriesConfig, updateOperationHistory, showToast } = useProduction();

  // Form to add a historical record
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<number>(operation?.time || 1.0);
  const [newNotes, setNewNotes] = useState('');

  // Extract history entries or create synthetic baseline
  const historyEntries: OperationTimeHistoryEntry[] = useMemo(() => {
    if (!operation) return [];
    if (operation.history && operation.history.length > 0) {
      return [...operation.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // Default baseline if no history yet
    return [
      {
        id: `hist-${operation.id}-1`,
        operationId: operation.id,
        time: operation.time,
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months ago
        notes: 'Tempo padrão de fábrica (Baseline inicial)',
        source: 'inicial'
      },
      {
        id: `hist-${operation.id}-2`,
        operationId: operation.id,
        time: operation.time,
        date: new Date().toISOString().split('T')[0],
        notes: 'Tempo atual em operação',
        source: 'manual'
      }
    ];
  }, [operation]);

  // Compute Metrics
  const firstTime = historyEntries[0]?.time || operation?.time || 1;
  const lastTime = historyEntries[historyEntries.length - 1]?.time || operation?.time || 1;
  const deltaMinutes = lastTime - firstTime;
  const deltaPercentage = firstTime > 0 ? (deltaMinutes / firstTime) * 100 : 0;

  const isImproved = deltaMinutes < -0.01;
  const isWorse = deltaMinutes > 0.01;

  // Chart formatted data
  const chartData = useMemo(() => {
    return historyEntries.map(h => {
      const d = new Date(h.date);
      const formattedDate = !isNaN(d.getTime())
        ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
        : h.date;

      return {
        date: formattedDate,
        fullDate: h.date,
        timeMinutes: Number(h.time.toFixed(2)),
        timeSeconds: Number((h.time * 60).toFixed(0)),
        notes: h.notes || 'Atualização de tempo',
        source: h.source || 'manual'
      };
    });
  }, [historyEntries]);

  if (!isOpen || !operation) return null;

  const config = categoriesConfig[operation.category] || {
    key: operation.category,
    title: operation.category,
    colorHex: '#06b6d4'
  };

  const handleAddHistoricalPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTime <= 0) {
      showToast('Informe um tempo válido em minutos.', 'error');
      return;
    }

    const entry: OperationTimeHistoryEntry = {
      id: `hist-${Date.now()}`,
      operationId: operation.id,
      time: Number(newTime),
      date: newDate,
      notes: newNotes.trim() || 'Ajuste de melhoria Kaizen',
      source: 'manual'
    };

    const updatedHistory = [...historyEntries, entry];
    await updateOperationHistory(operation.id, updatedHistory);

    setNewNotes('');
    setIsAddingEntry(false);
    showToast('Novo marco histórico registrado com sucesso!', 'success');
  };

  const handleDeleteHistoryEntry = async (entryId: string) => {
    if (historyEntries.length <= 1) {
      showToast('O histórico deve conter ao menos 1 registro.', 'error');
      return;
    }
    const filtered = historyEntries.filter(h => h.id !== entryId);
    await updateOperationHistory(operation.id, filtered);
    showToast('Registro histórico removido.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: `${config.colorHex}20`,
                borderColor: `${config.colorHex}40`,
                color: config.colorHex
              }}
            >
              <History className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Evolução Histórica do Tempo (Curva Kaizen)
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-bold border"
                  style={{
                    backgroundColor: `${config.colorHex}20`,
                    borderColor: `${config.colorHex}40`,
                    color: config.colorHex
                  }}
                >
                  {config.title}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operação: <strong className="text-slate-200">{operation.name}</strong> &bull; Acompanhamento de melhorias ao longo do tempo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            
            {/* Baseline */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tempo Inicial (Baseline)</span>
              <div className="text-xl font-extrabold font-mono text-white mt-1">
                {firstTime.toFixed(2)} <span className="text-xs font-normal text-slate-400">min</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {(firstTime * 60).toFixed(0)}s &bull; {chartData[0]?.date || 'Inicial'}
              </span>
            </div>

            {/* Current Time */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tempo Atual</span>
              <div className="text-xl font-extrabold font-mono text-cyan-300 mt-1">
                {lastTime.toFixed(2)} <span className="text-xs font-normal text-slate-400">min</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {(lastTime * 60).toFixed(0)}s &bull; Última medição
              </span>
            </div>

            {/* Total Variation Delta */}
            <div className={`p-3.5 rounded-2xl border ${
              isImproved
                ? 'bg-emerald-950/40 border-emerald-800/60'
                : isWorse
                ? 'bg-rose-950/40 border-rose-800/60'
                : 'bg-slate-950/70 border-slate-800'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Evolução Total</span>
              <div className={`text-xl font-extrabold font-mono mt-1 flex items-center gap-1 ${
                isImproved ? 'text-emerald-400' : isWorse ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {isImproved && <TrendingDown className="w-5 h-5 stroke-[2.5]" />}
                {isWorse && <TrendingUp className="w-5 h-5 stroke-[2.5]" />}
                <span>{Math.abs(deltaPercentage).toFixed(1)}%</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                {deltaMinutes <= 0 ? '-' : '+'}{Math.abs(deltaMinutes).toFixed(2)} min ({Math.abs(deltaMinutes * 60).toFixed(0)}s)
              </span>
            </div>

            {/* Total Kaizens */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Revisões / Kaizens</span>
              <div className="text-xl font-extrabold font-mono text-teal-300 mt-1">
                {historyEntries.length} <span className="text-xs font-normal text-slate-400">marcos</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                {isImproved ? '✓ Produtividade em alta' : 'Monitoramento ativo'}
              </span>
            </div>

          </div>

          {/* Big Historical Area Chart */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  Curva de Redução de Tempo e Ganhos de Eficiência
                </h3>
                <p className="text-xs text-slate-400">
                  Acompanhe a trajetória de melhorias e comprovações de redução do ciclo
                </p>
              </div>

              <button
                onClick={() => setIsAddingEntry(!isAddingEntry)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Marco</span>
              </button>
            </div>

            {/* New Historical Entry Drawer */}
            {isAddingEntry && (
              <form onSubmit={handleAddHistoricalPoint} className="mb-4 p-3.5 rounded-xl bg-slate-900 border border-cyan-500/40 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in">
                <div className="w-full sm:w-36">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data da Medição</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Novo Tempo (min)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newTime}
                    onChange={e => setNewTime(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono font-bold"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Justificativa / Melhoria Realizada</label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    placeholder="Ex: Kaizen: Novo gabarito de alça reduziu 25s..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500"
                  />
                </div>

                <div className="pt-4 sm:pt-0 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            )}

            {/* Recharts Area Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isImproved ? '#10b981' : '#06b6d4'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={isImproved ? '#10b981' : '#06b6d4'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} min (${(Number(val) * 60).toFixed(0)}s)`, 'Tempo Padrão']}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return `${label} ${item?.notes ? `— "${item.notes}"` : ''}`;
                    }}
                  />
                  <ReferenceLine
                    y={firstTime}
                    stroke="#64748b"
                    strokeDasharray="3 3"
                    label={{ value: `Baseline: ${firstTime.toFixed(2)}m`, fill: '#64748b', fontSize: 10, position: 'insideTopRight' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="timeMinutes"
                    stroke={isImproved ? '#10b981' : '#06b6d4'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTime)"
                    dot={{ r: 5, fill: isImproved ? '#10b981' : '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Timeline / History Table */}
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Histórico de Revisões & Linha do Tempo Kaizen
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {historyEntries.length} registros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-2.5 px-4">Data</th>
                    <th className="py-2.5 px-4">Tempo Padrão</th>
                    <th className="py-2.5 px-4">Variação vs Baseline</th>
                    <th className="py-2.5 px-4">Origem</th>
                    <th className="py-2.5 px-4">Justificativa / Kaizen Realizado</th>
                    <th className="py-2.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {historyEntries.map((h, idx) => {
                    const diffVsBase = h.time - firstTime;
                    const pctVsBase = firstTime > 0 ? (diffVsBase / firstTime) * 100 : 0;
                    const isRowImproved = diffVsBase < -0.01;

                    return (
                      <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-slate-300 font-bold">
                          {h.date}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-white">
                          {h.time.toFixed(2)} min <span className="text-[10px] text-slate-500">({(h.time * 60).toFixed(0)}s)</span>
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {idx === 0 ? (
                            <span className="text-slate-500 text-[10px]">Marco Inicial</span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                              isRowImproved ? 'text-emerald-400' : diffVsBase > 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {isRowImproved && <TrendingDown className="w-3.5 h-3.5" />}
                              {diffVsBase > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                              {pctVsBase <= 0 ? '' : '+'}{pctVsBase.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            h.source === 'cronoanalise'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                              : h.source === 'inicial'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50'
                          }`}>
                            {h.source === 'cronoanalise' ? 'Cronoanálise' : h.source === 'inicial' ? 'Baseline' : 'Manual'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">
                          {h.notes || 'Sem observações'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryEntry(h.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Remover este registro histórico"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center text-xs text-slate-500">
          <span>Este histórico permite certificar a evolução de produtividade e comprovar ganhos Lean em auditorias e reuniões de melhoria contínua.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
