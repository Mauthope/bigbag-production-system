'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Legend
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Layers,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Clock,
  Boxes,
  HelpCircle,
  Filter
} from 'lucide-react';
import { ComponentCategoryConfig, MonthlyClosingRecord } from '@/types/production';

export interface EnrichedOperationItem {
  id: string;
  name: string;
  category: string;
  baselineTime: number;
  currentTime: number;
  deltaMinutes: number;
  timeSavedMinutes: number;
  percentChange: number;
  hourlyRate: number;
  monthlyHoursImpacted: number;
  monthlyFinancialImpact: number;
  annualFinancialImpact: number;
  status: 'gain' | 'loss' | 'neutral';
  updatedAt?: string;
}

interface MonthlyVarianceChartProps {
  operations: EnrichedOperationItem[];
  categories: ComponentCategoryConfig[];
  monthlyVolume: number;
  monthlyHistory?: Record<string, MonthlyClosingRecord>;
  activeMonthKey?: string;
  errorMarginPercent?: number;
}

type ChartMetric = 'financial' | 'hours' | 'seconds';
type ViewMode = 'operations' | 'monthly_summary';

export const MonthlyVarianceChart: React.FC<MonthlyVarianceChartProps> = ({
  operations,
  categories,
  monthlyVolume,
  monthlyHistory,
  activeMonthKey,
  errorMarginPercent = 5
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [metric, setMetric] = useState<ChartMetric>('financial');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('monthly_summary');
  const [showOnlyChanged, setShowOnlyChanged] = useState<boolean>(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.key] = cat;
      return acc;
    }, {} as Record<string, ComponentCategoryConfig>);
  }, [categories]);

  // Filter operations based on selected sector
  const filteredOps = useMemo(() => {
    return operations.filter(op => {
      const matchSector = selectedSector === 'all' || op.category === selectedSector;
      const matchChanged = showOnlyChanged ? op.status !== 'neutral' : true;
      return matchSector && matchChanged;
    });
  }, [operations, selectedSector, showOnlyChanged]);

  // Aggregate totals
  const aggregates = useMemo(() => {
    let gainVal = 0;
    let lossVal = 0;
    let totalNet = 0;

    let gainHours = 0;
    let lossHours = 0;
    let totalHours = 0;

    let gainSecs = 0;
    let lossSecs = 0;
    let totalSecs = 0;

    filteredOps.forEach(op => {
      if (op.status === 'gain') {
        gainVal += op.monthlyFinancialImpact;
        gainHours += op.monthlyHoursImpacted;
        gainSecs += Math.abs(op.deltaMinutes) * 60;
      } else if (op.status === 'loss') {
        lossVal += Math.abs(op.monthlyFinancialImpact);
        lossHours += Math.abs(op.monthlyHoursImpacted);
        lossSecs += Math.abs(op.deltaMinutes) * 60;
      }
    });

    // Business rule: Gains are computed exclusively from time reductions
    // Increases represent Kaizen improvement alerts and are NOT subtracted from gains
    const grossGains = gainVal;
    const errorDeduction = grossGains * (errorMarginPercent / 100);
    totalNet = grossGains - errorDeduction;

    const grossHours = gainHours;
    const errorHoursDeduction = grossHours * (errorMarginPercent / 100);
    totalHours = grossHours - errorHoursDeduction;

    const grossSecs = gainSecs;
    const errorSecsDeduction = grossSecs * (errorMarginPercent / 100);
    totalSecs = grossSecs - errorSecsDeduction;

    return {
      gainVal,
      lossVal,
      grossNet: grossGains,
      errorDeduction,
      errorMarginPercent,
      totalNet,
      gainHours,
      lossHours,
      grossHours,
      totalHours,
      gainSecs,
      lossSecs,
      grossSecs,
      totalSecs
    };
  }, [filteredOps, errorMarginPercent]);

  // Prepare data for "Operations Detail + Totalizer" View
  const operationsChartData = useMemo(() => {
    // Sort so biggest gains come first, then losses
    const sorted = [...filteredOps].sort((a, b) => b.monthlyFinancialImpact - a.monthlyFinancialImpact);

    const items = sorted.map(op => {
      let value = 0;
      if (metric === 'financial') {
        value = op.monthlyFinancialImpact; // Positive for gain, negative for loss
      } else if (metric === 'hours') {
        value = op.monthlyHoursImpacted; // Positive for hours saved, negative for added
      } else {
        value = -op.deltaMinutes * 60; // Seconds saved per bag (positive for gain)
      }

      return {
        id: op.id,
        name: op.name.length > 20 ? `${op.name.slice(0, 18)}...` : op.name,
        fullName: op.name,
        category: categoryMap[op.category]?.title || op.category,
        categoryColor: categoryMap[op.category]?.colorHex || '#06b6d4',
        value: Number(value.toFixed(2)),
        type: op.status,
        rawOp: op,
        isTotalizer: false
      };
    });

    // Append TOTALIZER bar at the end
    let totalValue = 0;
    if (metric === 'financial') {
      totalValue = aggregates.totalNet;
    } else if (metric === 'hours') {
      totalValue = aggregates.totalHours;
    } else {
      totalValue = aggregates.totalSecs;
    }

    items.push({
      id: 'totalizer',
      name: 'GANHOS CONSOLIDADOS',
      fullName: 'Ganhos Consolidados do Mês (Diminuições de Tempo c/ -5% de margem)',
      category: 'Geral',
      categoryColor: '#10b981',
      value: Number(totalValue.toFixed(2)),
      type: 'gain',
      rawOp: null as any,
      isTotalizer: true
    });

    return items;
  }, [filteredOps, metric, aggregates, categoryMap]);

  // Prepare data for "Monthly Summary" View (Single clean bar per month: Ganhos Consolidados)
  const monthlySummaryData = useMemo(() => {
    if (monthlyHistory && Object.keys(monthlyHistory).length > 0) {
      const sortedKeys = Object.keys(monthlyHistory).sort();
      return sortedKeys.map(key => {
        const rec = monthlyHistory[key];
        const isCurrent = key === activeMonthKey;

        let val = isCurrent ? aggregates.totalNet : rec.netSavings;
        let grossVal = isCurrent ? aggregates.gainVal : rec.totalSavings;
        let lossVal = isCurrent ? aggregates.lossVal : rec.totalLosses;
        let hoursVal = isCurrent ? aggregates.totalHours : rec.hoursSaved;
        let volume = (isCurrent ? monthlyVolume : rec.volume) || 1;

        if (metric === 'hours') {
          val = isCurrent ? aggregates.totalHours : rec.hoursSaved;
        } else if (metric === 'seconds') {
          val = isCurrent ? aggregates.gainSecs : ((rec.hoursSaved * 3600) / volume);
        }

        return {
          month: rec.monthLabel ? rec.monthLabel.split('/')[0] : key,
          fullMonth: rec.monthLabel || key,
          valor: Number(val.toFixed(1)),
          grossGains: Number(grossVal.toFixed(2)),
          kaizenAlerts: Number(lossVal.toFixed(2)),
          hoursSaved: Number(hoursVal.toFixed(1)),
          volume,
          isCurrent
        };
      });
    }

    // Fallback if no history exists yet
    return [
      {
        month: 'Mês Atual',
        fullMonth: 'Mês Atual',
        valor: Number(aggregates.totalNet.toFixed(1)),
        grossGains: Number(aggregates.gainVal.toFixed(2)),
        kaizenAlerts: Number(aggregates.lossVal.toFixed(2)),
        hoursSaved: Number(aggregates.totalHours.toFixed(1)),
        volume: monthlyVolume,
        isCurrent: true
      }
    ];
  }, [monthlyHistory, activeMonthKey, aggregates, metric, monthlyVolume]);

  const averageMonthlyGain = useMemo(() => {
    if (!monthlySummaryData.length) return 0;
    const sum = monthlySummaryData.reduce((acc, item) => acc + item.valor, 0);
    return Number((sum / monthlySummaryData.length).toFixed(1));
  }, [monthlySummaryData]);

  const formatYAxis = (val: number) => {
    if (metric === 'financial') {
      if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
      return `R$ ${val.toFixed(0)}`;
    }
    if (metric === 'hours') {
      return `${val.toFixed(0)}h`;
    }
    return `${val.toFixed(0)}s`;
  };

  const getMetricLabel = () => {
    if (metric === 'financial') return 'Impacto Financeiro (R$)';
    if (metric === 'hours') return 'Horas-Homem Impactadas (h)';
    return 'Tempo de Ciclo (Segundos por Bag)';
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-5">
      
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Comprovação de Ganhos Mês a Mês
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono font-bold">
                  Economia Real (-5% margem)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Histórico consolidado de retorno financeiro e horas poupadas a cada período de fábrica
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* View Mode Toggle: Monthly Summary vs Operations */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('monthly_summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'monthly_summary'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Exibir comparativo consolidado mês a mês (Ganhos vs Perdas de cada período)"
            >
              Mês a Mês (Histórico)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('operations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'operations'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Exibir aumentos e diminuições detalhados de cada operação no mês selecionado"
            >
              Detalhamento de Operações
            </button>
          </div>

          {/* Metric Selector (R$ vs Horas vs Segundos) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800">
            <button
              type="button"
              onClick={() => setMetric('financial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                metric === 'financial'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>R$ Mensal</span>
            </button>
            <button
              type="button"
              onClick={() => setMetric('hours')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                metric === 'hours'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Horas Poupadas</span>
            </button>
            <button
              type="button"
              onClick={() => setMetric('seconds')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                metric === 'seconds'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Segundos / Bag</span>
            </button>
          </div>

          {/* Sector Filter */}
          <div className="relative">
            <select
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="pl-3 pr-8 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Todos os Setores</option>
              {categories.map(cat => (
                <option key={cat.key} value={cat.key}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Summary KPI Pills of the Chart */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Ganhos Consolidados */}
        <div className="p-3 rounded-xl border flex items-center justify-between bg-emerald-950/30 border-emerald-500/30 text-emerald-400">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                💎 Ganhos Consolidados do Mês
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                -{aggregates.errorMarginPercent}% erro
              </span>
            </div>
            <span className="text-lg font-black font-mono">
              + R$ {aggregates.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Ganhos Brutos: R$ {aggregates.gainVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
            +{aggregates.totalHours.toFixed(1).replace('.', ',')} h/mês
          </span>
        </div>

        {/* Diminuições (Ganhos) */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 text-emerald-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Total Diminuições (Ganhos de Tempo)
            </span>
            <span className="text-lg font-black font-mono text-emerald-400">
              + R$ {aggregates.gainVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-400/80">
            +{aggregates.gainHours.toFixed(1).replace('.', ',')} h
          </span>
        </div>

        {/* Aumentos (Oportunidades de Melhoria Kaizen) */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/20 text-rose-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Aumentos de Tempo (Alerta Kaizen)
            </span>
            <span className="text-lg font-black font-mono text-rose-400">
              ~ R$ {aggregates.lossVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              ⚠️ Oportunidade Kaizen (não deduz dos ganhos)
            </span>
          </div>
          <span className="text-xs font-mono text-rose-400/80">
            +{aggregates.lossHours.toFixed(1).replace('.', ',')} h
          </span>
        </div>

      </div>

      {/* Recharts Area */}
      <div className="h-80 w-full pt-2">
        {!isMounted ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            Carregando gráfico...
          </div>
        ) : viewMode === 'operations' ? (
          operationsChartData.length <= 1 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-600" />
              <span>Nenhuma alteração registrada nos filtros selecionados para este mês.</span>
              <span className="text-[11px] text-slate-500">
                Altere ou cronometre uma operação para ver a variação neste gráfico.
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={operationsChartData}
                margin={{ top: 20, right: 20, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatYAxis}
                  tickLine={false}
                />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    const isTotal = item.isTotalizer;
                    const raw = item.rawOp;

                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-xs space-y-1.5 min-w-[220px]">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                          <span className={`font-bold ${isTotal ? 'text-cyan-300' : 'text-white'}`}>
                            {item.fullName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {item.category}
                          </span>
                        </div>

                        <div className="space-y-1 font-mono pt-0.5">
                          {isTotal ? (
                            <>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Resultado Bruto:</span>
                                <span className={aggregates.grossNet >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                                  {aggregates.grossNet >= 0 ? '+' : '-'} R$ {Math.abs(aggregates.grossNet).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                                <span>Margem Erro ({aggregates.errorMarginPercent}%):</span>
                                <span className="text-amber-400">
                                  -{aggregates.errorMarginPercent}% (-R$ {Math.abs(aggregates.errorDeduction).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-slate-200 border-t border-slate-800 pt-1">
                                <span className="font-bold">Total Final:</span>
                                <strong className={aggregates.totalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  {aggregates.totalNet >= 0 ? '+' : '-'} R$ {Math.abs(aggregates.totalNet).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </strong>
                              </div>
                              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                                <span>Horas Líquidas:</span>
                                <span className="text-cyan-300">{aggregates.totalHours.toFixed(1)} h/mês</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Ponto Partida:</span>
                                <span>{raw?.baselineTime.toFixed(2)} min</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Nova Medição:</span>
                                <span>{raw?.currentTime.toFixed(2)} min</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Variação:</span>
                                <span className={raw?.status === 'gain' ? 'text-emerald-400' : 'text-rose-400'}>
                                  {raw?.deltaMinutes < 0 ? '-' : '+'}{Math.abs(raw?.deltaMinutes * 60).toFixed(0)}s ({raw?.percentChange.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/80 pt-1">
                                <span>Impacto Mês:</span>
                                <strong className={raw?.monthlyFinancialImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  {raw?.monthlyFinancialImpact >= 0 ? '+' : '-'} R$ {Math.abs(raw?.monthlyFinancialImpact).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </strong>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {operationsChartData.map((entry, index) => {
                    if (entry.isTotalizer) {
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.value >= 0 ? '#06b6d4' : '#e11d48'}
                          stroke={entry.value >= 0 ? '#22d3ee' : '#f43f5e'}
                          strokeWidth={2}
                        />
                      );
                    }
                    // Diminuição de tempo = Ganho (Verde Esmeralda)
                    if (entry.type === 'gain') {
                      return <Cell key={`cell-${index}`} fill="#10b981" />;
                    }
                    // Aumento de tempo = Desvio (Vermelho Rosa)
                    return <Cell key={`cell-${index}`} fill="#f43f5e" />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlySummaryData}
              margin={{ top: 25, right: 20, left: 10, bottom: 15 }}
            >
              <defs>
                <linearGradient id="barGainsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.65} />
                </linearGradient>
                <linearGradient id="activeMonthBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0e7490" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={formatYAxis} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="p-3.5 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl text-xs space-y-2 min-w-[220px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="font-extrabold text-white text-sm">{item.fullMonth}</span>
                        {item.isCurrent ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold font-mono">
                            Mês Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">Fechado</span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-slate-200">
                        <span className="font-medium">Economia Conquistada:</span>
                        <strong className="text-emerald-400 font-mono text-sm">
                          {metric === 'financial'
                            ? `+ R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : metric === 'hours'
                            ? `+ ${item.valor.toFixed(1).replace('.', ',')} h`
                            : `+ ${item.valor.toFixed(0)} s/bag`}
                        </strong>
                      </div>

                      {metric === 'financial' && item.grossGains > 0 && (
                        <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                          <span>Ganhos Brutos (-5% erro):</span>
                          <span>R$ {item.grossGains.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {item.kaizenAlerts > 0 && metric === 'financial' && (
                        <div className="flex items-center justify-between text-rose-400 text-[11px] font-mono pt-1.5 border-t border-slate-800/80">
                          <span>⚠️ Oportunidade Kaizen:</span>
                          <span className="font-semibold">~ R$ {item.kaizenAlerts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-500 text-[10px] pt-1.5 border-t border-slate-800 font-mono">
                        <span>Volume Produzido:</span>
                        <span className="text-slate-300 font-bold">{item.volume?.toLocaleString('pt-BR')} bags</span>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={averageMonthlyGain}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                strokeOpacity={0.8}
                label={{
                  value: `Média: ${metric === 'financial' ? `R$ ${(averageMonthlyGain / 1000).toFixed(1)}k` : `${averageMonthlyGain.toFixed(1)}h`}`,
                  fill: '#22d3ee',
                  fontSize: 10,
                  position: 'top'
                }}
              />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {monthlySummaryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isCurrent ? 'url(#activeMonthBarGradient)' : 'url(#barGainsGradient)'}
                    stroke={entry.isCurrent ? '#22d3ee' : '#34d399'}
                    strokeWidth={entry.isCurrent ? 2 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend & Guide footer */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span>Ganhos Consolidados (Meses Históricos Fechados)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-400 border border-cyan-300" />
            <span>Mês Vigente em Andamento</span>
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300/80">
            <span className="w-4 h-0.5 border-t border-dashed border-cyan-400" />
            <span>Linha de Média Mensal</span>
          </span>
        </div>

        <span className="text-[11px] text-slate-500">
          Baseado em <strong>{monthlyVolume.toLocaleString('pt-BR')} bags/mês</strong>
        </span>
      </div>

    </div>
  );
};
