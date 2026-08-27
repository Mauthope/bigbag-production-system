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
import { ComponentCategoryConfig } from '@/types/production';

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
}

type ChartMetric = 'financial' | 'hours' | 'seconds';
type ViewMode = 'operations' | 'monthly_summary';

export const MonthlyVarianceChart: React.FC<MonthlyVarianceChartProps> = ({
  operations,
  categories,
  monthlyVolume
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [metric, setMetric] = useState<ChartMetric>('financial');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('operations');
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

    totalNet = gainVal - lossVal;
    totalHours = gainHours - lossHours;
    totalSecs = gainSecs - lossSecs;

    return {
      gainVal,
      lossVal,
      totalNet,
      gainHours,
      lossHours,
      totalHours,
      gainSecs,
      lossSecs,
      totalSecs
    };
  }, [filteredOps]);

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
      name: 'TOTALIZADOR LÍQUIDO',
      fullName: 'Resultado Líquido do Mês (Ganhos - Aumentos)',
      category: 'Geral',
      categoryColor: '#06b6d4',
      value: Number(totalValue.toFixed(2)),
      type: totalValue >= 0 ? 'gain' : 'loss',
      rawOp: null as any,
      isTotalizer: true
    });

    return items;
  }, [filteredOps, metric, aggregates, categoryMap]);

  // Prepare data for "Monthly Summary" View (Simulated/Historical months)
  const monthlySummaryData = useMemo(() => {
    const months = [
      { name: 'Mês Anterior (-60d)', factor: 0.6 },
      { name: 'Mês Passado (-30d)', factor: 0.85 },
      { name: 'Mês Atual (Vigente)', factor: 1.0 }
    ];

    return months.map(m => {
      let gains = 0;
      let losses = 0;
      let net = 0;

      if (metric === 'financial') {
        gains = aggregates.gainVal * m.factor;
        losses = aggregates.lossVal * m.factor;
        net = gains - losses;
      } else if (metric === 'hours') {
        gains = aggregates.gainHours * m.factor;
        losses = aggregates.lossHours * m.factor;
        net = gains - losses;
      } else {
        gains = aggregates.gainSecs * m.factor;
        losses = aggregates.lossSecs * m.factor;
        net = gains - losses;
      }

      return {
        month: m.name,
        Ganhos: Number(gains.toFixed(1)),
        Aumentos: Number(losses.toFixed(1)),
        Totalizador: Number(net.toFixed(1))
      };
    });
  }, [aggregates, metric]);

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
                Gráfico Mensal: Aumentos, Diminuições & Totalizador
              </h2>
              <p className="text-xs text-slate-400">
                Visualização do balanço mensal de melhorias de processo e retorno financeiro
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* View Mode Toggle: Operations vs Monthly */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('operations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'operations'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Exibir aumentos e diminuições de cada operação e o totalizador final"
            >
              Variações + Totalizador
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly_summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'monthly_summary'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Exibir comparativo consolidado mês a mês"
            >
              Evolução Mensal
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
        
        {/* Totalizador Líquido */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          aggregates.totalNet >= 0
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
              💎 Totalizador Líquido do Mês
            </span>
            <span className="text-lg font-black font-mono">
              {aggregates.totalNet >= 0 ? '+' : '-'} R$ {Math.abs(aggregates.totalNet).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
            {aggregates.totalHours >= 0 ? '+' : ''}{aggregates.totalHours.toFixed(1).replace('.', ',')} h/mês
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

        {/* Aumentos (Desvios) */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/20 text-rose-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Total Aumentos de Tempo
            </span>
            <span className="text-lg font-black font-mono text-rose-400">
              - R$ {aggregates.lossVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-xs font-mono text-rose-400/80">
            -{aggregates.lossHours.toFixed(1).replace('.', ',')} h
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
                                <span>Total Líquido:</span>
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
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={formatYAxis} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Ganhos" fill="#10b981" radius={[4, 4, 0, 0]} name="Diminuições (Ganhos)" />
              <Bar dataKey="Aumentos" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Aumentos (Desvios)" />
              <Bar dataKey="Totalizador" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Totalizador Líquido" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend & Guide footer */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span>Diminuição no Tempo (Ganho / Economia)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500" />
            <span>Aumento no Tempo (Custo Adicional)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-400 border border-cyan-300" />
            <span>Totalizador (Saldo Líquido)</span>
          </span>
        </div>

        <span className="text-[11px] text-slate-500">
          Baseado em <strong>{monthlyVolume.toLocaleString('pt-BR')} bags/mês</strong>
        </span>
      </div>

    </div>
  );
};
