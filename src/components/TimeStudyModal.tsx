'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import {
  OperationItem,
  LeanActionType,
  TimeStudySample,
  TimeStudyStats,
  TimeStudy
} from '@/types/production';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Gauge,
  Sliders,
  Check,
  Zap,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Dot
} from 'recharts';
import confetti from 'canvas-confetti';

interface TimeStudyModalProps {
  operation: OperationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const Z_VALUES: Record<number, number> = {
  90: 1.645,
  95: 1.96,
  99: 2.576
};

export const TimeStudyModal: React.FC<TimeStudyModalProps> = ({
  operation,
  isOpen,
  onClose
}) => {
  const { categoriesConfig, getTimeStudy, saveTimeStudyAndApply, showToast } = useProduction();

  // Stopwatch state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Study Parameters & Metadata
  const [operatorName, setOperatorName] = useState<string>('');
  const [analystName, setAnalystName] = useState<string>('Eng. de Processos');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [errorMarginPct, setErrorMarginPct] = useState<number>(0.05); // 5%
  const [paceRating, setPaceRating] = useState<number>(1.0); // 100%
  const [allowancePct, setAllowancePct] = useState<number>(0.12); // 12% suplemento padrão
  const [selectedLeanType, setSelectedLeanType] = useState<LeanActionType>('valor_agregado');
  const [manualTimeSeconds, setManualTimeSeconds] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Samples list
  const [samples, setSamples] = useState<TimeStudySample[]>([]);

  // Load existing study if present
  useEffect(() => {
    if (operation) {
      const existing = getTimeStudy(operation.id);
      if (existing) {
        setSamples(existing.samples || []);
        setOperatorName(existing.operatorName || '');
        setAnalystName(existing.analystName || 'Eng. de Processos');
        setConfidenceLevel(existing.stats?.confidenceLevel || 95);
        setErrorMarginPct(existing.stats?.errorMarginPct || 0.05);
        setPaceRating(existing.stats?.paceRating || 1.0);
        setAllowancePct(existing.stats?.allowancePercentage || 0.12);
        setNotes(existing.notes || '');
      } else {
        // Initial sample seed based on operation standard time if starting fresh
        setSamples([
          {
            id: `sample-${Date.now()}-1`,
            sampleIndex: 1,
            timeInSeconds: Math.round(operation.time * 60),
            timeInMinutes: Number(operation.time.toFixed(2)),
            type: 'valor_agregado',
            timestamp: new Date().toISOString()
          }
        ]);
        setOperatorName('');
        setPaceRating(1.0);
        setAllowancePct(0.12);
      }
      setIsRunning(false);
      setElapsedMs(0);
    }
  }, [operation, getTimeStudy]);

  // Stopwatch interval handler
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedMs;
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 30);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Format stopwatch display mm:ss.ms
  const formatTimer = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  // Add sample from stopwatch lap
  const handleRecordLap = (type: LeanActionType = selectedLeanType) => {
    if (elapsedMs < 300) {
      showToast('O tempo da tomada é muito curto (mínimo 0.3s).', 'error');
      return;
    }

    const sec = elapsedMs / 1000;
    const min = sec / 60;

    const newSample: TimeStudySample = {
      id: `sample-${Date.now()}-${samples.length + 1}`,
      sampleIndex: samples.length + 1,
      timeInSeconds: Number(sec.toFixed(2)),
      timeInMinutes: Number(min.toFixed(3)),
      type,
      timestamp: new Date().toISOString()
    };

    setSamples(prev => [...prev, newSample]);
    setElapsedMs(0);
    startTimeRef.current = Date.now();
    showToast(`Tomada #${newSample.sampleIndex} gravada (${sec.toFixed(1)}s - ${type.toUpperCase()})!`, 'info');
  };

  // Add manual sample
  const handleAddManualSample = (e: React.FormEvent) => {
    e.preventDefault();
    const sec = parseFloat(manualTimeSeconds);
    if (isNaN(sec) || sec <= 0) {
      showToast('Informe um tempo válido em segundos.', 'error');
      return;
    }

    const min = sec / 60;
    const newSample: TimeStudySample = {
      id: `sample-${Date.now()}-${samples.length + 1}`,
      sampleIndex: samples.length + 1,
      timeInSeconds: Number(sec.toFixed(2)),
      timeInMinutes: Number(min.toFixed(3)),
      type: selectedLeanType,
      timestamp: new Date().toISOString()
    };

    setSamples(prev => [...prev, newSample]);
    setManualTimeSeconds('');
    showToast(`Tomada manual gravada (${sec.toFixed(1)}s)!`, 'success');
  };

