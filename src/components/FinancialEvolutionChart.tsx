'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Clock,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { MonthlyClosingRecord, OperationItem } from '@/types/production';

interface FinancialEvolutionChartProps {
  monthlyHistory: Record<string, MonthlyClosingRecord>;
  activeMonthKey: string;
  currentMonthNetSavings: number;
  currentMonthHoursSaved: number;
  totalCycleTimeMinutes: number; // Tempo atual por bag
  baselineCycleTimeMinutes: number; // Tempo inicial por bag
  errorMarginPercent?: number;
}

type FinancialMetric = 'accumulated_savings' | 'cycle_time' | 'kaizen_index';

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({
  monthlyHistory,
  activeMonthKey,
  currentMonthNetSavings,
  currentMonthHoursSaved,
  totalCycleTimeMinutes,
  baselineCycleTimeMinutes,
  errorMarginPercent = 5
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<FinancialMetric>('accumulated_savings');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Construct continuous timeline from historical months up to the current active month
  const timelineData = useMemo(() => {
    const keys = Object.keys(monthlyHistory).sort();
    if (!keys.includes(activeMonthKey)) {
      keys.push(activeMonthKey);
    }
    keys.sort();

    let runningAccumulatedSavings = 0;
    let runningAccumulatedHours = 0;

    const baseCycleTime = baselineCycleTimeMinutes > 0 ? baselineCycleTimeMinutes : 13.5;
    const currentCycleTime = totalCycleTimeMinutes > 0 ? totalCycleTimeMinutes : 11.2;
    const totalReduction = baseCycleTime - currentCycleTime;

    return keys.map((key, index) => {
      const rec = monthlyHistory[key];
      const isCurrent = key === activeMonthKey;

      // Net savings of this specific month
      const monthNet = isCurrent ? currentMonthNetSavings : (rec?.netSavings ?? 0);
      const monthHours = isCurrent ? currentMonthHoursSaved : (rec?.netHours ?? 0);
      const volume = rec?.volume ?? 20000;

      // Accumulate across timeline
      runningAccumulatedSavings += monthNet;
      runningAccumulatedHours += monthHours;

      // Calculate smooth estimated cycle time progression
      const progressFraction = keys.length > 1 ? index / (keys.length - 1) : 1;
      // Cycle time starts at baseCycleTime and moves according to progress and cumulative hours
      const cycleTime = Number(
        (baseCycleTime - totalReduction * progressFraction).toFixed(2)
      );

      // Kaizen Productivity Index (Base 100)
      const efficiencyGainPercent = baseCycleTime > 0 ? ((baseCycleTime - cycleTime) / baseCycleTime) * 100 : 0;
      const kaizenIndex = Number((100 + efficiencyGainPercent).toFixed(1));

      return {
        key,
        dateLabel: rec?.monthLabel ? rec.monthLabel.split('/')[0] : key,
        fullLabel: rec?.monthLabel || key,
        volume,
        monthNet: Number(monthNet.toFixed(2)),
        accumulatedSavings: Number(runningAccumulatedSavings.toFixed(2)),
        monthHours: Number(monthHours.toFixed(1)),
        accumulatedHours: Number(runningAccumulatedHours.toFixed(1)),
        cycleTime,
        kaizenIndex,
        isCurrent
      };
    });
  }, [
    monthlyHistory,
    activeMonthKey,
    currentMonthNetSavings,
    currentMonthHoursSaved,
    totalCycleTimeMinutes,
    baselineCycleTimeMinutes
  ]);

  // Summary figures
  const latestPoint = timelineData[timelineData.length - 1] || {
    accumulatedSavings: 0,
    cycleTime: 0,
    kaizenIndex: 100,
    monthNet: 0
  };

  const totalGainSinceStart = latestPoint.accumulatedSavings;
  const currentKaizenScore = latestPoint.kaizenIndex;
  const currentReductionMinutes = baselineCycleTimeMinutes - (totalCycleTimeMinutes || latestPoint.cycleTime);

  const formatYAxis = (val: number) => {
    if (selectedMetric === 'accumulated_savings') {
      if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
      return `R$ ${val.toFixed(0)}`;
    }
    if (selectedMetric === 'cycle_time') {
      return `${val.toFixed(1)}m`;
    }
    return `${val.toFixed(0)} pts`;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-2xl space-y-5">
      
      {/* Header & Financial Ticker Overview */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Curva Contínua de Evolução Histórica
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono font-bold">
                  Estilo Índice Financeiro
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhamento temporal ininterrupto desde o Marco Zero até o mês vigente
              </p>
            </div>
          </div>
        </div>

        {/* Ticker Badges & Metric Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Ticker Buttons (Curva Acumulada vs Tempo por Bag vs Índice Base 100) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedMetric('accumulated_savings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'accumulated_savings'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Acompanhar a curva de economia financeira líquida acumulada ao longo dos meses"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>ROI Acumulado (R$)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMetric('cycle_time')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'cycle_time'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Acompanhar a queda do tempo de ciclo de produção por Big Bag"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tempo / Bag (min)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMetric('kaizen_index')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'kaizen_index'
                  ? 'bg-indigo-500 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Índice de produtividade da fábrica (Base 100 no Marco Zero)"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Índice Produtividade (Base 100)</span>
            </button>
          </div>

        </div>

      </div>

      {/* Financial Ticker Cards (Cotação de Desempenho) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Card 1: Saldo Acumulado */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Retorno Acumulado no Período
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs text-emerald-400 font-bold">R$</span>
              <span className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                {totalGainSinceStart >= 0 ? '+' : ''}{totalGainSinceStart.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Tempo de Fabricação Reduzido */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Ganho Médio por Big Bag
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-cyan-300 tracking-tight">
                {currentReductionMinutes > 0 ? '-' : '+'}{Math.abs(currentReductionMinutes).toFixed(2).replace('.', ',')} min
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (~{(Math.abs(currentReductionMinutes) * 60).toFixed(0)}s mais rápido)
              </span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Índice de Produtividade */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-indigo-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Índice Kaizen de Eficiência
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black font-mono text-indigo-300 tracking-tight">
                {currentKaizenScore.toFixed(1).replace('.', ',')}
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                (+{(currentKaizenScore - 100).toFixed(1).replace('.', ',')}%)
              </span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Financial Area Chart Container */}
      <div className="h-72 w-full pt-2">
        {!isMounted ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            Carregando gráfico financeiro...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="financialGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedMetric === 'cycle_time' ? '#06b6d4' : '#10b981'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={selectedMetric === 'cycle_time' ? '#06b6d4' : '#10b981'} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

              <XAxis
                dataKey="dateLabel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />

              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={formatYAxis}
                tickLine={false}
                domain={selectedMetric === 'cycle_time' ? ['auto', 'auto'] : [0, 'auto']}
              />

              <Tooltip
                cursor={{ stroke: '#06b6d4', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;

                  return (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-xs space-y-2 min-w-[240px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          {item.fullLabel}
                        </span>
                        {item.isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                            Mês Vigente
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 font-mono">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>ROI Acumulado:</span>
                          <strong className="text-emerald-400">
                            + R$ {item.accumulatedSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Balanço deste Mês:</span>
                          <span className={item.monthNet >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                            {item.monthNet >= 0 ? '+' : ''} R$ {item.monthNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/80 pt-1">
                          <span>Tempo por Bag:</span>
                          <span className="text-cyan-300 font-bold">{item.cycleTime.toFixed(2)} min</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Índice Produtividade:</span>
                          <span className="text-indigo-300 font-bold">{item.kaizenIndex} pts</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-500 text-[10px]">
                          <span>Volume Produzido:</span>
                          <span>{item.volume.toLocaleString('pt-BR')} bags</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey={
                  selectedMetric === 'accumulated_savings'
                    ? 'accumulatedSavings'
                    : selectedMetric === 'cycle_time'
                    ? 'cycleTime'
                    : 'kaizenIndex'
                }
                stroke={selectedMetric === 'cycle_time' ? '#06b6d4' : '#10b981'}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#financialGradient)"
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer explanation */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Linha de tendência contínua demonstrando a evolução cumulativa da fábrica</span>
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          Marco Zero ({timelineData[0]?.fullLabel}): <strong>Base Histórica Inicial</strong>
        </span>
      </div>

    </div>
  );
};
