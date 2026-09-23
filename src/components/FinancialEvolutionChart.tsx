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
  AlertTriangle,
  Filter,
  Layers
} from 'lucide-react';
import { MonthlyClosingRecord } from '@/types/production';
import { THEORETICAL_BASELINE_MINUTES, THEORETICAL_SECTOR_BASELINES } from '@/data/defaultData';

interface FinancialEvolutionChartProps {
  monthlyHistory: Record<string, MonthlyClosingRecord>;
  activeMonthKey: string;
  currentCatalogTimeMinutes?: number; // Soma total de todas as micro-operações (ex: 151.85 min)
  currentBagTimeMinutes?: number; // compatibilidade retroativa
  marcoZeroCatalogTimeMinutes?: number; // Soma de todas as micro-operações no Marco Zero (ex: 151.85 min)
  marcoZeroBagTimeMinutes?: number; // compatibilidade retroativa
  theoreticalBaselineMinutes?: number; // 104.22 min (Calculadora Kanban)
  firstRealMeasurementTimeMinutes?: number; // 230.08 min (1ª Cronoanálise)
  netVariationMinutes: number; // Variação líquida em minutos vs Marco Zero
  percentVariationVsMarcoZero: number; // Variação % vs Marco Zero
  totalKaizenCompletedSavings?: number; // Ganhos Reais Auditados Kaizen (R$)
  errorMarginPercent?: number;
  operationsCount?: number; // Total de operações cadastradas (ex: 118)
  operations?: any[]; // Lista de operações para filtro setorial
  categories?: any[]; // Categorias para filtro setorial
}