  // Remove sample
  const handleDeleteSample = (id: string) => {
    setSamples(prev =>
      prev
        .filter(s => s.id !== id)
        .map((s, idx) => ({ ...s, sampleIndex: idx + 1 }))
    );
  };

  // Update sample lean type
  const handleUpdateSampleType = (id: string, newType: LeanActionType) => {
    setSamples(prev =>
      prev.map(s => (s.id === id ? { ...s, type: newType } : s))
    );
  };

  // Statistical Calculations: N' = [ (z * s) / (e * x̄) ]^2
  const stats: TimeStudyStats = useMemo(() => {
    const n = samples.length;
    if (n === 0) {
      return {
        meanMinutes: 0,
        meanSeconds: 0,
        stdDevMinutes: 0,
        variance: 0,
        minMinutes: 0,
        maxMinutes: 0,
        sampleCount: 0,
        zValue: Z_VALUES[confidenceLevel] || 1.96,
        confidenceLevel,
        errorMarginPct,
        requiredSamples: 1,
        isStatisticallyValid: false,
        remainingSamplesNeeded: 1,
        vaRatio: 0,
        nnvaRatio: 0,
        nvaRatio: 0,
        paceRating,
        normalTimeMinutes: 0,
        allowancePercentage: allowancePct,
        standardTimeMinutes: 0
      };
    }

    const minutesList = samples.map(s => s.timeInMinutes);
    const sum = minutesList.reduce((a, b) => a + b, 0);
    const meanMinutes = sum / n;
    const meanSeconds = meanMinutes * 60;

    const minMinutes = Math.min(...minutesList);
    const maxMinutes = Math.max(...minutesList);

    // Sample standard deviation (s)
    let variance = 0;
    if (n > 1) {
      const sumSquaredDiff = minutesList.reduce((acc, val) => acc + Math.pow(val - meanMinutes, 2), 0);
      variance = sumSquaredDiff / (n - 1);
    }
    const stdDevMinutes = Math.sqrt(variance);

    // Statistical sizing N' = [ (z * s) / (e * x̄) ]^2
    const z = Z_VALUES[confidenceLevel] || 1.96;
    const e = errorMarginPct; // e.g. 0.05
    let requiredSamples = 1;

    if (meanMinutes > 0 && stdDevMinutes > 0) {
      const numerator = z * stdDevMinutes;
      const denominator = e * meanMinutes;
      const exactNPrime = Math.pow(numerator / denominator, 2);
      requiredSamples = Math.max(1, Math.ceil(exactNPrime));
    }

    const isStatisticallyValid = n >= requiredSamples;
    const remainingSamplesNeeded = Math.max(0, requiredSamples - n);

    // Lean Distribution
    const vaCount = samples.filter(s => s.type === 'valor_agregado').reduce((sum, s) => sum + s.timeInMinutes, 0);
    const nnvaCount = samples.filter(s => s.type === 'necessario').reduce((sum, s) => sum + s.timeInMinutes, 0);
    const nvaCount = samples.filter(s => s.type === 'desperdicio').reduce((sum, s) => sum + s.timeInMinutes, 0);

    const totalSampleTime = vaCount + nnvaCount + nvaCount;
    const vaRatio = totalSampleTime > 0 ? (vaCount / totalSampleTime) * 100 : 0;
    const nnvaRatio = totalSampleTime > 0 ? (nnvaCount / totalSampleTime) * 100 : 0;
    const nvaRatio = totalSampleTime > 0 ? (nvaCount / totalSampleTime) * 100 : 0;

    // Normal Time & Standard Time Synthesis
    // TN = TC * FR
    const normalTimeMinutes = meanMinutes * paceRating;
    // TP = TN * (1 + FT)
    const standardTimeMinutes = Number((normalTimeMinutes * (1 + allowancePct)).toFixed(2));

    return {
      meanMinutes: Number(meanMinutes.toFixed(3)),
      meanSeconds: Number(meanSeconds.toFixed(1)),
      stdDevMinutes: Number(stdDevMinutes.toFixed(4)),
      variance: Number(variance.toFixed(4)),
      minMinutes: Number(minMinutes.toFixed(3)),
      maxMinutes: Number(maxMinutes.toFixed(3)),
      sampleCount: n,
      zValue: z,
      confidenceLevel,
      errorMarginPct,
      requiredSamples,
      isStatisticallyValid,
      remainingSamplesNeeded,
      vaRatio: Number(vaRatio.toFixed(1)),
      nnvaRatio: Number(nnvaRatio.toFixed(1)),
      nvaRatio: Number(nvaRatio.toFixed(1)),
      paceRating,
      normalTimeMinutes: Number(normalTimeMinutes.toFixed(3)),
      allowancePercentage: allowancePct,
      standardTimeMinutes
    };
  }, [samples, confidenceLevel, errorMarginPct, paceRating, allowancePct]);

