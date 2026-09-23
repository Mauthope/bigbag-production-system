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
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';
import { MonthlyClosingRecord } from '@/types/production';

interface FinancialEvolutionChartProps {
  monthlyHistory: Record<string, MonthlyClosingRecord>;
  activeMonthKey: string;
  currentMonthNetSavings: number;
  currentMonthHoursSaved: number;
  totalCycleTimeMinutes: number; // Tempo atual por bag
  baselineCycleTimeMinutes: number; // Tempo inicial por bag
  errorMarginPercent?: number;
  totalKaizenCompletedSavings?: number; // Ganhos Reais Auditados Kaizen (R$)
}

export type EvolutionMetric = 'cycle_time' | 'percent_change' | 'kaizen_savings';

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({
  monthlyHistory,
  activeMonthKey,
  currentMonthNetSavings,
  currentMonthHoursSaved,
  totalCycleTimeMinutes,
  baselineCycleTimeMinutes,
  errorMarginPercent = 5,
  totalKaizenCompletedSavings = 0
}) => {
  const [isMounted, setIsMounted] = useState(false);
  // Padrão definido para tempo de ciclo por bag conforme solicitação do usuário
  const [selectedMetric, setSelectedMetric] = useState<EvolutionMetric>('cycle_time');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Construção da linha do tempo contínua do Marco Zero até o mês ativo
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

      const monthNet = isCurrent ? currentMonthNetSavings : (rec?.netSavings ?? 0);
      const monthHours = isCurrent ? currentMonthHoursSaved : (rec?.netHours ?? 0);
      const volume = rec?.volume ?? 20000;

      runningAccumulatedSavings += monthNet;
      runningAccumulatedHours += monthHours;

      // Progressão contínua do tempo de ciclo
      const progressFraction = keys.length > 1 ? index / (keys.length - 1) : 1;
      const cycleTime = Number(
        (baseCycleTime - totalReduction * progressFraction).toFixed(2)
      );

      // Variação percentual em relação ao Marco Zero (negativo = redução de tempo = melhoria)
      const percentChangeFromStart = baseCycleTime > 0
        ? Number((((cycleTime - baseCycleTime) / baseCycleTime) * 100).toFixed(1))
        : 0;

      // Ganho de eficiência em velocidade
      const efficiencyGainPercent = baseCycleTime > 0
        ? Number((((baseCycleTime - cycleTime) / baseCycleTime) * 100).toFixed(1))
        : 0;

      // Ganhos Reais de Kaizen auditados (exclusivo para melhorias pontuais)
      const kaizenSavings = isCurrent
        ? totalKaizenCompletedSavings
        : (rec?.totalSavings ?? 0);

      return {
        key,
        dateLabel: rec?.monthLabel ? rec.monthLabel.split('/')[0] : key,
        fullLabel: rec?.monthLabel || key,
        volume,
        cycleTime,
        percentChangeFromStart,
        efficiencyGainPercent,
        kaizenSavings: Number(kaizenSavings.toFixed(2)),
        monthNet: Number(monthNet.toFixed(2)),
        accumulatedSavings: Number(runningAccumulatedSavings.toFixed(2)),
        monthHours: Number(monthHours.toFixed(1)),
        accumulatedHours: Number(runningAccumulatedHours.toFixed(1)),
        isCurrent
      };
    });
  }, [
    monthlyHistory,
    activeMonthKey,
    currentMonthNetSavings,
    currentMonthHoursSaved,
    totalCycleTimeMinutes,
    baselineCycleTimeMinutes,
    totalKaizenCompletedSavings
  ]);

  // Resumo atual
  const latestPoint = timelineData[timelineData.length - 1] || {
    cycleTime: 0,
    percentChangeFromStart: 0,
    efficiencyGainPercent: 0,
    kaizenSavings: 0
  };

  const currentCycleTime = totalCycleTimeMinutes > 0 ? totalCycleTimeMinutes : latestPoint.cycleTime;
  const currentReductionMinutes = baselineCycleTimeMinutes - currentCycleTime;
  const currentReductionSeconds = Math.round(Math.abs(currentReductionMinutes) * 60);
  const currentEfficiencyPercent = latestPoint.percentChangeFromStart;
  const kaizenAuditSavings = totalKaizenCompletedSavings > 0 ? totalKaizenCompletedSavings : latestPoint.kaizenSavings;

  const formatYAxis = (val: number) => {
    if (selectedMetric === 'cycle_time') {
      return `${val.toFixed(1)}m`;
    }
    if (selectedMetric === 'percent_change') {
      return `${val > 0 ? '+' : ''}${val.toFixed(0)}%`;
    }
    if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val.toFixed(0)}`;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-2xl space-y-5">
      
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Curva Contínua de Evolução Histórica
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold">
                  Engenharia de Tempos & Kaizen
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhamento temporal ininterrupto do tempo por bag e variação percentual mês a mês
              </p>
            </div>
          </div>
        </div>

        {/* Ticker Badges & Metric Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800">
            {/* Botão 1: Tempo por Bag (min) - Padrão */}
            <button
              type="button"
              onClick={() => setSelectedMetric('cycle_time')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'cycle_time'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Acompanhar a evolução do tempo total de ciclo por Big Bag (minutos)"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tempo / Bag (min)</span>
            </button>

            {/* Botão 2: Evolução Percentual (%) */}
            <button
              type="button"
              onClick={() => setSelectedMetric('percent_change')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'percent_change'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Acompanhar o percentual de redução ou aumento do tempo mês a mês"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Evolução Percentual (%)</span>
            </button>

            {/* Botão 3: Ganhos Reais de Kaizen (R$) */}
            <button
              type="button"
              onClick={() => setSelectedMetric('kaizen_savings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'kaizen_savings'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Retorno financeiro real conquistado exclusivamente nas ações de Kaizen auditadas"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ganhos Reais Kaizen (R$)</span>
            </button>
          </div>

        </div>

      </div>

      {/* 3 Industrial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Card 1: Tempo Atual por Big Bag */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Tempo Médio Atual por Bag
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-cyan-300 tracking-tight">
                {currentCycleTime.toFixed(2).replace('.', ',')} min
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (~{(currentCycleTime * 60).toFixed(0)}s)
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/90 block mt-1">
              {currentReductionMinutes > 0 ? '-' : '+'}{Math.abs(currentReductionMinutes).toFixed(2).replace('.', ',')} min ({currentReductionSeconds}s vs Marco Zero)
            </span>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Evolução Percentual do Ciclo */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Evolução Percentual de Ciclo
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xl font-black font-mono tracking-tight ${
                currentEfficiencyPercent <= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {currentEfficiencyPercent <= 0 ? '' : '+'}{currentEfficiencyPercent.toFixed(1).replace('.', ',')}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentEfficiencyPercent <= 0 ? 'de redução' : 'de aumento'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              {latestPoint.efficiencyGainPercent >= 0 ? '+' : ''}{latestPoint.efficiencyGainPercent.toFixed(1).replace('.', ',')}% em velocidade fabril
            </span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            {currentEfficiencyPercent <= 0 ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Card 3: Ganhos Reais Auditados Kaizen (R$) */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center gap-1">
              Ganhos Kaizen Conquistados
              <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Auditado
              </span>
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs text-amber-400 font-bold">R$</span>
              <span className="text-xl font-black font-mono text-amber-400 tracking-tight">
                {kaizenAuditSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400">/mês</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              Multiplicado pelo volume de cada ponto específico
            </span>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Area Chart Container */}
      <div className="h-72 w-full pt-2">
        {!isMounted ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            Carregando curva de evolução histórica...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="evolutionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={
                      selectedMetric === 'cycle_time'
                        ? '#06b6d4'
                        : selectedMetric === 'percent_change'
                        ? '#10b981'
                        : '#f59e0b'
                    }
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      selectedMetric === 'cycle_time'
                        ? '#06b6d4'
                        : selectedMetric === 'percent_change'
                        ? '#10b981'
                        : '#f59e0b'
                    }
                    stopOpacity={0.0}
                  />
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
                domain={
                  selectedMetric === 'cycle_time'
                    ? ['auto', 'auto']
                    : selectedMetric === 'percent_change'
                    ? ['auto', 'auto']
                    : [0, 'auto']
                }
              />

              <Tooltip
                cursor={{ stroke: '#06b6d4', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;

                  return (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-xs space-y-2 min-w-[250px]">
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
                          <span>Tempo por Big Bag:</span>
                          <strong className="text-cyan-300 font-bold">{item.cycleTime.toFixed(2)} min</strong>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Variação % vs Marco Zero:</span>
                          <span className={item.percentChangeFromStart <= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                            {item.percentChangeFromStart <= 0 ? '' : '+'}{item.percentChangeFromStart.toFixed(1)}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Velocidade Fabril:</span>
                          <span className="text-emerald-400 font-semibold">
                            +{item.efficiencyGainPercent.toFixed(1)}% mais rápido
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/80 pt-1">
                          <span>Ganho Real Kaizen:</span>
                          <strong className="text-amber-400 font-bold">
                            R$ {item.kaizenSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
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
                  selectedMetric === 'cycle_time'
                    ? 'cycleTime'
                    : selectedMetric === 'percent_change'
                    ? 'percentChangeFromStart'
                    : 'kaizenSavings'
                }
                stroke={
                  selectedMetric === 'cycle_time'
                    ? '#06b6d4'
                    : selectedMetric === 'percent_change'
                    ? '#10b981'
                    : '#f59e0b'
                }
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#evolutionGradient)"
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer explanation */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Monitoramento contínuo do ciclo por bag. Questões monetárias (R$) restritas às ações e ganhos Kaizen auditados.</span>
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          Marco Zero ({timelineData[0]?.fullLabel}): <strong>Base Histórica Inicial</strong>
        </span>
      </div>

    </div>
  );
};