export type EvolutionMetric = 'percent_change' | 'cycle_time' | 'kaizen_savings';

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({
  monthlyHistory,
  activeMonthKey,
  currentCatalogTimeMinutes,
  currentBagTimeMinutes,
  marcoZeroCatalogTimeMinutes,
  marcoZeroBagTimeMinutes,
  theoreticalBaselineMinutes = THEORETICAL_BASELINE_MINUTES,
  firstRealMeasurementTimeMinutes,
  netVariationMinutes,
  percentVariationVsMarcoZero,
  totalKaizenCompletedSavings = 0,
  operationsCount = 118,
  operations = [],
  categories = []
}) => {
  const [isMounted, setIsMounted] = useState(false);
  // Padrão definido para Tempo Total Catálogo (min) para visualizar a curva oscilando
  const [selectedMetric, setSelectedMetric] = useState<EvolutionMetric>('cycle_time');
  const [selectedSector, setSelectedSector] = useState<string>('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeCatalogTime = currentCatalogTimeMinutes ?? currentBagTimeMinutes ?? 151.85;

  // Filtragem e cálculos dinâmicos por Setor / Componente
  const filteredOps = useMemo(() => {
    if (!operations || operations.length === 0) return [];
    if (selectedSector === 'all') return operations;
    return operations.filter((op: any) => op.category === selectedSector);
  }, [operations, selectedSector]);

  const activeSectorOpsCount = selectedSector === 'all' ? operationsCount : filteredOps.length;

  const currentSectorCategory = useMemo(() => {
    return categories.find((c: any) => c.key === selectedSector);
  }, [categories, selectedSector]);

  const sectorName = selectedSector === 'all'
    ? 'Todos os Componentes'
    : (currentSectorCategory?.title || selectedSector);

  // 1. Tempo Teórico de Engenharia do Setor
  const sectorTheoretical = useMemo(() => {
    if (selectedSector === 'all') return theoreticalBaselineMinutes;
    return THEORETICAL_SECTOR_BASELINES[selectedSector] ?? 0;
  }, [selectedSector, theoreticalBaselineMinutes]);

  // 2. Tempo da 1ª Medição Real Apurada do Setor
  const sectorFirstReal = useMemo(() => {
    if (!filteredOps.length) {
      return firstRealMeasurementTimeMinutes ?? (marcoZeroCatalogTimeMinutes || 230.08);
    }
    const sum = filteredOps.reduce((acc: number, op: any) => {
      const first = (op.history && op.history.length > 0) ? op.history[0].time : op.baselineTime;
      return acc + (first !== undefined && first !== null ? Number(first) : Number(op.time));
    }, 0);
    return Number(sum.toFixed(2));
  }, [filteredOps, firstRealMeasurementTimeMinutes, marcoZeroCatalogTimeMinutes]);

  // 3. Tempo Atual do Setor
  const sectorCurrent = useMemo(() => {
    if (!filteredOps.length) return activeCatalogTime;
    const sum = filteredOps.reduce((acc: number, op: any) => acc + Number(op.currentTime || op.time || 0), 0);
    return Number(sum.toFixed(2));
  }, [filteredOps, activeCatalogTime]);

  // Cálculos de desvio e redução
  const sectorInitialRealDelta = sectorFirstReal - sectorTheoretical;
  const sectorInitialRealPct = sectorTheoretical > 0
    ? Number(((sectorInitialRealDelta / sectorTheoretical) * 100).toFixed(1))
    : 0;

  const sectorCurrentDeltaVsTeorico = sectorCurrent - sectorTheoretical;
  const sectorCurrentPctVsTeorico = sectorTheoretical > 0
    ? Number(((sectorCurrentDeltaVsTeorico / sectorTheoretical) * 100).toFixed(1))
    : 0;

  const sectorKaizenReductionMin = sectorFirstReal - sectorCurrent;
  const sectorKaizenReductionPct = sectorFirstReal > 0
    ? Number(((sectorKaizenReductionMin / sectorFirstReal) * 100).toFixed(1))
    : 0;

  // Construção da linha do tempo contínua:
  // Ponto 1: Marco Zero Teórico (104,22 min ou subtotal do setor)
  // Ponto 2: 1ª Cronoanálise Real (~230,08 min ou subtotal do setor)
  // Ponto 3: Mês Vigente Pós-Kaizen (151,56 min ou subtotal do setor)
  const timelineData = useMemo(() => {
    const points = [];

    // Ponto 1: Marco Zero Teórico (Calculadora Kanban Pré-Cronoanálise)
    points.push({
      key: 'marco-zero-teorico',
      dateLabel: 'Teórico',
      fullLabel: `Marco Zero Teórico (${sectorTheoretical.toFixed(2)}m)`,
      cycleTime: sectorTheoretical,
      percentVariation: 0,
      variationMinutes: 0,
      kaizenSavings: 0,
      volume: 20000,
      isTheoretical: true,
      isFirstReal: false,
      isCurrent: false
    });

    // Ponto 2: 1ª Cronoanálise Real em Chão de Fábrica
    points.push({
      key: 'cronoanalise-inicial',
      dateLabel: '1ª Medição',
      fullLabel: `1ª Cronoanálise Real (${sectorFirstReal.toFixed(2)}m)`,
      cycleTime: sectorFirstReal,
      percentVariation: sectorInitialRealPct,
      variationMinutes: Number(sectorInitialRealDelta.toFixed(2)),
      kaizenSavings: 0,
      volume: 20000,
      isTheoretical: false,
      isFirstReal: true,
      isCurrent: false
    });

    // Ponto 3: Mês Vigente Pós-Kaizen (Setembro/2026)
    const activeLabel = monthlyHistory[activeMonthKey]?.monthLabel || 'Setembro/2026';
    points.push({
      key: activeMonthKey,
      dateLabel: activeLabel.split('/')[0],
      fullLabel: `${activeLabel} (Atual: ${sectorCurrent.toFixed(2)}m)`,
      cycleTime: sectorCurrent,
      percentVariation: sectorCurrentPctVsTeorico,
      variationMinutes: Number(sectorCurrentDeltaVsTeorico.toFixed(2)),
      kaizenSavings: selectedSector === 'all' ? Number(totalKaizenCompletedSavings.toFixed(2)) : 0,
      volume: monthlyHistory[activeMonthKey]?.volume ?? 20000,
      isTheoretical: false,
      isFirstReal: false,
      isCurrent: true
    });

    return points;
  }, [
    sectorTheoretical,
    sectorFirstReal,
    sectorCurrent,
    sectorInitialRealDelta,
    sectorInitialRealPct,
    sectorCurrentDeltaVsTeorico,
    sectorCurrentPctVsTeorico,
    activeMonthKey,
    monthlyHistory,
    selectedSector,
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
                  Partida: {sectorTheoretical.toFixed(2)}m (Teórico)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhe a trajetória de tempo: do Marco Zero Teórico (104m) até a 1ª cronoanálise e as reduções Kaizen
              </p>
            </div>
          </div>
        </div>

        {/* Metric & Sector Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Filtro Setorial (Setor / Componente) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Setor:</span>
            <select
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Todos os Componentes (Geral)</option>
              {categories.map((cat: any) => (
                <option key={cat.key} value={cat.key} className="bg-slate-900 text-white">
                  {cat.title} ({THEORETICAL_SECTOR_BASELINES[cat.key] ? `${THEORETICAL_SECTOR_BASELINES[cat.key].toFixed(2)}m` : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800">
            {/* Botão 1: Tempo Total Catálogo (min) - Padrão para ver oscilação */}
            <button
              type="button"
              onClick={() => setSelectedMetric('cycle_time')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'cycle_time'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Acompanhar a evolução em minutos partindo de 104m, subindo na 1ª medição e descendo com o Kaizen"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tempo em Minutos</span>
            </button>

            {/* Botão 2: Variação vs Teórico (%) */}
            <button
              type="button"
              onClick={() => setSelectedMetric('percent_change')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'percent_change'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Acompanhar a variação percentual (%) em relação ao Marco Zero Teórico"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>% Variação vs Teórico</span>
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

      {/* 3 Summary Ticker Cards for Selected Sector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Card 1: Tempo Atual do Setor */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Tempo Atual ({sectorName})
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-cyan-300 tracking-tight">
                {sectorCurrent.toFixed(2).replace('.', ',')} min
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({activeSectorOpsCount} ops)
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/90 block mt-1">
              Ref. Teórica: {sectorTheoretical.toFixed(2).replace('.', ',')}m ({sectorCurrentDeltaVsTeorico >= 0 ? '+' : ''}{sectorCurrentDeltaVsTeorico.toFixed(2).replace('.', ',')}m)
            </span>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Teórico vs 1ª Medição Real */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Teórico vs 1ª Medição Real
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-amber-300 tracking-tight">
                +{sectorInitialRealPct.toFixed(1).replace('.', ',')}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                desvio inicial
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              Estimativa {sectorTheoretical.toFixed(2).replace('.', ',')}m → Real {sectorFirstReal.toFixed(2).replace('.', ',')}m
            </span>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Ganho de Eficiência Kaizen */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Ganho Kaizen Conquistado
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                -{sectorKaizenReductionPct.toFixed(1).replace('.', ',')}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                tempo reduzido
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/90 block mt-1">
              De {sectorFirstReal.toFixed(2).replace('.', ',')}m para {sectorCurrent.toFixed(2).replace('.', ',')}m (-{sectorKaizenReductionMin.toFixed(2).replace('.', ',')} min)
            </span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingDown className="w-5 h-5" />
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
                  y={sectorTheoretical}
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: `Ref. Teórica (${sectorTheoretical.toFixed(1)}m)`,
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
                          <span>Tempo Total ({operationsCount} operações):</span>
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
                          <span>Diferença no Catálogo:</span>
                          <span>
                            {item.variationMinutes > 0 ? '+' : ''}{item.variationMinutes.toFixed(2)} min
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
          Ref. Teórica ({activeSectorOpsCount} ops): <strong>{sectorTheoretical.toFixed(2)} min</strong> | 1ª Cronoanálise Real: <strong>{sectorFirstReal.toFixed(2)} min</strong>
        </span>
      </div>

    </div>
  );
};
