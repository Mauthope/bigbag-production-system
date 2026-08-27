'use client';

import React, { useState, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Boxes,
  Users,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Unlock,
  Plus
} from 'lucide-react';
import { SectorCostModal } from '@/components/SectorCostModal';
import { NewMonthModal } from '@/components/NewMonthModal';
import { MonthlyVarianceChart } from '@/components/MonthlyVarianceChart';
import { FinancialEvolutionChart } from '@/components/FinancialEvolutionChart';
import { ComponentCategoryKey } from '@/types/production';

export default function IndicatorsPage() {
  const {
    operations,
    categories,
    financialConfig,
    updateFinancialConfig,
    updateOperationBaseline,
    updateOperationCustomVolume,
    updateOperationTime,
    changeActiveMonth,
    saveMonthlyClosing
  } = useProduction();

  const [isSectorCostModalOpen, setIsSectorCostModalOpen] = useState(false);
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'changed' | 'all' | 'gain' | 'loss' | 'neutral'>('changed');
  const [editingBaselineId, setEditingBaselineId] = useState<string | null>(null);
  const [tempBaselineValue, setTempBaselineValue] = useState<string>('');
  const [editingVolumeId, setEditingVolumeId] = useState<string | null>(null);
  const [tempVolumeValue, setTempVolumeValue] = useState<string>('');

  const activeMonthKey = financialConfig?.activeMonthKey || '2026-08';
  const monthlyHistory = financialConfig?.monthlyHistory || {};
  const activeMonthRecord = monthlyHistory[activeMonthKey];
  const isMonthClosed = activeMonthRecord?.isClosed ?? false;

  const monthlyVolume = activeMonthRecord?.volume ?? (financialConfig?.monthlyVolume ?? 20000);
  const defaultHourlyRate = financialConfig?.defaultHourlyRate ?? 28.5;
  const sectorHourlyRates = financialConfig?.sectorHourlyRates ?? {};
  const errorMarginPercent = financialConfig?.errorMarginPercent ?? 5;

  // Category Lookup Map
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.key] = cat;
      return acc;
    }, {} as Record<string, typeof categories[0]>);
  }, [categories]);

  // Operations enriched with comparison and financial calculation
  const enrichedOperations = useMemo(() => {
    return operations.map(op => {
      // Ponto de Partida do Mês: Sempre a última medição anterior (Ciclo Kaizen Contínuo)
      let baselineTime = op.time;
      if (op.previousTime !== undefined) {
        baselineTime = op.previousTime;
      } else if (op.history && op.history.length > 1) {
        baselineTime = op.history[op.history.length - 2].time;
      } else if (op.initialTime !== undefined) {
        baselineTime = op.initialTime;
      }

      const currentTime = op.time;
      const deltaMinutes = currentTime - baselineTime; // Positive = took longer (Perda), Negative = saved time (Ganho)
      const timeSavedMinutes = baselineTime - currentTime; // Positive = economy, Negative = added time
      const percentChange = baselineTime > 0 ? ((currentTime - baselineTime) / baselineTime) * 100 : 0;

      // Hourly Rate for this operation's sector
      const hourlyRate = sectorHourlyRates[op.category] !== undefined
        ? sectorHourlyRates[op.category]
        : defaultHourlyRate;

      // Volume specifically applied to this operation (or default monthly volume)
      const effectiveVolume = op.customVolume !== undefined && op.customVolume > 0
        ? op.customVolume
        : monthlyVolume;
      const isCustomVolume = op.customVolume !== undefined && op.customVolume > 0;

      // Hours Saved / Impacted in the Month
      // If time decreased (delta < 0), positive hours saved (Ganho)
      // If time increased (delta > 0), negative hours lost (Perda)
      const monthlyHoursImpacted = (timeSavedMinutes * effectiveVolume) / 60;

      // Monthly & Annual Financial Impact in R$
      // Positive = Financial Savings (Ganho de Economia), Negative = Added Cost (Perda / Custo Adicional)
      const monthlyFinancialImpact = monthlyHoursImpacted * hourlyRate;
      const annualFinancialImpact = monthlyFinancialImpact * 12;

      let status: 'gain' | 'loss' | 'neutral' = 'neutral';
      if (deltaMinutes < -0.001) status = 'gain';
      else if (deltaMinutes > 0.001) status = 'loss';

      return {
        ...op,
        effectiveVolume,
        isCustomVolume,
        baselineTime,
        currentTime,
        deltaMinutes,
        timeSavedMinutes,
        percentChange,
        hourlyRate,
        monthlyHoursImpacted,
        monthlyFinancialImpact,
        annualFinancialImpact,
        status
      };
    });
  }, [operations, monthlyVolume, defaultHourlyRate, sectorHourlyRates]);

  // Filtered operations
  const filteredOperations = useMemo(() => {
    return enrichedOperations.filter(op => {
      const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || op.category === selectedCategory;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'changed' && op.status !== 'neutral') ||
        (statusFilter === 'gain' && op.status === 'gain') ||
        (statusFilter === 'loss' && op.status === 'loss') ||
        (statusFilter === 'neutral' && op.status === 'neutral');

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [enrichedOperations, searchTerm, selectedCategory, statusFilter]);

  // Aggregate KPI Metrics
  const metrics = useMemo(() => {
    let totalMonthlySavings = 0;
    let totalMonthlyHoursSaved = 0;
    let totalTimeSavedPerBag = 0;
    let gainCount = 0;
    let lossCount = 0;
    let neutralCount = 0;

    const sectorBreakdown: Record<string, { name: string; color: string; savings: number; hours: number; count: number }> = {};

    enrichedOperations.forEach(op => {
      totalMonthlySavings += op.monthlyFinancialImpact;
      totalMonthlyHoursSaved += op.monthlyHoursImpacted;
      totalTimeSavedPerBag += op.timeSavedMinutes;

      if (op.status === 'gain') gainCount++;
      else if (op.status === 'loss') lossCount++;
      else neutralCount++;

      // Sector aggregation
      if (!sectorBreakdown[op.category]) {
        const cat = categoryMap[op.category];
        sectorBreakdown[op.category] = {
          name: cat?.title || op.category,
          color: cat?.colorHex || '#06b6d4',
          savings: 0,
          hours: 0,
          count: 0
        };
      }
      sectorBreakdown[op.category].savings += op.monthlyFinancialImpact;
      sectorBreakdown[op.category].hours += op.monthlyHoursImpacted;
      if (op.status !== 'neutral') sectorBreakdown[op.category].count++;
    });

    // 5% Error margin / Industrial dispersion deduction applied to final outcome
    const grossMonthlySavings = totalMonthlySavings;
    const errorMarginAmount = grossMonthlySavings * (errorMarginPercent / 100);
    const finalMonthlySavings = grossMonthlySavings - errorMarginAmount;
    const finalAnnualProjectedSavings = finalMonthlySavings * 12;

    const grossHoursSaved = totalMonthlyHoursSaved;
    const errorHoursAmount = grossHoursSaved * (errorMarginPercent / 100);
    const finalMonthlyHoursSaved = grossHoursSaved - errorHoursAmount;

    // Equivalent full-time operators freed up (assuming 176h/month = 22 days * 8h)
    const equivalentOperatorsFreed = finalMonthlyHoursSaved / (22 * 8.5);

    const sortedSectors = Object.values(sectorBreakdown)
      .filter(s => s.savings !== 0 || s.hours !== 0)
      .sort((a, b) => b.savings - a.savings);

    return {
      grossMonthlySavings,
      errorMarginPercent,
      errorMarginAmount,
      totalMonthlySavings: finalMonthlySavings, // Resultado final com dedução de 5% de margem de erro
      annualProjectedSavings: finalAnnualProjectedSavings,
      grossHoursSaved,
      totalMonthlyHoursSaved: finalMonthlyHoursSaved,
      totalTimeSavedPerBag,
      gainCount,
      lossCount,
      neutralCount,
      equivalentOperatorsFreed,
      sortedSectors
    };
  }, [enrichedOperations, categoryMap, errorMarginPercent]);

  // Overall cycle time calculations for continuous timeline
  const { totalActiveCycleTime, totalBaselineCycleTime } = useMemo(() => {
    let activeTotal = 0;
    let baselineTotal = 0;
    enrichedOperations.forEach(op => {
      activeTotal += op.currentTime;
      baselineTotal += op.initialTime !== undefined ? op.initialTime : op.baselineTime;
    });
    return {
      totalActiveCycleTime: activeTotal,
      totalBaselineCycleTime: baselineTotal
    };
  }, [enrichedOperations]);

  // Handlers for parameters
  const handleVolumeChange = (val: string) => {
    const num = parseInt(val, 10);
    updateFinancialConfig({ monthlyVolume: isNaN(num) || num < 0 ? 0 : num });
  };

  const handleRateChange = (val: string) => {
    const num = parseFloat(val.replace(',', '.'));
    updateFinancialConfig({ defaultHourlyRate: isNaN(num) || num < 0 ? 0 : num });
  };

  const handleErrorMarginChange = (val: string) => {
    const num = parseFloat(val.replace(',', '.'));
    updateFinancialConfig({ errorMarginPercent: isNaN(num) || num < 0 ? 0 : num });
  };

  // Inline baseline edit handler
  const startEditingBaseline = (opId: string, currentBaseline: number) => {
    setEditingBaselineId(opId);
    setTempBaselineValue(currentBaseline.toFixed(2));
  };

  // Inline specific volume edit handlers
  const startEditingVolume = (opId: string, currentVol: number) => {
    setEditingVolumeId(opId);
    setTempVolumeValue(currentVol.toString());
  };

  const saveEditedVolume = async (opId: string) => {
    const num = parseInt(tempVolumeValue, 10);
    if (!isNaN(num) && num > 0) {
      await updateOperationCustomVolume(opId, num);
    } else {
      await updateOperationCustomVolume(opId, undefined);
    }
    setEditingVolumeId(null);
  };

  const resetVolumeToTotal = async (opId: string) => {
    await updateOperationCustomVolume(opId, undefined);
    setEditingVolumeId(null);
  };

  const saveEditedBaseline = async (opId: string) => {
    const num = parseFloat(tempBaselineValue.replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      await updateOperationBaseline(opId, undefined, num);
    }
    setEditingBaselineId(null);
  };

  // Advance Kaizen: make current measurement the new baseline
  const handleAdvanceBaseline = async (opId: string, currentTime: number) => {
    await updateOperationBaseline(opId, undefined, currentTime);
  };

  const handleToggleCloseMonth = async () => {
    await saveMonthlyClosing(activeMonthKey, {
      volume: monthlyVolume,
      defaultHourlyRate: defaultHourlyRate,
      totalSavings: metrics.totalMonthlySavings > 0 ? metrics.totalMonthlySavings : 0,
      totalLosses: metrics.totalMonthlySavings < 0 ? Math.abs(metrics.totalMonthlySavings) : 0,
      netSavings: metrics.totalMonthlySavings,
      hoursSaved: metrics.totalMonthlyHoursSaved > 0 ? metrics.totalMonthlyHoursSaved : 0,
      hoursLost: metrics.totalMonthlyHoursSaved < 0 ? Math.abs(metrics.totalMonthlyHoursSaved) : 0,
      netHours: metrics.totalMonthlyHoursSaved,
      isClosed: !isMonthClosed
    });
  };

  // Available months list
  const availableMonths = useMemo(() => {
    const keys = Object.keys(monthlyHistory);
    if (!keys.includes(activeMonthKey)) {
      keys.push(activeMonthKey);
    }
    return keys.sort();
  }, [monthlyHistory, activeMonthKey]);

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Indicador de Ganhos de Tempo & Impacto Financeiro
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Monitoramento de <strong>Retorno sobre Melhoria (ROI Industrial)</strong>. Compara a medição anterior com a medição atual de cada micro-etapa para quantificar horas poupadas e impacto financeiro real (\(R\$\)).
          </p>
        </div>

        {/* Action Button: Custom Rates by Sector */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsSectorCostModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Custos R$/h por Setor</span>
          </button>
        </div>
      </div>

      {/* Month Selector & Monthly Closing Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950/90 border border-cyan-500/25 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Mês de Referência:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={activeMonthKey}
              onChange={e => changeActiveMonth(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-inner font-mono"
            >
              {availableMonths.map(key => {
                const rec = monthlyHistory[key];
                const label = rec?.monthLabel || key;
                const closedTag = rec?.isClosed ? ' [Fechado]' : ' [Em Aberto]';
                return (
                  <option key={key} value={key}>
                    {label} {closedTag}
                  </option>
                );
              })}
            </select>

            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold font-mono border flex items-center gap-1 ${
              isMonthClosed
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
            }`}>
              {isMonthClosed ? <Lock className="w-3 h-3 text-cyan-400" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
              <span>{isMonthClosed ? 'Mês Consolidado / Fechado' : 'Mês Ativo em Aberto'}</span>
            </span>
          </div>
        </div>

        {/* Month Actions (New Month + Close/Reopen Month) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleCloseMonth}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isMonthClosed
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
            }`}
            title={isMonthClosed ? 'Reabrir mês para novas alterações' : 'Consolidar e congelar o resultado deste mês'}
          >
            {isMonthClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isMonthClosed ? 'Reabrir Mês' : 'Consolidar / Fechar Mês'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewMonthModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-500/50 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Iniciar um novo mês com nova quantidade prevista de bags"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Iniciar Novo Mês</span>
          </button>
        </div>

      </div>

      {/* Simulation Inputs Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Input 1: Monthly Bags Quantity */}
          <div className="flex items-center gap-2.5 bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800">
            <Boxes className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Volume de {activeMonthRecord?.monthLabel || activeMonthKey}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={monthlyVolume}
                  onChange={e => handleVolumeChange(e.target.value)}
                  className="w-24 bg-transparent text-sm font-bold text-white focus:outline-none font-mono"
                />
                <span className="text-xs text-slate-400 font-semibold">bags/mês</span>
              </div>
            </div>
          </div>

          {/* Input 2: Default Hourly Rate */}
          <div className="flex items-center gap-2.5 bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800">
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Custo Médio Hora-Homem
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-emerald-400">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={defaultHourlyRate}
                  onChange={e => handleRateChange(e.target.value)}
                  className="w-20 bg-transparent text-sm font-bold text-emerald-300 focus:outline-none font-mono"
                />
                <span className="text-xs text-slate-400 font-semibold">/ hora</span>
              </div>
            </div>
          </div>

          {/* Input 3: Margem de Erro Técnica (%) */}
          <div className="flex items-center gap-2.5 bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800">
            <span className="text-amber-400 font-bold text-xs">±%</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
                Margem de Erro
                <span className="text-[9px] text-amber-400/80 font-mono">(5%)</span>
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={errorMarginPercent}
                  onChange={e => handleErrorMarginChange(e.target.value)}
                  className="w-14 bg-transparent text-sm font-bold text-amber-300 focus:outline-none font-mono"
                />
                <span className="text-xs text-slate-400 font-semibold">% dedução</span>
              </div>
            </div>
          </div>

        </div>

        {/* Informative Note: Monthly calculation always uses last measurement */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
          <span>Apuração mensal baseada na <strong>Última Medição Anterior</strong></span>
        </div>

      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* KPI 1: Impacto Financeiro Líquido Mensal */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                Resultado Financeiro Final
              </span>
              <span className="text-[10px] text-amber-400 font-semibold">
                (Ajustado c/ -{metrics.errorMarginPercent}% margem de erro)
              </span>
            </div>
            <div className={`p-2 rounded-xl border ${
              metrics.totalMonthlySavings >= 0
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {metrics.totalMonthlySavings >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-slate-400">R$</span>
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                metrics.totalMonthlySavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {Math.abs(metrics.totalMonthlySavings).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-slate-400">/mês</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-800/60">
              <span>Bruto: R$ {Math.abs(metrics.grossMonthlySavings).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-amber-400 font-semibold">
                -{metrics.errorMarginPercent}%: -R$ {Math.abs(metrics.errorMarginAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Projeção Anual:</span>
            <span className={`font-mono font-bold ${
              metrics.annualProjectedSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              R$ {Math.abs(metrics.annualProjectedSavings).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ano
            </span>
          </div>
        </div>

        {/* KPI 2: Horas-Homem Poupadas / Mês */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                Horas de Mão-de-Obra / Mês
              </span>
              <span className="text-[10px] text-cyan-400/80 font-medium">
                (Líquido c/ -{metrics.errorMarginPercent}% de erro)
              </span>
            </div>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                metrics.totalMonthlyHoursSaved >= 0 ? 'text-cyan-400' : 'text-amber-400'
              }`}>
                {Math.abs(metrics.totalMonthlyHoursSaved).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs font-bold text-cyan-300">horas / mês</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              Bruto: {Math.abs(metrics.grossHoursSaved).toFixed(1).replace('.', ',')} h | {metrics.totalMonthlyHoursSaved >= 0 ? 'Horas liberadas' : 'Horas extras'}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Capacidade Liberada:</span>
            <span className="text-cyan-300 font-mono font-bold">
              ~{Math.abs(metrics.equivalentOperatorsFreed).toFixed(1).replace('.', ',')} operadores
            </span>
          </div>
        </div>

        {/* KPI 3: Variação de Tempo por Bag */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Ganho Médio por Bag
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                metrics.totalTimeSavedPerBag >= 0 ? 'text-amber-300' : 'text-rose-400'
              }`}>
                {Math.abs(metrics.totalTimeSavedPerBag).toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs font-bold text-amber-400">min / bag</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 block mt-1">
              {metrics.totalTimeSavedPerBag >= 0
                ? `Redução de ~${Math.round(metrics.totalTimeSavedPerBag * 60)} segundos no ciclo total`
                : `Acréscimo de ~${Math.round(Math.abs(metrics.totalTimeSavedPerBag) * 60)} segundos`}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Volume Base:</span>
            <span className="text-amber-300 font-mono font-bold">
              {monthlyVolume.toLocaleString('pt-BR')} un/mês
            </span>
          </div>
        </div>

        {/* KPI 4: Balanço de Operações Kaizen */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Diagnóstico Kaizen
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-2 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ganhos de Tempo:
              </span>
              <span className="font-bold font-mono text-emerald-300">{metrics.gainCount} itens</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Aumento de Tempo:
              </span>
              <span className="font-bold font-mono text-rose-300">{metrics.lossCount} itens</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Sem Alteração:</span>
              <span className="font-bold font-mono">{metrics.neutralCount} itens</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Analisado:</span>
            <span className="text-purple-300 font-mono font-bold">
              {operations.length} operações
            </span>
          </div>
        </div>

      </div>

      {/* 1. Continuous Financial Evolution Chart (Estilo Índice Financeiro / Dólar) */}
      <FinancialEvolutionChart
        monthlyHistory={monthlyHistory}
        activeMonthKey={activeMonthKey}
        currentMonthNetSavings={metrics.totalMonthlySavings}
        currentMonthHoursSaved={metrics.totalMonthlyHoursSaved}
        totalCycleTimeMinutes={totalActiveCycleTime}
        baselineCycleTimeMinutes={totalBaselineCycleTime}
        errorMarginPercent={errorMarginPercent}
      />

      {/* 2. Monthly Performance Breakdown Chart (Comprovação Mês a Mês a partir da Última Medição) */}
      <MonthlyVarianceChart
        operations={enrichedOperations}
        categories={categories}
        monthlyVolume={monthlyVolume}
        monthlyHistory={monthlyHistory}
        activeMonthKey={activeMonthKey}
        errorMarginPercent={errorMarginPercent}
      />

      {/* Sector Breakdown Visualization (Rank de Economia por Setor) */}
      {metrics.sortedSectors.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Impacto Financeiro por Setor Industrial
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Setores ordenados pela contribuição líquida
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {metrics.sortedSectors.map((sec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
                    <span className="text-xs font-bold text-slate-200">{sec.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                    {sec.count} alt.
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xs text-slate-400">Economia:</span>
                  <span className={`text-sm font-extrabold font-mono ${sec.savings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sec.savings >= 0 ? '+' : ''} R$ {sec.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/50 pt-1.5">
                  <span>Horas Poupadas:</span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {sec.hours.toFixed(1).replace('.', ',')} h/mês
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar operação por nome..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter by Category */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Todos os Setores ({categories.length})</option>
            {categories.map(cat => (
              <option key={cat.key} value={cat.key}>
                {cat.title}
              </option>
            ))}
          </select>

          {/* Filter by Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="changed">Apenas c/ Mudança ({metrics.gainCount + metrics.lossCount})</option>
            <option value="all">Todas as Operações ({operations.length})</option>
            <option value="gain">Apenas Ganhos de Tempo ({metrics.gainCount})</option>
            <option value="loss">Apenas Aumentos de Tempo ({metrics.lossCount})</option>
            <option value="neutral">Sem Alteração ({metrics.neutralCount})</option>
          </select>
        </div>

      </div>

      {/* Operations Comparison Table */}
      <div className="rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Tabela de Medições & Retorno Financeiro
            </h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
              statusFilter === 'changed'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {filteredOperations.length} {statusFilter === 'changed' ? 'itens com mudança' : 'operações exibidas'}
            </span>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Ponto de Partida: <strong className="text-cyan-300">Última Medição Anterior (Kaizen)</strong>
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="p-3.5">Operação & Setor</th>
                <th className="p-3.5 text-center">Ponto de Partida</th>
                <th className="p-3.5 text-center">Nova Medição</th>
                <th className="p-3.5 text-center">Variação (Δ)</th>
                <th className="p-3.5 text-center">Qtd Aplicada / Mês</th>
                <th className="p-3.5 text-center">Custo R$/h</th>
                <th className="p-3.5 text-center">Horas Poupadas/Mês</th>
                <th className="p-3.5 text-right">Impacto Mês (R$)</th>
                <th className="p-3.5 text-right">Projeção Ano (R$)</th>
                <th className="p-3.5 text-center">Ações Kaizen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    <p className="text-slate-400 font-medium">
                      {statusFilter === 'changed'
                        ? 'Nenhuma operação teve variação de tempo nesta medição.'
                        : 'Nenhuma operação encontrada com os filtros selecionados.'}
                    </p>
                    {statusFilter === 'changed' && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className="text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold mt-2 inline-block cursor-pointer"
                      >
                        Exibir todas as operações da fábrica ({operations.length})
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOperations.map(op => {
                  const cat = categoryMap[op.category];
                  const isEditing = editingBaselineId === op.id;

                  return (
                    <tr
                      key={op.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        op.status === 'gain' ? 'bg-emerald-950/10' : op.status === 'loss' ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Name & Category */}
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-white text-xs">
                            {op.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: cat?.colorHex || '#06b6d4' }}
                            />
                            <span className="text-[10px] text-slate-400">
                              {cat?.title || op.category}
                            </span>
                            {op.isDefault && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                Padrão
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Baseline Time (Ponto de Partida) */}
                      <td className="p-3.5 text-center font-mono">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              value={tempBaselineValue}
                              onChange={e => setTempBaselineValue(e.target.value)}
                              className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-cyan-500 text-cyan-300 text-center font-bold font-mono text-xs focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => saveEditedBaseline(op.id)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                              title="Salvar novo ponto de partida"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingBaselineId(null)}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditingBaseline(op.id, op.baselineTime)}
                            className="group flex items-center justify-center gap-1 mx-auto px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Clique para editar manualmente o ponto de partida desta operação"
                          >
                            <span className="text-slate-300 font-bold group-hover:text-cyan-300">
                              {op.baselineTime.toFixed(2).replace('.', ',')} min
                            </span>
                            <span className="text-[10px] text-slate-500 group-hover:text-cyan-400">
                              (~{Math.round(op.baselineTime * 60)}s)
                            </span>
                          </button>
                        )}
                      </td>

                      {/* Current Measurement Time */}
                      <td className="p-3.5 text-center font-mono font-bold text-white">
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
                          {op.currentTime.toFixed(2).replace('.', ',')} min
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          (~{Math.round(op.currentTime * 60)}s)
                        </span>
                      </td>

                      {/* Delta Variation */}
                      <td className="p-3.5 text-center font-mono">
                        {op.status === 'gain' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold text-[11px] flex items-center gap-1">
                              <TrendingDown className="w-3 h-3 text-emerald-400" />
                              -{(Math.abs(op.deltaMinutes) * 60).toFixed(0)}s ({op.percentChange.toFixed(1).replace('.', ',')}%)
                            </span>
                            <span className="text-[9px] text-emerald-400 font-bold mt-0.5">
                              Ganho de Tempo (Diminuiu)
                            </span>
                          </div>
                        ) : op.status === 'loss' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold text-[11px] flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-rose-400" />
                              +{(op.deltaMinutes * 60).toFixed(0)}s (+{op.percentChange.toFixed(1).replace('.', ',')}%)
                            </span>
                            <span className="text-[9px] text-rose-400 font-bold mt-0.5">
                              Perda de Tempo (Aumentou)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-semibold text-[11px]">
                            0,00 min (Estável)
                          </span>
                        )}
                      </td>

                      {/* Qtd Aplicada / Mês (Specific or Full Monthly Volume) */}
                      <td className="p-3.5 text-center font-mono">
                        {editingVolumeId === op.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step="500"
                              min="0"
                              value={tempVolumeValue}
                              onChange={e => setTempVolumeValue(e.target.value)}
                              className="w-20 px-1.5 py-0.5 rounded bg-slate-950 border border-cyan-500 text-cyan-300 text-center font-bold font-mono text-xs focus:outline-none"
                              autoFocus
                              placeholder={`${monthlyVolume}`}
                            />
                            <button
                              type="button"
                              onClick={() => saveEditedVolume(op.id)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                              title="Salvar quantidade específica desta operação"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingVolumeId(null)}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => startEditingVolume(op.id, op.effectiveVolume)}
                              className={`group flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                op.isCustomVolume
                                  ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60 shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                              }`}
                              title="Clique para definir uma quantidade específica de bags onde esta operação se aplica (se não for no volume total do mês)"
                            >
                              <span>{op.effectiveVolume.toLocaleString('pt-BR')} un</span>
                              <span className="text-[10px] text-slate-500 group-hover:text-cyan-400">✏️</span>
                            </button>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[9px] font-semibold ${op.isCustomVolume ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                                {op.isCustomVolume ? 'Qtd Específica' : 'Volume Total (100%)'}
                              </span>
                              {op.isCustomVolume && (
                                <button
                                  type="button"
                                  onClick={() => resetVolumeToTotal(op.id)}
                                  className="text-[9px] text-slate-400 hover:text-rose-400 underline cursor-pointer"
                                  title="Restaurar para o volume total da fábrica"
                                >
                                  (redefinir)
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Hourly Rate */}
                      <td className="p-3.5 text-center font-mono text-slate-400">
                        R$ {op.hourlyRate.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Monthly Hours Impacted */}
                      <td className="p-3.5 text-center font-mono">
                        <span className={`font-bold ${
                          op.monthlyHoursImpacted > 0 ? 'text-cyan-400' : op.monthlyHoursImpacted < 0 ? 'text-rose-400' : 'text-slate-500'
                        }`}>
                          {op.monthlyHoursImpacted > 0 ? '+' : ''}{op.monthlyHoursImpacted.toFixed(1).replace('.', ',')} h
                        </span>
                      </td>

                      {/* Monthly Financial Impact */}
                      <td className="p-3.5 text-right font-mono">
                        <span className={`font-black text-xs ${
                          op.monthlyFinancialImpact > 0 ? 'text-emerald-400' : op.monthlyFinancialImpact < 0 ? 'text-rose-400' : 'text-slate-500'
                        }`}>
                          {op.monthlyFinancialImpact > 0 ? '+ ' : op.monthlyFinancialImpact < 0 ? '- ' : ''}
                          R$ {Math.abs(op.monthlyFinancialImpact).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Annual Financial Impact */}
                      <td className="p-3.5 text-right font-mono text-slate-400">
                        <span className={`${
                          op.annualFinancialImpact > 0 ? 'text-emerald-400/80 font-bold' : op.annualFinancialImpact < 0 ? 'text-rose-400/80 font-bold' : 'text-slate-600'
                        }`}>
                          {op.annualFinancialImpact > 0 ? '+ ' : op.annualFinancialImpact < 0 ? '- ' : ''}
                          R$ {Math.abs(op.annualFinancialImpact).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleAdvanceBaseline(op.id, op.currentTime)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap"
                          title="Define a medição atual como o novo ponto de partida para as próximas comparações (Ciclo Kaizen)"
                        >
                          Fixar como Referência
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Sector Cost Customization Modal */}
      <SectorCostModal
        isOpen={isSectorCostModalOpen}
        onClose={() => setIsSectorCostModalOpen(false)}
      />

      {/* New Month Creation / Activation Modal */}
      <NewMonthModal
        isOpen={isNewMonthModalOpen}
        onClose={() => setIsNewMonthModalOpen(false)}
      />

    </div>
  );
}