  // Chart data for Chronological Trend
  const trendChartData = useMemo(() => {
    return samples.map(s => ({
      index: `#${s.sampleIndex}`,
      timeMinutes: Number(s.timeInMinutes.toFixed(2)),
      timeSeconds: Number(s.timeInSeconds.toFixed(1)),
      type: s.type,
      meanMinutes: Number(stats.meanMinutes.toFixed(2))
    }));
  }, [samples, stats.meanMinutes]);

  if (!isOpen || !operation) return null;

  const config = categoriesConfig[operation.category];

  // Save and Apply Standard Time
  const handleSaveAndApply = async (applyToOperation: boolean = true) => {
    if (samples.length === 0) {
      showToast('Realize ao menos uma tomada de tempo.', 'error');
      return;
    }

    const study: TimeStudy = {
      id: `study-${operation.id}`,
      operationId: operation.id,
      operationName: operation.name,
      category: operation.category,
      operatorName: operatorName.trim() || undefined,
      analystName: analystName.trim() || undefined,
      date: new Date().toISOString(),
      samples,
      stats,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveTimeStudyAndApply(study, applyToOperation);

    if (applyToOperation) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 }
        });
      } catch {}
    }

    onClose();
  };

  const leanBadges: Record<LeanActionType, { label: string; color: string; bg: string; border: string }> = {
    valor_agregado: {
      label: 'Valor Agregado (VA)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60',
      border: 'border-emerald-800/60'
    },
    necessario: {
      label: 'Necessário (NNVA)',
      color: 'text-amber-400',
      bg: 'bg-amber-950/60',
      border: 'border-amber-800/60'
    },
    desperdicio: {
      label: 'Desperdício (NVA)',
      color: 'text-rose-400',
      bg: 'bg-rose-950/60',
      border: 'border-rose-800/60'
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: `${config.colorHex}20`,
                borderColor: `${config.colorHex}40`,
                color: config.colorHex
              }}
            >
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Cronoanálise & Estudo de Tempos Lean
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-bold border"
                  style={{
                    backgroundColor: `${config.colorHex}20`,
                    borderColor: `${config.colorHex}40`,
                    color: config.colorHex
                  }}
                >
                  {config.title}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operação: <strong className="text-slate-200">{operation.name}</strong> &bull; Tempo Atual: {operation.time.toFixed(2)} min
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Top Row: Stopwatch + Quick Controls & Lean Tag Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Stopwatch Console (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Cronômetro de Tomadas
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {samples.length} tomadas gravadas
                </span>
              </div>

              {/* Digital Time Display */}
              <div className="my-4 text-center">
                <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 py-1">
                  {formatTimer(elapsedMs)}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  {(elapsedMs / 1000).toFixed(1)}s &bull; {(elapsedMs / 60000).toFixed(3)} min
                </div>
              </div>

              {/* Lean Classification Selector for next lap */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Classificação Lean da Tomada:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'valor_agregado', label: 'VA', desc: 'Valor Agreg.', color: 'border-emerald-500 bg-emerald-950/60 text-emerald-300' },
                    { key: 'necessario', label: 'NNVA', desc: 'Necessário', color: 'border-amber-500 bg-amber-950/60 text-amber-300' },
                    { key: 'desperdicio', label: 'NVA', desc: 'Desperdício', color: 'border-rose-500 bg-rose-950/60 text-rose-300' }
                  ].map(btn => (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => setSelectedLeanType(btn.key as LeanActionType)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        selectedLeanType === btn.key
                          ? btn.color + ' shadow-md scale-[1.02]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>{btn.label}</div>
                      <div className="text-[9px] font-normal opacity-80">{btn.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stopwatch Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRecordLap()}
                  disabled={elapsedMs === 0}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  <span>Gravar Tomada</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setElapsedMs(0);
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Zerar Cronômetro"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Statistical Sizing Formula & Progress (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-xl flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                      Dimensionamento Amostral Estatístico
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                      stats.isStatisticallyValid
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                        : 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                    }`}
                  >
                    {stats.isStatisticallyValid ? '✓ Amostragem Válida' : `Faltam ${stats.remainingSamplesNeeded} tomadas`}
                  </span>
                </div>

                {/* Formula Highlight */}
                <div className="my-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="font-mono text-xs sm:text-sm text-cyan-300 font-bold tracking-wider text-center sm:text-left">
                    N&apos; = [ (z &middot; s) / (e &middot; x̄) ]&sup2;
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono text-center sm:text-right">
                    z = {stats.zValue} ({stats.confidenceLevel}%) &bull; e = {(stats.errorMarginPct * 100).toFixed(0)}% &bull; s = {stats.stdDevMinutes.toFixed(3)}m
                  </div>
                </div>

                {/* Progress Bar of Samples */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Tomadas Realizadas: <strong className="text-white">{stats.sampleCount}</strong></span>
                    <span className="text-slate-400">Recomendado (N&apos;): <strong className="text-cyan-300">{stats.requiredSamples}</strong></span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stats.isStatisticallyValid ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, (stats.sampleCount / stats.requiredSamples) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Statistical Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block uppercase">Média (x̄)</span>
                  <span className="text-sm font-bold font-mono text-white">{stats.meanMinutes.toFixed(2)} min</span>
                  <span className="text-[10px] text-slate-400 block">{stats.meanSeconds.toFixed(1)} s</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block uppercase">Desvio Padrão (s)</span>
                  <span className="text-sm font-bold font-mono text-cyan-300">&plusmn;{stats.stdDevMinutes.toFixed(3)}m</span>
                  <span className="text-[10px] text-slate-400 block">{stats.sampleCount > 1 ? 'amostral' : '1 tomada'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block uppercase">Mín / Máx</span>
                  <span className="text-xs font-bold font-mono text-slate-200">{stats.minMinutes.toFixed(2)}m / {stats.maxMinutes.toFixed(2)}m</span>
                  <span className="text-[10px] text-slate-400 block">&Delta; {(stats.maxMinutes - stats.minMinutes).toFixed(2)}m</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block uppercase">Confiança / Erro</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <select
                      value={confidenceLevel}
                      onChange={e => setConfidenceLevel(parseInt(e.target.value))}
                      className="bg-slate-950 border border-slate-800 rounded px-1 text-[11px] text-cyan-300 font-bold"
                    >
                      <option value={90}>90%</option>
                      <option value={95}>95%</option>
                      <option value={99}>99%</option>
                    </select>
                    <select
                      value={errorMarginPct}
                      onChange={e => setErrorMarginPct(parseFloat(e.target.value))}
                      className="bg-slate-950 border border-slate-800 rounded px-1 text-[11px] text-slate-300 font-bold"
                    >
                      <option value={0.05}>&plusmn;5%</option>
                      <option value={0.10}>&plusmn;10%</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Middle Row: Trend Chart + Lean Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Chronological Trend Chart (8 cols) */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Gráfico de Tendência Temporal das Medições
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Acompanhamento das tomadas para identificar curva de aprendizado ou fadiga
                  </p>
                </div>
              </div>

              {samples.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-500">
                  Nenhuma tomada gravada para gerar o gráfico.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="index" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val: any, name: any) => [`${val} min (${(Number(val) * 60).toFixed(0)}s)`, name === 'timeMinutes' ? 'Tempo Tomada' : 'Média']}
                      />
                      <ReferenceLine
                        y={stats.meanMinutes}
                        stroke="#06b6d4"
                        strokeDasharray="4 4"
                        label={{ value: `Média (${stats.meanMinutes.toFixed(2)}m)`, fill: '#06b6d4', fontSize: 10, position: 'top' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="timeMinutes"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#10b981' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Lean Distribution & Synthesis (4 cols) */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-xl flex flex-col justify-between">
              
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Mapeamento de Valor Lean
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Divisão do tempo do processo por agregação de valor
                </p>

                {/* Distribution Stacked Bar */}
                <div className="w-full bg-slate-900 rounded-xl h-3.5 overflow-hidden flex border border-slate-800 mb-3">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${stats.vaRatio}%` }} title={`Valor Agregado: ${stats.vaRatio}%`} />
                  <div className="bg-amber-500 h-full transition-all" style={{ width: `${stats.nnvaRatio}%` }} title={`Necessário: ${stats.nnvaRatio}%`} />
                  <div className="bg-rose-500 h-full transition-all" style={{ width: `${stats.nvaRatio}%` }} title={`Desperdício: ${stats.nvaRatio}%`} />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      Valor Agregado (VA)
                    </span>
                    <strong className="font-mono text-slate-200">{stats.vaRatio}%</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      Necessário (NNVA)
                    </span>
                    <strong className="font-mono text-slate-200">{stats.nnvaRatio}%</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <div className="w-2 h-2 rounded-full bg-rose-400" />
                      Desperdício (NVA)
                    </span>
                    <strong className="font-mono text-slate-200">{stats.nvaRatio}%</strong>
                  </div>
                </div>
              </div>

              {/* Manual Input Trigger */}
              <form onSubmit={handleAddManualSample} className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={manualTimeSeconds}
                  onChange={e => setManualTimeSeconds(e.target.value)}
                  placeholder="Tempo manual (s)..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold shrink-0 border border-slate-700 transition-colors"
                >
                  + Inserir
                </button>
              </form>

            </div>

          </div>

          {/* Bottom Row: Standard Time Synthesis & Samples Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Samples Table (7 cols) */}
            <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Lista de Tomadas de Tempo ({samples.length})
                </span>
                <span className="text-[11px] text-slate-500">Clique na tag para alterar classificação</span>
              </div>

              <div className="overflow-y-auto max-h-52 pr-1 custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                      <th className="py-1.5 px-2">#</th>
                      <th className="py-1.5 px-2">Tempo (s)</th>
                      <th className="py-1.5 px-2">Tempo (min)</th>
                      <th className="py-1.5 px-2 text-center">Classificação</th>
                      <th className="py-1.5 px-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {samples.map(s => {
                      const badge = leanBadges[s.type];
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-1.5 px-2 font-mono text-slate-400">#{s.sampleIndex}</td>
                          <td className="py-1.5 px-2 font-mono font-bold text-white">{s.timeInSeconds.toFixed(1)}s</td>
                          <td className="py-1.5 px-2 font-mono text-cyan-300">{s.timeInMinutes.toFixed(3)}m</td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const nextType: LeanActionType =
                                  s.type === 'valor_agregado'
                                    ? 'necessario'
                                    : s.type === 'necessario'
                                    ? 'desperdicio'
                                    : 'valor_agregado';
                                handleUpdateSampleType(s.id, nextType);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${badge.bg} ${badge.color} ${badge.border}`}
                              title="Clique para alternar VA / NNVA / NVA"
                            >
                              {s.type === 'valor_agregado' ? 'VA' : s.type === 'necessario' ? 'NNVA' : 'NVA'}
                            </button>
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteSample(s.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Remover tomada"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Standard Time Synthesis Form (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Síntese do Tempo Padrão (TP)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Ajuste o fator de ritmo do operador e tolerâncias de fadiga
                </p>

                {/* Sliders */}
                <div className="space-y-3 mt-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Fator de Ritmo (Velocidade):</span>
                      <strong className="font-mono text-cyan-300">{(paceRating * 100).toFixed(0)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0.80"
                      max="1.30"
                      step="0.05"
                      value={paceRating}
                      onChange={e => setPaceRating(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Tolerâncias & Concessões (Fadiga):</span>
                      <strong className="font-mono text-amber-300">{(allowancePct * 100).toFixed(0)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.30"
                      step="0.01"
                      value={allowancePct}
                      onChange={e => setAllowancePct(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Final Calculation Banner */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tempo Padrão Final:</span>
                    <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono">
                      {stats.standardTimeMinutes.toFixed(2)} <span className="text-xs font-bold text-teal-400">min</span>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-500 block text-[10px]">Tempo Normal (TN)</span>
                    <strong className="font-mono text-slate-300">{stats.normalTimeMinutes.toFixed(2)} min</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndApply(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Salvar Estudo
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndApply(true)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Aplicar Tempo à Operação</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center text-xs text-slate-500">
          <span>Estudo salvo localmente. Os novos tempos padrão serão sincronizados automaticamente com a calculadora e as OPs.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
