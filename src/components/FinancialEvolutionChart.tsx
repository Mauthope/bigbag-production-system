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
  Calendar,
  Sparkles,
  Percent,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { MonthlyClosingRecord } from '@/types/production';

interface FinancialEvolutionChartProps {
  monthlyHistory: Record<string, MonthlyClosingRecord>;
  activeMonthKey: string;
  currentBagTimeMinutes: number; // Tempo atual do Big Bag (ex: ~12.0 min)
  marcoZeroBagTimeMinutes: number; // Tempo do Big Bag no Marco Zero (ex: ~12.0 min)
  netVariationMinutes: number; // Variação líquida em minutos vs Marco Zero
  percentVariationVsMarcoZero: number; // Variação % vs Marco Zero
  totalKaizenCompletedSavings?: number; // Ganhos Reais Auditados Kaizen (R$)
  errorMarginPercent?: number;
}

export type EvolutionMetric = 'percent_change' | 'cycle_time' | 'kaizen_savings';

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({
  monthlyHistory,
  activeMonthKey,
  currentBagTimeMinutes,
  marcoZeroBagTimeMinutes,
  netVariationMinutes,
  percentVariationVsMarcoZero,
  totalKaizenCompletedSavings = 0
}) => {
  const [isMounted, setIsMounted] = useState(false);
  // Padrão definido para Variação em relação ao Marco Zero (%)
  const [selectedMetric, setSelectedMetric] = useState<EvolutionMetric>('percent_change');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const baseBagTime = marcoZeroBagTimeMinutes > 0 ? marcoZeroBagTimeMinutes : 12.0;

  // Construção da linha do tempo contínua do Marco Zero até o mês ativo
  const timelineData = useMemo(() => {
    const keys = Object.keys(monthlyHistory).sort();
    if (!keys.includes(activeMonthKey)) {
      keys.push(activeMonthKey);
    }
    keys.sort();

    const marcoZeroKey = keys[0]; // Primeiro mês cadastrado é o Marco Zero (Agosto/2026)

    return keys.map(key => {
      const rec = monthlyHistory[key];
      const isMarcoZero = key === marcoZeroKey;
      const isCurrent = key === activeMonthKey;

      let cycleTime = baseBagTime;
      let percentVariation = 0;
      let variationMinutes = 0;
      let kaizenSavings = 0;

      if (isMarcoZero) {
        // Marco Zero é a referência absoluta de partida da fábrica (0% de variação)
        cycleTime = baseBagTime;
        percentVariation = 0;
        variationMinutes = 0;
        kaizenSavings = 0;
      } else if (isCurrent) {
        // Mês atual ativo: mede a variação em relação ao Marco Zero
        cycleTime = currentBagTimeMinutes > 0 ? currentBagTimeMinutes : baseBagTime;
        percentVariation = percentVariationVsMarcoZero;
        variationMinutes = netVariationMinutes;
        kaizenSavings = totalKaizenCompletedSavings;
      } else {
        // Mês histórico encerrado
        const historicalTime = rec?.netHours ? baseBagTime + (rec.netHours * 60) / (rec.volume || 20000) : baseBagTime;
        cycleTime = historicalTime;
        variationMinutes = cycleTime - baseBagTime;
        percentVariation = baseBagTime > 0 ? Number(((variationMinutes / baseBagTime) * 100).toFixed(1)) : 0;
        kaizenSavings = rec?.totalSavings ?? 0;
      }

      return {
        key,
        dateLabel: rec?.monthLabel ? rec.monthLabel.split('/')[0] : key,
        fullLabel: isMarcoZero ? `${rec?.monthLabel || key} (Marco Zero)` : (rec?.monthLabel || key),
        cycleTime: Number(cycleTime.toFixed(2)),
        percentVariation: Number(percentVariation.toFixed(1)),
        variationMinutes: Number(variationMinutes.toFixed(2)),
        kaizenSavings: Number(kaizenSavings.toFixed(2)),
        volume: rec?.volume ?? 20000,
        isMarcoZero,
        isCurrent
      };
    });
  }, [
    monthlyHistory,
    activeMonthKey,
    currentBagTimeMinutes,
    baseBagTime,
    netVariationMinutes,
    percentVariationVsMarcoZero,
    totalKaizenCompletedSavings
  ]);

  const formatYAxis = (val: number) => {
    if (selectedMetric === 'percent_change') {
      return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
    }
    if (selectedMetric === 'cycle_time') {
      return `${val.toFixed(1)}m`;
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
                  Variação vs Marco Zero
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhamento mês a mês da variação de tempo e produtividade em relação ao ponto de partida
              </p>
            </div>
          </div>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800">
            {/* Botão 1: Variação vs Marco Zero (%) - Padrão */}
            <button
              type="button"
              onClick={() => setSelectedMetric('percent_change')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'percent_change'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Acompanhar se o tempo aumentou ou diminuiu percentualmente em relação ao Marco Zero"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>% Variação vs Marco Zero</span>
            </button>

            {/* Botão 2: Tempo / Bag (min) */}
            <button
              type="button"
              onClick={() => setSelectedMetric('cycle_time')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'cycle_time'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Acompanhar o tempo de ciclo real por Big Bag (minutos)"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tempo / Bag (min)</span>
            </button>

            {/* Botão 3: Ganhos Reais Kaizen (R$) */}
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

      {/* 3 Summary Ticker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Card 1: Tempo Médio Atual por Bag */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Tempo Médio Atual por Bag
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-cyan-300 tracking-tight">
                {currentBagTimeMinutes.toFixed(2).replace('.', ',')} min
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (~{Math.round(currentBagTimeMinutes * 60)}s)
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/90 block mt-1">
              {netVariationMinutes > 0
                ? `+${netVariationMinutes.toFixed(2).replace('.', ',')} min (+${Math.round(netVariationMinutes * 60)}s vs Marco Zero)`
                : netVariationMinutes < 0
                ? `-${Math.abs(netVariationMinutes).toFixed(2).replace('.', ',')} min (-${Math.round(Math.abs(netVariationMinutes) * 60)}s vs Marco Zero)`
                : 'Em conformidade com o Marco Zero'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Variação vs Marco Zero */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Variação vs Marco Zero
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xl font-black font-mono tracking-tight ${
                percentVariationVsMarcoZero < 0
                  ? 'text-emerald-400'
                  : percentVariationVsMarcoZero > 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}>
                {percentVariationVsMarcoZero > 0 ? '+' : ''}{percentVariationVsMarcoZero.toFixed(1).replace('.', ',')}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {percentVariationVsMarcoZero < 0 ? 'tempo reduzido' : percentVariationVsMarcoZero > 0 ? 'tempo acrescido' : 'estável'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              {percentVariationVsMarcoZero < 0
                ? 'Melhoria contínua e ganho de velocidade'
                : percentVariationVsMarcoZero > 0
                ? 'Desvio detectado nas micro-etapas'
                : 'Ponto de partida oficial da fábrica'}
            </span>
          </div>
          <div className={`p-2 rounded-lg ${
            percentVariationVsMarcoZero < 0
              ? 'bg-emerald-500/10 text-emerald-400'
              : percentVariationVsMarcoZero > 0
              ? 'bg-rose-500/10 text-rose-400'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {percentVariationVsMarcoZero < 0 ? (
              <TrendingDown className="w-5 h-5" />
            ) : percentVariationVsMarcoZero > 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
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
                {totalKaizenCompletedSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            <AreaChart data={timelineData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="evolutionPercentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={
                      percentVariationVsMarcoZero < 0 ? '#10b981' : percentVariationVsMarcoZero > 0 ? '#f43f5e' : '#06b6d4'
                    }
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      percentVariationVsMarcoZero < 0 ? '#10b981' : percentVariationVsMarcoZero > 0 ? '#f43f5e' : '#06b6d4'
                    }
                    stopOpacity={0.0}
                  />
                </linearGradient>
                <linearGradient id="cycleTimeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="kaizenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
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
                  selectedMetric === 'percent_change'
                    ? [
                        (dataMin: number) => Math.min(-5, Math.floor(dataMin - 2)),
                        (dataMax: number) => Math.max(5, Math.ceil(dataMax + 2))
                      ]
                    : selectedMetric === 'cycle_time'
                    ? [
                        (dataMin: number) => Math.max(0, Number((dataMin - 1).toFixed(0))),
                        (dataMax: number) => Number((dataMax + 1).toFixed(0))
                      ]
                    : [0, 'auto']
                }
              />

              {/* Linha de Referência do Marco Zero */}
              {selectedMetric === 'percent_change' && (
                <ReferenceLine
                  y={0}
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: 'Marco Zero (0%)',
                    fill: '#94a3b8',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              )}

              {selectedMetric === 'cycle_time' && (
                <ReferenceLine
                  y={baseBagTime}
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: `Ref Marco Zero (${baseBagTime.toFixed(1)}m)`,
                    fill: '#06b6d4',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              )}

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
                        {item.isMarcoZero ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                            Marco Zero
                          </span>
                        ) : item.isCurrent ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                            Mês Vigente
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-1.5 font-mono">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Tempo por Big Bag:</span>
                          <strong className="text-cyan-300 font-bold">{item.cycleTime.toFixed(2)} min</strong>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Variação vs Marco Zero:</span>
                          <span className={`font-semibold ${
                            item.percentVariation < 0
                              ? 'text-emerald-400'
                              : item.percentVariation > 0
                              ? 'text-rose-400'
                              : 'text-slate-300'
                          }`}>
                            {item.percentVariation > 0 ? '+' : ''}{item.percentVariation.toFixed(1)}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Diferença no Ciclo:</span>
                          <span>
                            {item.variationMinutes > 0 ? '+' : ''}{item.variationMinutes.toFixed(2)} min/bag
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
                  selectedMetric === 'percent_change'
                    ? 'percentVariation'
                    : selectedMetric === 'cycle_time'
                    ? 'cycleTime'
                    : 'kaizenSavings'
                }
                stroke={
                  selectedMetric === 'percent_change'
                    ? percentVariationVsMarcoZero < 0 ? '#10b981' : percentVariationVsMarcoZero > 0 ? '#f43f5e' : '#06b6d4'
                    : selectedMetric === 'cycle_time'
                    ? '#06b6d4'
                    : '#f59e0b'
                }
                strokeWidth={3}
                fillOpacity={1}
                fill={
                  selectedMetric === 'percent_change'
                    ? 'url(#evolutionPercentGradient)'
                    : selectedMetric === 'cycle_time'
                    ? 'url(#cycleTimeGradient)'
                    : 'url(#kaizenGradient)'
                }
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
          <span>Linha de base referenciada no <strong>Marco Zero (Agosto/2026)</strong>. Acompanhamento ininterrupto mês a mês.</span>
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          Tempo Padrão Marco Zero: <strong>{baseBagTime.toFixed(2)} min/bag</strong>
        </span>
      </div>

    </div>
  );
};
