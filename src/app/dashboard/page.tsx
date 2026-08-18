'use client';

import React, { useState, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Gauge,
  Clock,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  ArrowUpRight,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { ExportImportModal } from '@/components/ExportImportModal';

export default function DashboardPage() {
  const { metrics, componentStats, orders, categoriesConfig } = useProduction();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // OP Efficiency Data for Chart
  const opEfficiencyData = useMemo(() => {
    return orders
      .filter(o => o.actualTimeTotal && o.actualTimeTotal > 0)
      .map(o => {
        const std = o.standardTimePerBag * o.producedQuantity;
        const actual = o.actualTimeTotal || 0;
        const eff = actual > 0 ? (std / actual) * 100 : 100;
        return {
          opNumber: o.opNumber,
          client: o.client,
          efficiency: Number(eff.toFixed(1)),
          stdMinutes: Number(std.toFixed(1)),
          actualMinutes: Number(actual.toFixed(1)),
          deviation: Number((actual - std).toFixed(1)),
          status: o.status
        };
      });
  }, [orders]);

  // Component Breakdown for Time Distribution Pie Chart
  const componentDistributionData = useMemo(() => {
    return componentStats
      .filter(c => c.standardMinutes > 0)
      .map(c => ({
        name: c.title,
        value: Number(c.standardMinutes.toFixed(1)),
        color: c.colorHex,
        efficiency: Number(c.efficiency.toFixed(1))
      }));
  }, [componentStats]);

  // Bottleneck ranking: which components have lower efficiency or highest deviation
  const bottleneckRanking = useMemo(() => {
    return [...componentStats]
      .filter(c => c.standardMinutes > 0)
      .sort((a, b) => a.efficiency - b.efficiency);
  }, [componentStats]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Dashboard de Eficiência & Gargalos
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/40">
              Análise em Tempo Real
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Indicadores de produtividade, tempos previstos vs. reais por Ordem de Produção e por componente.
          </p>
        </div>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-colors shadow-sm self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          <span>Exportar Relatórios</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Global Efficiency */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Eficiência Global
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  metrics.globalEfficiency >= 100
                    ? 'text-emerald-400'
                    : metrics.globalEfficiency >= 85
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {metrics.globalEfficiency.toFixed(1)}%
              </span>
              <span className="text-xs font-medium text-slate-400">
                meta: 100%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Calculado sobre todas as OPs apontadas
            </span>
          </div>
        </div>

        {/* Planned vs Real Hours */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Horas Previstas vs Reais
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block">Previsto</span>
                <span className="text-xl font-bold font-mono text-cyan-300">
                  {(metrics.globalStandardMinutes / 60).toFixed(1)}h
                </span>
              </div>
              <div className="text-slate-600 font-bold">/</div>
              <div>
                <span className="text-[10px] text-slate-500 block">Real</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {(metrics.globalActualMinutes / 60).toFixed(1)}h
                </span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {(metrics.globalActualMinutes - metrics.globalStandardMinutes <= 0)
                ? `Economia de ${Math.abs((metrics.globalActualMinutes - metrics.globalStandardMinutes) / 60).toFixed(1)}h`
                : `Desvio de +${((metrics.globalActualMinutes - metrics.globalStandardMinutes) / 60).toFixed(1)}h`}
            </span>
          </div>
        </div>

        {/* Bags Volume */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Volume de Big Bags
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {metrics.totalProducedUnits}
              </span>
              <span className="text-xs font-medium text-slate-400">
                / {metrics.totalPlannedUnits} planejados
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                style={{
                  width: `${metrics.totalPlannedUnits > 0 ? (metrics.totalProducedUnits / metrics.totalPlannedUnits) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Orders Status Summary */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Ordens de Produção
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Concluídas</span>
              <span className="text-xl font-extrabold font-mono text-emerald-400">
                {metrics.completedOrders}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Em Produção</span>
              <span className="text-xl font-extrabold font-mono text-amber-400">
                {metrics.inProgressOrders}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Planejadas</span>
              <span className="text-xl font-extrabold font-mono text-slate-400">
                {metrics.plannedOrders}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Efficiency by OP */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Eficiência por Ordem de Produção (OP)
              </h3>
              <p className="text-xs text-slate-400">
                Porcentagem de eficiência calculada (Meta: 100%)
              </p>
            </div>
          </div>

          {opEfficiencyData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
              Nenhum apontamento com tempo real registrado ainda.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={opEfficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="opNumber" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 'dataMax + 20']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: any) => [`${value}%`, 'Eficiência']}
                    labelFormatter={(label) => `OP: ${label}`}
                  />
                  <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Meta (100%)', fill: '#10b981', fontSize: 10, position: 'top' }} />
                  <Bar dataKey="efficiency" radius={[6, 6, 0, 0]}>
                    {opEfficiencyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.efficiency >= 100 ? '#10b981' : entry.efficiency >= 85 ? '#f59e0b' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Planned vs Actual Times by OP */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Tempo Previsto vs. Tempo Real (Minutos)
              </h3>
              <p className="text-xs text-slate-400">
                Comparativo de minutos planejados vs. executados por OP
              </p>
            </div>
          </div>

          {opEfficiencyData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
              Nenhum apontamento com tempo real registrado ainda.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={opEfficiencyData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="opNumber" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [`${value} min`, name === 'stdMinutes' ? 'Previsto' : 'Realizado']}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-slate-300">
                        {value === 'stdMinutes' ? 'Tempo Previsto' : 'Tempo Real'}
                      </span>
                    )}
                  />
                  <Bar dataKey="stdMinutes" fill="#06b6d4" name="stdMinutes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualMinutes" fill="#10b981" name="actualMinutes" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Component Analysis & Bottlenecks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Time Distribution by Component (Pie Chart) */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col">
          <div className="mb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              Distribuição de Tempo por Componente
            </h3>
            <p className="text-xs text-slate-400">
              Proporção de tempo gasto em cada etapa de costura
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={componentDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {componentDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} min`, 'Tempo Acumulado']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottleneck Analysis & Component Efficiency Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Mapeamento de Gargalos por Componente
                </h3>
                <p className="text-xs text-slate-400">
                  Ranking de eficiência por etapa de montagem do Big Bag
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                    <th className="py-2.5 px-3">Componente</th>
                    <th className="py-2.5 px-3 text-right">Tempo Previsto</th>
                    <th className="py-2.5 px-3 text-right">Tempo Realizado</th>
                    <th className="py-2.5 px-3 text-center">Eficiência</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {bottleneckRanking.map(item => (
                    <tr key={item.category} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span className="text-slate-200">{item.title}</span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {item.standardMinutes.toFixed(1)} min
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {item.actualMinutes.toFixed(1)} min
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span
                          className={
                            item.efficiency >= 100
                              ? 'text-emerald-400'
                              : item.efficiency >= 85
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
                          {item.efficiency.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.efficiency >= 100
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : item.efficiency >= 85
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {item.efficiency >= 100
                            ? 'Normal'
                            : item.efficiency >= 85
                            ? 'Atenção'
                            : 'Gargalo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Dica: Atualize os tempos padrão no menu <strong>Tempos & Parâmetros</strong> para calibrar as metas.</span>
          </div>

        </div>

      </div>

      {/* Export Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

    </div>
  );
}
