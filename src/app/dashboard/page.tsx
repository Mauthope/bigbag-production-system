'use client';

import React, { useState, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { ComponentCategoryKey, OrderStatus } from '@/types/production';
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
  FileSpreadsheet,
  Search,
  RotateCcw,
  Download,
  Sliders,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { ExportImportModal } from '@/components/ExportImportModal';

export default function DashboardPage() {
  const { operations, orders, categoriesConfig } = useProduction();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filters State
  const [selectedOpId, setSelectedOpId] = useState<string | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategoryKey | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedOpId('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSearchTerm('');
  };

  const hasActiveFilters =
    selectedOpId !== 'all' ||
    selectedCategory !== 'all' ||
    selectedStatus !== 'all' ||
    searchTerm.trim().length > 0;

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchOp = selectedOpId === 'all' || o.id === selectedOpId;
      const matchStatus = selectedStatus === 'all' || o.status === selectedStatus;
      const matchSearch =
        searchTerm === '' ||
        o.opNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.modelDescription.toLowerCase().includes(searchTerm.toLowerCase());
      return matchOp && matchStatus && matchSearch;
    });
  }, [orders, selectedOpId, selectedStatus, searchTerm]);

  // Matrix Breakdown: Array of { op, category, config, stdTimePerBag, totalStdMin, actualMin, efficiency, varianceMin, count }
  const matrixBreakdown = useMemo(() => {
    const rows: Array<{
      id: string;
      opId: string;
      opNumber: string;
      client: string;
      modelDescription: string;
      status: OrderStatus;
      categoryKey: ComponentCategoryKey;
      categoryTitle: string;
      categoryColor: string;
      producedQuantity: number;
      targetQuantity: number;
      stdTimePerBag: number;
      totalStdMinutes: number;
      actualMinutes: number;
      actualTimePerBag: number;
      efficiency: number;
      varianceMinutes: number;
    }> = [];

    filteredOrders.forEach(order => {
      const categories = Object.keys(categoriesConfig) as ComponentCategoryKey[];

      categories.forEach(catKey => {
        // Only include if category matches filter
        if (selectedCategory !== 'all' && catKey !== selectedCategory) {
          return;
        }

        // Get operations for this category in this order
        const catOps = operations.filter(
          op => op.category === catKey && order.selectedOperationIds.includes(op.id)
        );

        const stdTimePerBag = catOps.reduce((sum, op) => sum + op.time, 0);
        if (stdTimePerBag === 0) return; // Category not used in this OP

        const countUnits = order.producedQuantity > 0 ? order.producedQuantity : order.targetQuantity;
        const totalStdMinutes = stdTimePerBag * countUnits;

        // Actual time for this component if recorded, otherwise proportional or zero
        let actualMinutes = 0;
        if (order.componentTimes && order.componentTimes[catKey] !== undefined) {
          actualMinutes = order.componentTimes[catKey];
        } else if (order.actualTimeTotal && order.actualTimeTotal > 0 && order.totalStandardTime > 0) {
          // Proportion based on standard share if total was recorded without component breakdown
          actualMinutes = (totalStdMinutes / order.totalStandardTime) * order.actualTimeTotal;
        } else {
          actualMinutes = totalStdMinutes; // Default fallback to planned if not pointed
        }

        const actualTimePerBag = countUnits > 0 ? actualMinutes / countUnits : 0;
        const efficiency = actualMinutes > 0 ? (totalStdMinutes / actualMinutes) * 100 : 100;
        const varianceMinutes = actualMinutes - totalStdMinutes;

        rows.push({
          id: `${order.id}-${catKey}`,
          opId: order.id,
          opNumber: order.opNumber,
          client: order.client,
          modelDescription: order.modelDescription,
          status: order.status,
          categoryKey: catKey,
          categoryTitle: categoriesConfig[catKey].title,
          categoryColor: categoriesConfig[catKey].colorHex,
          producedQuantity: order.producedQuantity,
          targetQuantity: order.targetQuantity,
          stdTimePerBag: Number(stdTimePerBag.toFixed(2)),
          totalStdMinutes: Number(totalStdMinutes.toFixed(1)),
          actualMinutes: Number(actualMinutes.toFixed(1)),
          actualTimePerBag: Number(actualTimePerBag.toFixed(2)),
          efficiency: Number(efficiency.toFixed(1)),
          varianceMinutes: Number(varianceMinutes.toFixed(1))
        });
      });
    });

    return rows;
  }, [filteredOrders, operations, categoriesConfig, selectedCategory]);

  // Aggregated KPIs for the current filter selection
  const kpis = useMemo(() => {
    let totalStdMinutes = 0;
    let totalActualMinutes = 0;
    let totalProducedUnits = 0;
    let totalPlannedUnits = 0;

    matrixBreakdown.forEach(row => {
      totalStdMinutes += row.totalStdMinutes;
      totalActualMinutes += row.actualMinutes;
    });

    filteredOrders.forEach(o => {
      totalProducedUnits += o.producedQuantity;
      totalPlannedUnits += o.targetQuantity;
    });

    const efficiency =
      totalActualMinutes > 0 ? (totalStdMinutes / totalActualMinutes) * 100 : 100;
    const varianceMinutes = totalActualMinutes - totalStdMinutes;
    const varianceHours = varianceMinutes / 60;
    const isGain = varianceMinutes < -0.1;

    return {
      totalStdMinutes: Number(totalStdMinutes.toFixed(1)),
      totalStdHours: Number((totalStdMinutes / 60).toFixed(1)),
      totalActualMinutes: Number(totalActualMinutes.toFixed(1)),
      totalActualHours: Number((totalActualMinutes / 60).toFixed(1)),
      efficiency: Number(efficiency.toFixed(1)),
      varianceMinutes: Number(varianceMinutes.toFixed(1)),
      varianceHours: Number(varianceHours.toFixed(1)),
      isGain,
      totalProducedUnits,
      totalPlannedUnits,
      ordersCount: filteredOrders.length,
      rowsCount: matrixBreakdown.length
    };
  }, [matrixBreakdown, filteredOrders]);

  // Chart 1: Previsto vs Real por Componente (Aggregated across filtered data)
  const componentComparisonChartData = useMemo(() => {
    const catMap: Record<string, { title: string; color: string; stdMin: number; actualMin: number; count: number }> = {};

    matrixBreakdown.forEach(row => {
      if (!catMap[row.categoryKey]) {
        catMap[row.categoryKey] = {
          title: row.categoryTitle,
          color: row.categoryColor,
          stdMin: 0,
          actualMin: 0,
          count: 0
        };
      }
      catMap[row.categoryKey].stdMin += row.totalStdMinutes;
      catMap[row.categoryKey].actualMin += row.actualMinutes;
      catMap[row.categoryKey].count += row.producedQuantity;
    });

    return Object.keys(catMap).map(key => {
      const c = catMap[key];
      const eff = c.actualMin > 0 ? (c.stdMin / c.actualMin) * 100 : 100;
      return {
        key,
        name: c.title,
        color: c.color,
        stdMinutes: Number(c.stdMin.toFixed(1)),
        actualMinutes: Number(c.actualMin.toFixed(1)),
        efficiency: Number(eff.toFixed(1)),
        variance: Number((c.actualMin - c.stdMin).toFixed(1))
      };
    });
  }, [matrixBreakdown]);

  // Chart 2: Eficiência por OP (Aggregated per OP in current filter)
  const opEfficiencyChartData = useMemo(() => {
    const opMap: Record<string, { opNumber: string; client: string; stdMin: number; actualMin: number; status: OrderStatus }> = {};

    matrixBreakdown.forEach(row => {
      if (!opMap[row.opId]) {
        opMap[row.opId] = {
          opNumber: row.opNumber,
          client: row.client,
          stdMin: 0,
          actualMin: 0,
          status: row.status
        };
      }
      opMap[row.opId].stdMin += row.totalStdMinutes;
      opMap[row.opId].actualMin += row.actualMinutes;
    });

    return Object.keys(opMap).map(opId => {
      const o = opMap[opId];
      const eff = o.actualMin > 0 ? (o.stdMin / o.actualMin) * 100 : 100;
      return {
        opNumber: o.opNumber,
        client: o.client,
        efficiency: Number(eff.toFixed(1)),
        stdMinutes: Number(o.stdMin.toFixed(1)),
        actualMinutes: Number(o.actualMin.toFixed(1)),
        status: o.status
      };
    });
  }, [matrixBreakdown]);

  // Chart 3: Participação no Tempo Total por Componente (Pie)
  const timeDistributionPieData = useMemo(() => {
    const total = kpis.totalActualMinutes || 1;
    return componentComparisonChartData.map(c => ({
      name: c.name,
      value: c.actualMinutes,
      color: c.color,
      sharePct: Number(((c.actualMinutes / total) * 100).toFixed(1)),
      efficiency: c.efficiency
    }));
  }, [componentComparisonChartData, kpis.totalActualMinutes]);

  // Export Matrix Table to CSV
  const handleExportMatrixCSV = () => {
    if (matrixBreakdown.length === 0) return;

    const headers = [
      'OP',
      'Cliente',
      'Modelo',
      'Status',
      'Componente',
      'Qtd Produzida',
      'Tempo Padrão Unit (min)',
      'Tempo Padrão Total (min)',
      'Tempo Real Total (min)',
      'Eficiência (%)',
      'Desvio (min)'
    ];

    const rows = matrixBreakdown.map(r => [
      r.opNumber,
      `"${r.client}"`,
      `"${r.modelDescription}"`,
      r.status,
      `"${r.categoryTitle}"`,
      r.producedQuantity,
      r.stdTimePerBag.toFixed(2),
      r.totalStdMinutes.toFixed(2),
      r.actualMinutes.toFixed(2),
      `${r.efficiency.toFixed(1)}%`,
      r.varianceMinutes.toFixed(2)
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `relatorio_tempos_componentes_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Dashboard de Eficiência & Tempos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/40">
              Por OP & Componente
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Análise em tempo real de produtividade, tempos padrão vs. realizados e identificação de gargalos por etapa de costura.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportMatrixCSV}
            disabled={matrixBreakdown.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-emerald-400 border border-emerald-900/50 text-xs font-semibold transition-colors shadow-sm"
            title="Exportar dados filtrados em CSV para Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Backup</span>
          </button>
        </div>
      </div>

      {/* Interactive Dual-Filter Console (OP + Component + Status) */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Filter 1: OP Selector Dropdown */}
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              Filtrar por Ordem de Produção (OP):
            </label>
            <select
              value={selectedOpId}
              onChange={e => setSelectedOpId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="all">Todas as Ordens de Produção ({orders.length} OPs cadastradas)</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.opNumber} — {o.client} ({o.modelDescription}) [{o.producedQuantity}/{o.targetQuantity} un]
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Status Filter */}
          <div className="w-full lg:w-48">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Status da OP:
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as OrderStatus | 'all')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todos os Status</option>
              <option value="concluida">Concluída</option>
              <option value="em_producao">Em Produção</option>
              <option value="planejada">Planejada</option>
            </select>
          </div>

          {/* Filter 3: Search text */}
          <div className="w-full lg:w-64">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Busca Rápida:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, modelo..."
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <div className="pt-6">
              <button
                onClick={handleClearFilters}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            </div>
          )}

        </div>

        {/* Filter 4: Component Category Pills */}
        <div className="pt-3 border-t border-slate-800/80">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            Filtrar por Componente:
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Todos os Componentes
            </button>
            {Object.keys(categoriesConfig).map(catKey => {
              const key = catKey as ComponentCategoryKey;
              const config = categoriesConfig[key];
              const isSelected = selectedCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'border text-white shadow-md scale-[1.02]'
                      : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${config.colorHex}25` : undefined,
                    borderColor: isSelected ? config.colorHex : undefined,
                    color: isSelected ? config.colorHex : undefined
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.colorHex }}
                  />
                  <span>{config.title}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Dynamic KPI Cards in function of Current Filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Tempo Previsto */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tempo Previsto (Padrão)</span>
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300 mt-2">
            {kpis.totalStdMinutes} <span className="text-xs font-bold text-slate-400">min</span>
          </div>
          <span className="text-xs text-slate-500 font-mono mt-1 block">
            {kpis.totalStdHours} horas de costura planejadas
          </span>
        </div>

        {/* Tempo Realizado */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tempo Real Apontado</span>
            <div className="p-2 rounded-xl bg-teal-950/60 border border-teal-800/40 text-teal-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-2">
            {kpis.totalActualMinutes} <span className="text-xs font-bold text-slate-400">min</span>
          </div>
          <span className="text-xs text-slate-500 font-mono mt-1 block">
            {kpis.totalActualHours} horas de costura executadas
          </span>
        </div>

        {/* Eficiência Geral */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Eficiência Geral</span>
            <div className={`p-2 rounded-xl border ${
              kpis.efficiency >= 100
                ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400'
                : kpis.efficiency >= 90
                ? 'bg-amber-950/60 border-amber-800/40 text-amber-400'
                : 'bg-rose-950/60 border-rose-800/40 text-rose-400'
            }`}>
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono mt-2 ${
            kpis.efficiency >= 100
              ? 'text-emerald-400'
              : kpis.efficiency >= 90
              ? 'text-amber-400'
              : 'text-rose-400'
          }`}>
            {kpis.efficiency}%
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {kpis.efficiency >= 100
              ? '✓ Acima da meta de 100%'
              : kpis.efficiency >= 90
              ? 'Atenção: leve desvio de ritmo'
              : 'Alerta: abaixo do tempo padrão'}
          </span>
        </div>

        {/* Desvio / Saldo de Tempo */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Desvio de Tempo</span>
            <div className={`p-2 rounded-xl border ${
              kpis.isGain
                ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400'
                : 'bg-rose-950/60 border-rose-800/40 text-rose-400'
            }`}>
              {kpis.isGain ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono mt-2 ${
            kpis.isGain ? 'text-emerald-400' : kpis.varianceMinutes === 0 ? 'text-slate-300' : 'text-rose-400'
          }`}>
            {kpis.varianceMinutes <= 0 ? '' : '+'}{kpis.varianceMinutes} <span className="text-xs font-bold text-slate-400">min</span>
          </div>
          <span className="text-xs text-slate-500 font-mono mt-1 block">
            {kpis.isGain
              ? `Economia de ${Math.abs(kpis.varianceMinutes)} min (${Math.abs(kpis.varianceHours)}h)`
              : kpis.varianceMinutes === 0
              ? 'Dentro do tempo exato'
              : `Tempo excedente de ${kpis.varianceMinutes} min`}
          </span>
        </div>

      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Chart 1: Previsto vs Real por Componente (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Tempo Previsto vs. Real por Componente
              </h3>
              <p className="text-xs text-slate-400">
                Comparativo de minutos de costura nos componentes selecionados
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <div className="w-2.5 h-2.5 rounded bg-cyan-400" /> Previsto (min)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <div className="w-2.5 h-2.5 rounded bg-emerald-400" /> Real Apontado (min)
              </span>
            </div>
          </div>

          {componentComparisonChartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-10 text-xs text-slate-500">
              Nenhum dado encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={componentComparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any, name: any) => [`${val} min`, name === 'stdMinutes' ? 'Previsto' : 'Real']}
                  />
                  <Bar dataKey="stdMinutes" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Previsto" />
                  <Bar dataKey="actualMinutes" fill="#10b981" radius={[4, 4, 0, 0]} name="Realizado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Eficiência (%) por OP (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                Eficiência (%) por Ordem de Produção
              </h3>
              <p className="text-xs text-slate-400">
                Atingimento de meta (100%) nas OPs filtradas
              </p>
            </div>
          </div>

          {opEfficiencyChartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-10 text-xs text-slate-500">
              Nenhuma OP com apontamentos.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={opEfficiencyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="opNumber" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 150]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Eficiência']}
                    labelFormatter={(label, p) => `${label} — ${p?.[0]?.payload?.client || ''}`}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: 'Meta (100%)', fill: '#f59e0b', fontSize: 10, position: 'top' }}
                  />
                  <Bar dataKey="efficiency" radius={[6, 6, 0, 0]}>
                    {opEfficiencyChartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.efficiency >= 100 ? '#10b981' : entry.efficiency >= 90 ? '#f59e0b' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Detailed Analytical Matrix Table (OP x Component) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Matriz Analítica Detalhada: OP &times; Tempos por Componente
            </h3>
            <p className="text-xs text-slate-400">
              Detalhamento de tempo padrão unitário, tempo total, tempo realizado e eficiência por etapa
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {matrixBreakdown.length} registros cruzados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">OP & Lote</th>
                <th className="py-3.5 px-4">Cliente & Modelo</th>
                <th className="py-3.5 px-4">Componente</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Tempo Unit (Prev)</th>
                <th className="py-3.5 px-4 text-right">Total Previsto</th>
                <th className="py-3.5 px-4 text-right">Total Realizado</th>
                <th className="py-3.5 px-4 text-center">Eficiência (%)</th>
                <th className="py-3.5 px-4 text-right">Desvio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {matrixBreakdown.map(row => {
                return (
                  <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* OP */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-white block">
                        {row.opNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {row.producedQuantity}/{row.targetQuantity} bags
                      </span>
                    </td>

                    {/* Client & Model */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200 block truncate max-w-xs" title={row.client}>
                        {row.client}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-xs" title={row.modelDescription}>
                        {row.modelDescription}
                      </span>
                    </td>

                    {/* Component */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.categoryColor }}
                        />
                        <span className="font-semibold text-slate-200">
                          {row.categoryTitle}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        row.status === 'concluida'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                          : row.status === 'em_producao'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {row.status === 'concluida' ? 'Concluída' : row.status === 'em_producao' ? 'Em Produção' : 'Planejada'}
                      </span>
                    </td>

                    {/* Unit Standard Time */}
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {row.stdTimePerBag.toFixed(2)} min
                    </td>

                    {/* Total Standard Time */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300">
                      {row.totalStdMinutes.toFixed(1)} min
                    </td>

                    {/* Total Actual Time */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {row.actualMinutes.toFixed(1)} min
                    </td>

                    {/* Efficiency % */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                        row.efficiency >= 100
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                          : row.efficiency >= 90
                          ? 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                          : 'bg-rose-950/70 text-rose-300 border-rose-800/60'
                      }`}>
                        {row.efficiency}%
                      </span>
                    </td>

                    {/* Variance */}
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={row.varianceMinutes <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {row.varianceMinutes <= 0 ? '' : '+'}{row.varianceMinutes.toFixed(1)} min
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

    </div>
  );
}
