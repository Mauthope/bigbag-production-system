'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProduction } from '@/context/ProductionContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Boxes,
  Users,
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
  Plus,
  RotateCcw,
  Activity,
  ChevronUp
} from 'lucide-react';
import { SectorCostModal } from '@/components/SectorCostModal';
import { NewMonthModal } from '@/components/NewMonthModal';
import { FinancialEvolutionChart } from '@/components/FinancialEvolutionChart';
import { KaizenOpportunitiesModal } from '@/components/KaizenOpportunitiesModal';
import { ComponentCategoryKey, KaizenAction } from '@/types/production';
import { getCurrentMonthKey, getMonthLabel, getNextMonthClosingDate } from '@/utils/monthAutomation';
import { THEORETICAL_BASELINE_MINUTES, THEORETICAL_SECTOR_BASELINES } from '@/data/defaultData';

export default function IndicatorsPage() {
  const {
    operations,
    categories,
    financialConfig,
    updateFinancialConfig,
    updateOperationBaseline,
    updateOperationCustomVolume,
    updateOperationTime,
    registerKaizenAction,
    discardKaizenOpportunity,
    changeActiveMonth,
    resetCurrentMonthMeasurements,
    saveMonthlyClosing,
    isCalculatorOnly,
    setAccessMode
  } = useProduction();

  // If in restricted Operator mode, block access
  if (isCalculatorOnly) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-xl shadow-cyan-950/30">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Menu Restrito ao Modo Operador
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Este terminal está utilizando o link de acesso exclusivo da <strong>Calculadora de Tempos</strong>. O painel de indicadores financeiros e retorno de ROI está reservado para a Engenharia e Gestão.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            ← Voltar para a Calculadora
          </Link>
          <button
            onClick={() => setAccessMode('full')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Desbloquear Acesso Completo
          </button>
        </div>
      </div>
    );
  }

  const [isSectorCostModalOpen, setIsSectorCostModalOpen] = useState(false);
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [isKaizenModalOpen, setIsKaizenModalOpen] = useState(false);
  const [kaizenModalTab, setKaizenModalTab] = useState<'open_opportunities' | 'completed_kaizens'>('open_opportunities');
  const [showAllChanges, setShowAllChanges] = useState<boolean>(false);

  const currentCalendarMonthKey = getCurrentMonthKey();
  const activeMonthKey = financialConfig?.activeMonthKey || currentCalendarMonthKey;
  const monthlyHistory = financialConfig?.monthlyHistory || {};
  const activeMonthRecord = monthlyHistory[activeMonthKey];
  const isMonthClosed = activeMonthRecord?.isClosed ?? false;
  const isViewingHistoricalMonth = activeMonthKey !== currentCalendarMonthKey;
  const closingInfo = useMemo(() => getNextMonthClosingDate(activeMonthKey), [activeMonthKey]);

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
      // Ponto de Partida do Mês: A medição anterior oficial ou histórico real
      let baselineTime = op.time;
      if (op.previousTime !== undefined && op.previousTime !== null && Math.abs(op.previousTime - op.time) > 0.0001 && op.previousTime > 0.0001) {
        baselineTime = op.previousTime;
      } else if (op.history && op.history.length > 1) {
        baselineTime = op.history[op.history.length - 2].time;
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

      // Status Kaizen:
      // - 'gain': Apenas quando há Kaizen formalmente registrado e concluído (evita os 62 falsos ganhos)
      // - 'loss': Desvio ativo que não foi encerrado como perdido nem concluído
      let status: 'gain' | 'loss' | 'neutral' = 'neutral';
      if (op.kaizenAction?.status === 'completed') {
        status = 'gain';
      } else if (deltaMinutes > 0.001 && op.kaizenAction?.status !== 'lost') {
        status = 'loss';
      }

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

  // Aggregate KPI Metrics
  const metrics = useMemo(() => {
    let grossMonthlyGains = 0;
    let grossHoursGained = 0;
    let totalTimeSavedPerBag = 0;

    let grossLossesAmount = 0;
    let grossLossesHours = 0;
    let totalTimeLostPerBag = 0;

    let gainCount = 0;
    let lossCount = 0;
    let neutralCount = 0;

    const sectorBreakdown: Record<string, { name: string; color: string; savings: number; hours: number; count: number; lossAmount: number; lossHours: number }> = {};

    enrichedOperations.forEach(op => {
      if (op.status === 'gain') {
        gainCount++;
        grossMonthlyGains += op.monthlyFinancialImpact;
        grossHoursGained += op.monthlyHoursImpacted;
        totalTimeSavedPerBag += op.timeSavedMinutes;
      } else if (op.status === 'loss') {
        lossCount++;
        // Notice: op.monthlyFinancialImpact is negative for loss, so take absolute for Kaizen tracking
        const lossVal = Math.abs(op.monthlyFinancialImpact);
        const lossH = Math.abs(op.monthlyHoursImpacted);
        grossLossesAmount += lossVal;
        grossLossesHours += lossH;
        totalTimeLostPerBag += Math.abs(op.deltaMinutes);
      } else {
        neutralCount++;
      }

      // Sector aggregation
      if (!sectorBreakdown[op.category]) {
        const cat = categoryMap[op.category];
        sectorBreakdown[op.category] = {
          name: cat?.title || op.category,
          color: cat?.colorHex || '#06b6d4',
          savings: 0,
          hours: 0,
          count: 0,
          lossAmount: 0,
          lossHours: 0
        };
      }
      if (op.status === 'gain') {
        sectorBreakdown[op.category].savings += op.monthlyFinancialImpact;
        sectorBreakdown[op.category].hours += op.monthlyHoursImpacted;
        sectorBreakdown[op.category].count++;
      } else if (op.status === 'loss') {
        sectorBreakdown[op.category].lossAmount += Math.abs(op.monthlyFinancialImpact);
        sectorBreakdown[op.category].lossHours += Math.abs(op.monthlyHoursImpacted);
        sectorBreakdown[op.category].count++;
      }
    });

    // 5% Error margin / Industrial dispersion deduction applied ONLY to gains
    const grossMonthlySavings = grossMonthlyGains;
    const errorMarginAmount = grossMonthlySavings * (errorMarginPercent / 100);
    const finalMonthlySavings = grossMonthlySavings - errorMarginAmount;
    const finalAnnualProjectedSavings = finalMonthlySavings * 12;

    const grossHoursSaved = grossHoursGained;
    const errorHoursAmount = grossHoursSaved * (errorMarginPercent / 100);
    const finalMonthlyHoursSaved = grossHoursSaved - errorHoursAmount;

    // Equivalent full-time operators freed up (assuming 176h/month = 22 days * 8h)
    const equivalentOperatorsFreed = finalMonthlyHoursSaved / (22 * 8.5);

    const sortedSectors = Object.values(sectorBreakdown)
      .filter(s => s.savings !== 0 || s.hours !== 0 || s.lossAmount !== 0)
      .sort((a, b) => b.savings - a.savings);

    return {
      grossMonthlySavings,
      errorMarginPercent,
      errorMarginAmount,
      totalMonthlySavings: finalMonthlySavings, // Apenas ganhos c/ dedução de 5% de margem técnica
      annualProjectedSavings: finalAnnualProjectedSavings,
      grossHoursSaved,
      totalMonthlyHoursSaved: finalMonthlyHoursSaved,
      totalTimeSavedPerBag,
      totalTimeLostPerBag,
      grossLossesAmount, // Rastreador de desvios para Kaizen (não subtraído dos ganhos)
      grossLossesHours,
      gainCount,
      lossCount,
      neutralCount,
      equivalentOperatorsFreed,
      sortedSectors
    };
  }, [enrichedOperations, categoryMap, errorMarginPercent]);

  // Se o mês selecionado estiver consolidado/fechado, exibe os valores congelados do fechamento
  const displayMetrics = useMemo(() => {
    if (isMonthClosed && activeMonthRecord) {
      const totalSavings = activeMonthRecord.totalSavings ?? 0;
      const grossSavings = activeMonthRecord.grossSavings ?? totalSavings;
      const totalHoursSaved = activeMonthRecord.hoursSaved ?? 0;
      const totalLosses = activeMonthRecord.totalLosses ?? 0;
      const totalHoursLost = activeMonthRecord.hoursLost ?? 0;
      const marginAmt = Math.max(0, grossSavings - totalSavings);
      return {
        ...metrics,
        grossMonthlySavings: grossSavings,
        errorMarginAmount: marginAmt,
        totalMonthlySavings: totalSavings,
        annualProjectedSavings: totalSavings * 12,
        grossHoursSaved: totalHoursSaved,
        totalMonthlyHoursSaved: totalHoursSaved,
        grossLossesAmount: totalLosses,
        grossLossesHours: totalHoursLost,
        equivalentOperatorsFreed: totalHoursSaved / (22 * 8.5)
      };
    }
    return metrics;
  }, [isMonthClosed, activeMonthRecord, metrics]);

  // 1. Marco Teórico Base Fixado (Calculadora Kanban Original: 104,22 min)
  const theoreticalBaselineMinutes = THEORETICAL_BASELINE_MINUTES;

  // 2. Somatório da Primeira Medição Real de Campo de cada item (Pico Máximo Inicial da Cronoanálise)
  const firstRealMeasurementSumMinutes = useMemo(() => {
    const sum = operations.reduce((acc, op) => {
      const first = (op.history && op.history.length > 0)
        ? op.history[0].time
        : (op.previousTime && op.previousTime > 0.0001 ? op.previousTime : op.time);
      return acc + Number(first || 0);
    }, 0);
    return Number(sum.toFixed(2));
  }, [operations]);

  // 3. Tempo Atual do Catálogo (Menor Tempo / Pós-Kaizen)
  const currentCatalogTimeMinutes = useMemo(() => {
    const sum = operations.reduce((acc, op) => acc + Number(op.time || 0), 0);
    return Number(sum.toFixed(2));
  }, [operations]);

  // Compatibilidade com variáveis anteriores
  const marcoZeroCatalogTimeMinutes = firstRealMeasurementSumMinutes;

  // Métricas de Evolução: Pico vs Atual vs Teórico
  const {
    picoDeltaVsTeorico,
    picoPercentVsTeorico,
    atualDeltaVsTeorico,
    atualPercentVsTeorico,
    netTimeReducedMinutes,
    netPercentReductionFromPeak
  } = useMemo(() => {
    const picoDelta = firstRealMeasurementSumMinutes - theoreticalBaselineMinutes;
    const picoPct = theoreticalBaselineMinutes > 0
      ? Number(((picoDelta / theoreticalBaselineMinutes) * 100).toFixed(1))
      : 0;

    const atualDelta = currentCatalogTimeMinutes - theoreticalBaselineMinutes;
    const atualPct = theoreticalBaselineMinutes > 0
      ? Number(((atualDelta / theoreticalBaselineMinutes) * 100).toFixed(1))
      : 0;

    const reducedMin = firstRealMeasurementSumMinutes - currentCatalogTimeMinutes;
    const reducedPct = firstRealMeasurementSumMinutes > 0
      ? Number(((reducedMin / firstRealMeasurementSumMinutes) * 100).toFixed(1))
      : 0;

    return {
      picoDeltaVsTeorico: Number(picoDelta.toFixed(2)),
      picoPercentVsTeorico: picoPct,
      atualDeltaVsTeorico: Number(atualDelta.toFixed(2)),
      atualPercentVsTeorico: atualPct,
      netTimeReducedMinutes: Number(reducedMin.toFixed(2)),
      netPercentReductionFromPeak: reducedPct
    };
  }, [firstRealMeasurementSumMinutes, currentCatalogTimeMinutes, theoreticalBaselineMinutes]);

  // Variação Kaizen Real (Atual vs 1ª Medição Real)
  const netVariationMinutes = -netTimeReducedMinutes;
  const percentVariationVsMarcoZero = -netPercentReductionFromPeak;
  const netVariationSeconds = Math.round(Math.abs(netTimeReducedMinutes) * 60);

  // Evolução de Tempo por Setor Industrial em relação ao Valor Base Teórico
  const sectorTimeEvolution = useMemo(() => {
    return categories.map(cat => {
      const catOps = operations.filter(op => op.category === cat.key);
      const theoreticalBase = THEORETICAL_SECTOR_BASELINES[cat.key] ?? 0;
      
      const firstReal = catOps.reduce((acc, op) => {
        const first = (op.history && op.history.length > 0)
          ? op.history[0].time
          : (op.previousTime && op.previousTime > 0.0001 ? op.previousTime : op.time);
        return acc + Number(first || 0);
      }, 0);

      const current = catOps.reduce((acc, op) => acc + Number(op.time || 0), 0);
      const deltaVsBase = current - theoreticalBase;
      const pctVsBase = theoreticalBase > 0 ? ((deltaVsBase / theoreticalBase) * 100) : 0;
      const kaizenSaved = firstReal - current;
      const kaizenSavedPct = firstReal > 0 ? ((kaizenSaved / firstReal) * 100) : 0;

      return {
        key: cat.key,
        name: cat.title,
        color: cat.colorHex || '#06b6d4',
        opsCount: catOps.length,
        theoreticalBase: Number(theoreticalBase.toFixed(2)),
        firstReal: Number(firstReal.toFixed(2)),
        current: Number(current.toFixed(2)),
        deltaVsBase: Number(deltaVsBase.toFixed(2)),
        pctVsBase: Number(pctVsBase.toFixed(1)),
        kaizenSaved: Number(kaizenSaved.toFixed(2)),
        kaizenSavedPct: Number(kaizenSavedPct.toFixed(1))
      };
    });
  }, [categories, operations]);

  // Maiores Reduções de Tempo (Ganhos Kaizen Conquistados)
  const topReductions = useMemo(() => {
    return enrichedOperations
      .filter(op => op.deltaMinutes < -0.001)
      .sort((a, b) => a.deltaMinutes - b.deltaMinutes);
  }, [enrichedOperations]);

  // Maiores Aumentos de Tempo (Oportunidades Kaizen em Aberto)
  const topIncreases = useMemo(() => {
    return enrichedOperations
      .filter(op => op.deltaMinutes > 0.001)
      .sort((a, b) => b.deltaMinutes - a.deltaMinutes);
  }, [enrichedOperations]);

  // Ganhos Reais de Kaizen Conquistados (Apenas ações Kaizen formalmente registradas e concluídas)
  const completedKaizensList = useMemo(() => {
    const list: Array<{
      opId: string;
      name: string;
      savedMinutes: number;
      monthlySavings: number;
      date?: string;
      notes?: string;
    }> = [];

    operations.forEach(op => {
      const completedActions: KaizenAction[] = [];
      if (op.kaizenAction && op.kaizenAction.status === 'completed') {
        completedActions.push(op.kaizenAction);
      }
      if (op.kaizenHistory) {
        op.kaizenHistory
          .filter(k => k.status === 'completed' && k.id !== op.kaizenAction?.id)
          .forEach(k => completedActions.push(k));
      }

      completedActions.forEach(action => {
        const effVol = op.customVolume !== undefined && op.customVolume > 0 ? op.customVolume : monthlyVolume;
        const rate = sectorHourlyRates[op.category] !== undefined ? sectorHourlyRates[op.category] : defaultHourlyRate;
        const savedMin = action.savedMinutes ?? Math.max(0, action.opportunityTime - (action.newMeasuredTime ?? op.time));
        const hours = (savedMin * effVol) / 60;
        const savings = hours * rate;

        list.push({
          opId: op.id,
          name: op.name,
          savedMinutes: savedMin,
          monthlySavings: savings,
          date: action.completedAt?.split('T')[0] || action.registeredAt.split('T')[0],
          notes: action.actionDescription || 'Kaizen: redução de tempo de ciclo'
        });
      });
    });

    return list;
  }, [operations, monthlyVolume, sectorHourlyRates, defaultHourlyRate]);

  const totalKaizenAchievedSavings = useMemo(() => {
    return completedKaizensList.reduce((acc, item) => acc + item.monthlySavings, 0);
  }, [completedKaizensList]);

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

  // Excluir Oportunidade Kaizen: aceita o tempo atual sem Kaizen e alinha o baseline
  const handleExcludeKaizenOpportunity = async (opId: string, currentTime: number) => {
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
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Evolução de Tempo por Big Bag & Oportunidades Kaizen
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Acompanhamento contínuo do <strong>Tempo de Fabricação por Big Bag</strong> e da sua <strong>evolução percentual mês a mês</strong>. O impacto financeiro (\(R\$\)) é apurado de forma estrita nas <strong>Oportunidades Kaizen</strong>, quantificando o retorno real sobre os pontos otimizados por nova cronoanálise.
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
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950/90 border border-cyan-500/25 shadow-lg flex flex-col gap-3.5">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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
                  const label = rec?.monthLabel || getMonthLabel(key);
                  const closedTag = rec?.isClosed ? ' [Consolidado]' : ' [Em Aberto]';
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

          {/* Month Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isViewingHistoricalMonth && (
              <button
                type="button"
                onClick={() => changeActiveMonth(currentCalendarMonthKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Voltar ao Mês Atual ({getMonthLabel(currentCalendarMonthKey)})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleCloseMonth}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isMonthClosed
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
              title={isMonthClosed ? 'Reabrir mês para novas alterações' : 'Consolidar antes da virada automática do mês'}
            >
              {isMonthClosed ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isMonthClosed ? 'Reabrir Mês (Exceção)' : 'Fechar Antecipadamente'}</span>
            </button>

            {!isMonthClosed && (
              <button
                type="button"
                onClick={resetCurrentMonthMeasurements}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Fixa os tempos atuais como ponto de partida para começar a medir do zero neste mês"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Zerar Medições do Mês</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsNewMonthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-500/50 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Ajuste manual de ciclo ou parametrização de novo mês"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajustar Ciclo</span>
            </button>
          </div>
        </div>

        {/* Automation Status Banner */}
        <div className="pt-2.5 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {!isMonthClosed ? (
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
              <span>
                <strong>Fechamento 100% Automático:</strong> Encerramento e consolidação programados para o último dia do mês (<strong>{closingInfo.lastDateFormatted} às 23:59</strong>). A virada do mês inicia o novo ciclo automaticamente com balanço zerado.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Mês Consolidado:</strong> Encerrado em <strong>{activeMonthRecord?.closedAt ? new Date(activeMonthRecord.closedAt + 'T12:00:00').toLocaleDateString('pt-BR') : closingInfo.lastDateFormatted}</strong>. Histórico congelado para auditoria e prestação de contas.
              </span>
            </div>
          )}

          {!isMonthClosed && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 shrink-0 sm:ml-auto">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{closingInfo.isLastDay ? 'Hoje é o último dia do mês!' : `${closingInfo.daysRemaining} dias até a virada automática`}</span>
            </div>
          )}
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

        {/* Informative Note */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
          <span>Monitoramento temporal do ciclo por Big Bag & Retorno financeiro restrito ao Kaizen</span>
        </div>

      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* KPI 1: Tempo Teórico Base (Calculadora Kanban Original: 104,22 min) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                Tempo Teórico Base
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold">
                (Calculadora Kanban Original)
              </span>
            </div>
            <div className="p-2 rounded-xl border bg-cyan-500/10 border-cyan-500/20 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-cyan-300">
                {theoreticalBaselineMinutes.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs font-bold text-slate-400">min base</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Ponto de partida teórico da fábrica ({operations.length} micro-operações)
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Origem:</span>
            <span className="font-mono font-bold text-cyan-400">
              Calculadora de Tempo Kanban
            </span>
          </div>
        </div>

        {/* KPI 2: Somatório da 1ª Medição Real (Pico Inicial) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                1ª Medição Real (Pico)
              </span>
              <span className="text-[10px] text-amber-400/90 font-medium">
                (Soma inicial da cronoanálise de campo)
              </span>
            </div>
            <div className="p-2 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-400">
                {firstRealMeasurementSumMinutes.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs font-bold text-slate-400">min totais</span>
            </div>
            <div className="text-[11px] font-mono text-amber-300/80 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{picoDeltaVsTeorico.toFixed(2).replace('.', ',')}m (+{picoPercentVsTeorico.toFixed(1).replace('.', ',')}%) vs Teórico (104,22m)
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Desvio Inicial:</span>
            <span className="font-mono font-bold text-amber-400">
              +{picoPercentVsTeorico.toFixed(1).replace('.', ',')}% vs Teórico
            </span>
          </div>
        </div>

        {/* KPI 3: Ganho Real de Eficiência Kaizen */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                Evolução Temporal do Catálogo
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                (Pico Máximo vs Tempo Atual)
              </span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-cyan-300">
                {currentCatalogTimeMinutes.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs font-bold text-slate-400">min atuais</span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${
                atualDeltaVsTeorico > 0 
                  ? 'bg-amber-950/80 text-amber-400 border-amber-800/60' 
                  : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
              }`}>
                {atualPercentVsTeorico >= 0 ? '+' : ''}{atualPercentVsTeorico.toFixed(1).replace('.', ',')}% vs Teórico
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1.5 flex items-center justify-between">
              <span>Pico: <strong className="text-amber-400">{firstRealMeasurementSumMinutes.toFixed(2).replace('.', ',')}m</strong></span>
              <span>→</span>
              <span>Atual: <strong className="text-cyan-300">{currentCatalogTimeMinutes.toFixed(2).replace('.', ',')}m</strong></span>
              <span className="text-emerald-400 font-bold">(-{netPercentReductionFromPeak.toFixed(1).replace('.', ',')}%)</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Ganho Conquistado:</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              -{netTimeReducedMinutes.toFixed(2).replace('.', ',')} min (-{netPercentReductionFromPeak.toFixed(1).replace('.', ',')}%)
            </span>
          </div>
        </div>

        {/* KPI 4: Oportunidades Kaizen (Aumentos de Tempo & Desvios) - Foco em TEMPO (SEM R$) */}
        <div
          onClick={() => {
            setKaizenModalTab('open_opportunities');
            setIsKaizenModalOpen(true);
          }}
          role="button"
          tabIndex={0}
          title="Clique para auditar e gerenciar as Oportunidades Kaizen (operações com aumento de tempo)"
          className={`p-4 rounded-2xl bg-slate-900/90 border shadow-xl flex flex-col justify-between cursor-pointer transition-all duration-300 relative overflow-hidden group hover:scale-[1.015] active:scale-[0.99] ${
            displayMetrics.lossCount > 0
              ? 'border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.45)] ring-1 ring-rose-500/50 hover:shadow-[0_0_50px_rgba(244,63,94,0.7)] hover:border-rose-400 bg-gradient-to-br from-slate-900 via-rose-950/30 to-slate-950'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Fundo de Iluminação Neon Vermelho para Desvios Ativos */}
          {displayMetrics.lossCount > 0 && (
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/35 transition-all animate-pulse" />
          )}

          <div className="flex items-center justify-between gap-2 relative z-10">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block group-hover:text-slate-200 transition-colors">
                Oportunidades Kaizen
              </span>
              <span className="text-[10px] text-rose-400/90 font-semibold">
                (Aumentos de Tempo Registrados)
              </span>
            </div>
            <div className={`p-2 rounded-xl border transition-transform group-hover:scale-110 ${
              displayMetrics.lossCount > 0
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {displayMetrics.lossCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
          </div>

          {/* Métrica Central: Foco Exclusivo em TEMPO e Oportunidades (SEM R$) */}
          <div className="mt-3 relative z-10">
            {displayMetrics.lossCount > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-rose-400 group-hover:text-rose-300 transition-colors drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">
                    {displayMetrics.lossCount}
                  </span>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                    {displayMetrics.lossCount === 1 ? 'desvio ativo' : 'desvios ativos'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mt-2 pt-2 border-t border-slate-800/80">
                  <span className="text-rose-300 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                    +{displayMetrics.grossLossesHours.toFixed(1).replace('.', ',')}h excedentes
                  </span>
                  <span className="text-slate-400">
                    +{Math.round(displayMetrics.totalTimeLostPerBag * 60)}s por bag
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400">
                    0
                  </span>
                  <span className="text-xs font-bold text-emerald-300">
                    desvios ativos
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-2 pt-2 border-t border-slate-800/80 font-mono">
                  100% dos tempos mantidos ou reduzidos
                </span>
              </>
            )}
          </div>

          {/* Rodapé do Card: Ação Direta para Auditar no Pop-up */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs relative z-10">
            <span className="text-slate-400 font-mono text-[11px]">
              {displayMetrics.lossCount > 0 ? 'Requer Ação Kaizen' : 'Processos Padronizados'}
            </span>
            <span className={`text-[11px] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-all ${
              displayMetrics.lossCount > 0 ? 'text-rose-400 group-hover:text-rose-300' : 'text-cyan-400 group-hover:text-cyan-300'
            }`}>
              <span>{displayMetrics.lossCount > 0 ? 'Auditar Oportunidades' : 'Gerenciar Kaizen'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>

      </div>

      {/* 1. Continuous Evolution Chart (Engenharia de Tempos & Kaizen) */}
      <FinancialEvolutionChart
        monthlyHistory={monthlyHistory}
        activeMonthKey={activeMonthKey}
        currentCatalogTimeMinutes={currentCatalogTimeMinutes}
        marcoZeroCatalogTimeMinutes={marcoZeroCatalogTimeMinutes}
        theoreticalBaselineMinutes={theoreticalBaselineMinutes}
        firstRealMeasurementTimeMinutes={marcoZeroCatalogTimeMinutes}
        operations={enrichedOperations}
        categories={categories}
        netVariationMinutes={netVariationMinutes}
        percentVariationVsMarcoZero={percentVariationVsMarcoZero}
        totalKaizenCompletedSavings={totalKaizenAchievedSavings}
        errorMarginPercent={errorMarginPercent}
        operationsCount={enrichedOperations.length}
      />

      {/* Ranking das Maiores Mudanças de Tempo (Ganhos Kaizen vs Oportunidades) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Ranking das Maiores Mudanças de Tempo
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Auditoria de desempenho: pontos com maiores reduções conquistadas (Ganhos Kaizen) vs pontos que sofreram aumento (Oportunidades em Aberto).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAllChanges(!showAllChanges)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 self-start sm:self-auto"
          >
            {showAllChanges ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Mostrar Apenas Top 5</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Ver Todas as Mudanças ({topReductions.length + topIncreases.length})</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Coluna 1: Top Reduções de Tempo (Ganhos Kaizen Conquistados) */}
          <div className="rounded-xl bg-slate-950/70 border border-emerald-500/25 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Maiores Reduções de Tempo (Ganhos)
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Otimizações confirmadas por cronoanálise
                  </span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                {topReductions.length} itens otimizados
              </span>
            </div>

            {topReductions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Nenhuma redução registrada no ciclo atual.
              </p>
            ) : (
              <div className="space-y-2">
                {(showAllChanges ? topReductions : topReductions.slice(0, 5)).map((op, idx) => {
                  const cat = categoryMap[op.category];
                  return (
                    <div
                      key={op.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-100 block truncate" title={op.name}>
                            {op.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat?.colorHex || '#10b981' }}
                            />
                            <span className="text-[10px] text-slate-400 truncate">
                              {cat?.title || op.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              • {op.baselineTime.toFixed(2).replace('.', ',')}m → {op.currentTime.toFixed(2).replace('.', ',')}m
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[11px] bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 inline-flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-emerald-400" />
                          {op.deltaMinutes.toFixed(2).replace('.', ',')}m ({op.percentChange.toFixed(1).replace('.', ',')}%)
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300 block mt-1">
                          +{op.monthlyHoursImpacted.toFixed(1).replace('.', ',')} h/mês poupadas
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna 2: Top Aumentos de Tempo (Oportunidades Kaizen em Aberto) */}
          <div className="rounded-xl bg-slate-950/70 border border-rose-500/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Maiores Aumentos de Tempo (Oportunidades)
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Gargalos identificados que demandam ação Kaizen
                  </span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                {topIncreases.length} desvios registrados
              </span>
            </div>

            {topIncreases.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Nenhum aumento registrado. Todos os tempos mantidos ou reduzidos!
              </p>
            ) : (
              <div className="space-y-2">
                {(showAllChanges ? topIncreases : topIncreases.slice(0, 5)).map((op, idx) => {
                  const cat = categoryMap[op.category];
                  return (
                    <div
                      key={op.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-rose-500/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-100 block truncate" title={op.name}>
                            {op.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat?.colorHex || '#f43f5e' }}
                            />
                            <span className="text-[10px] text-slate-400 truncate">
                              {cat?.title || op.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              • {op.baselineTime.toFixed(2).replace('.', ',')}m → {op.currentTime.toFixed(2).replace('.', ',')}m
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[11px] bg-rose-950/90 text-rose-300 border border-rose-800/80 inline-flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-rose-400" />
                          +{op.deltaMinutes.toFixed(2).replace('.', ',')}m (+{op.percentChange.toFixed(1).replace('.', ',')}%)
                        </span>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <span className="text-[10px] font-mono text-rose-300">
                            +{Math.abs(op.monthlyHoursImpacted).toFixed(1).replace('.', ',')} h/mês
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setKaizenModalTab('open_opportunities');
                              setIsKaizenModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                            title="Auditar e tratar esta oportunidade no painel Kaizen"
                          >
                            Tratar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>


      {/* Evolução de Tempo por Setor Industrial (vs Valor Teórico Base Original) */}
      {sectorTimeEvolution.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Evolução de Tempo por Setor Industrial
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Comparativo de tempo (minutos) em relação à Base Teórica Original
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {sectorTimeEvolution.map(sec => (
              <div
                key={sec.key}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
                    <span className="text-xs font-bold text-slate-200">{sec.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                    {sec.opsCount} micro-op.
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1.5 px-2 rounded-lg bg-slate-900/60 border border-slate-800/50 text-center font-mono">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Base Teórica</span>
                    <span className="text-xs font-semibold text-slate-300">{sec.theoreticalBase.toFixed(2).replace('.', ',')}m</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-amber-500/80 block">1ª Med. (Pico)</span>
                    <span className="text-xs font-semibold text-amber-400">{sec.firstReal.toFixed(2).replace('.', ',')}m</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 block">Tempo Atual</span>
                    <span className="text-xs font-bold text-cyan-300">{sec.current.toFixed(2).replace('.', ',')}m</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] font-mono border-t border-slate-800/60 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">Variação vs Teórico:</span>
                    <span className={`font-bold flex items-center gap-0.5 ${
                      sec.deltaVsBase > 0 ? 'text-amber-400' : sec.deltaVsBase < 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {sec.deltaVsBase > 0 ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          +{sec.deltaVsBase.toFixed(2).replace('.', ',')}m (+{sec.pctVsBase.toFixed(1).replace('.', ',')}%)
                        </>
                      ) : sec.deltaVsBase < 0 ? (
                        <>
                          <ArrowDownRight className="w-3 h-3" />
                          {sec.deltaVsBase.toFixed(2).replace('.', ',')}m ({sec.pctVsBase.toFixed(1).replace('.', ',')}%)
                        </>
                      ) : (
                        '0,00m (0,0%)'
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">Redução Kaizen (do pico):</span>
                    {sec.kaizenSaved > 0.001 ? (
                      <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                        <ArrowDownRight className="w-3 h-3" />
                        -{sec.kaizenSaved.toFixed(2).replace('.', ',')}m (-{sec.kaizenSavedPct.toFixed(1).replace('.', ',')}%)
                      </span>
                    ) : sec.kaizenSaved < -0.001 ? (
                      <span className="font-bold text-rose-400 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        +{Math.abs(sec.kaizenSaved).toFixed(2).replace('.', ',')}m
                      </span>
                    ) : (
                      <span className="text-slate-500">Estável</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



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

      {/* Kaizen Opportunities & Reduction Gains Modal */}
      <KaizenOpportunitiesModal
        isOpen={isKaizenModalOpen}
        onClose={() => setIsKaizenModalOpen(false)}
        operations={enrichedOperations}
        categories={categories}
        monthlyVolume={monthlyVolume}
        defaultHourlyRate={defaultHourlyRate}
        onUpdateOperationTime={updateOperationTime}
        onExcludeOpportunity={handleExcludeKaizenOpportunity}
        onRegisterKaizen={registerKaizenAction}
        onDiscardOpportunity={discardKaizenOpportunity}
        initialTab={kaizenModalTab}
      />

    </div>
  );
}
