'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import {
  OperationItem,
  LeanActionType,
  MicroOperation,
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
  Clock,
  Gauge,
  Sliders,
  Check,
  Zap,
  Layers,
  ArrowRight,
  BarChart3,
  ListOrdered,
  Workflow,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine
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

// Preset suggested micro-operations templates
const DEFAULT_PRESET_STEPS: Record<string, Array<{ name: string; type: LeanActionType; defaultSec: number }>> = {
  alca: [
    { name: '1. Pegar corpo do bag e posicionar na máquina', type: 'necessario', defaultSec: 18 },
    { name: '2. Pegar alça e alinhar no gabarito/marcação', type: 'necessario', defaultSec: 15 },
    { name: '3. Costura travada da 1ª perna da alça', type: 'valor_agregado', defaultSec: 45 },
    { name: '4. Virar e costurar 2ª perna da alça', type: 'valor_agregado', defaultSec: 45 },
    { name: '5. Cortar linha e retirar sobras', type: 'desperdicio', defaultSec: 12 },
    { name: '6. Deslocar bag para a esteira/pilha', type: 'necessario', defaultSec: 15 }
  ],
  fundo: [
    { name: '1. Posicionar fundo no corpo do Big Bag', type: 'necessario', defaultSec: 20 },
    { name: '2. Alinhar cantos e vincos do fundo', type: 'necessario', defaultSec: 15 },
    { name: '3. Costura contínua perimetral do fundo', type: 'valor_agregado', defaultSec: 55 },
    { name: '4. Aplicação e costura de vedante/reforço', type: 'valor_agregado', defaultSec: 25 },
    { name: '5. Arremate de linha e inspeção rápida', type: 'desperdicio', defaultSec: 10 }
  ],
  default: [
    { name: '1. Preparação e posicionamento do material', type: 'necessario', defaultSec: 20 },
    { name: '2. Execução da costura principal', type: 'valor_agregado', defaultSec: 60 },
    { name: '3. Costura de reforço ou acessório', type: 'valor_agregado', defaultSec: 30 },
    { name: '4. Corte de linha e inspeção visual', type: 'desperdicio', defaultSec: 10 }
  ]
};

export const TimeStudyModal: React.FC<TimeStudyModalProps> = ({
  operation,
  isOpen,
  onClose
}) => {
  const { categoriesConfig, getTimeStudy, saveTimeStudyAndApply, showToast } = useProduction();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'flow' | 'charts' | 'stats'>('flow');

  // Sequential Stopwatch state
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentCycleNumber, setCurrentCycleNumber] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Metadata & Parameters
  const [operatorName, setOperatorName] = useState<string>('');
  const [analystName, setAnalystName] = useState<string>('Eng. de Processos');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [errorMarginPct, setErrorMarginPct] = useState<number>(0.05); // 5%
  const [globalPaceRating, setGlobalPaceRating] = useState<number>(1.0); // 100%
  const [globalAllowancePct, setGlobalAllowancePct] = useState<number>(0.12); // 12% fadiga
  const [notes, setNotes] = useState<string>('');

  // Micro-operations list
  const [microOperations, setMicroOperations] = useState<MicroOperation[]>([]);

  // New Micro-operation input form
  const [newStepName, setNewStepName] = useState<string>('');
  const [newStepType, setNewStepType] = useState<LeanActionType>('valor_agregado');
  const [manualSecondsInput, setManualSecondsInput] = useState<Record<string, string>>({});

  // Initialize or Load Existing Study
  useEffect(() => {
    if (operation) {
      const existing = getTimeStudy(operation.id);
      if (existing && existing.microOperations && existing.microOperations.length > 0) {
        setMicroOperations(existing.microOperations);
        setOperatorName(existing.operatorName || '');
        setAnalystName(existing.analystName || 'Eng. de Processos');
        setConfidenceLevel(existing.stats?.confidenceLevel || 95);
        setErrorMarginPct(existing.stats?.errorMarginPct || 0.05);
        setGlobalPaceRating(existing.stats?.paceRating || 1.0);
        setGlobalAllowancePct(existing.stats?.allowancePercentage || 0.12);
        setNotes(existing.notes || '');
      } else {
        // Seed default micro-operations based on category or default template
        const preset = DEFAULT_PRESET_STEPS[operation.category] || DEFAULT_PRESET_STEPS.default;
        const seeded: MicroOperation[] = preset.map((p, idx) => {
          const sample: TimeStudySample = {
            id: `sample-${Date.now()}-${idx + 1}`,
            sampleIndex: 1,
            timeInSeconds: p.defaultSec,
            timeInMinutes: Number((p.defaultSec / 60).toFixed(3)),
            type: p.type,
            stepName: p.name,
            timestamp: new Date().toISOString()
          };
          const meanMin = sample.timeInMinutes;
          const normMin = meanMin * 1.0;
          const stdMin = Number((normMin * 1.12).toFixed(2));

          return {
            id: `micro-${Date.now()}-${idx + 1}`,
            orderIndex: idx + 1,
            name: p.name,
            type: p.type,
            samples: [sample],
            meanSeconds: p.defaultSec,
            meanMinutes: meanMin,
            paceRating: 1.0,
            allowancePercentage: 0.12,
            normalTimeMinutes: normMin,
            standardTimeMinutes: stdMin,
            standardTimeSeconds: stdMin * 60
          };
        });

        setMicroOperations(seeded);
        setOperatorName('');
        setGlobalPaceRating(1.0);
        setGlobalAllowancePct(0.12);
      }
      setIsStopwatchRunning(false);
      setElapsedMs(0);
      setCurrentStepIndex(0);
      setCurrentCycleNumber(1);
    }
  }, [operation, getTimeStudy]);

  // Stopwatch Interval
  useEffect(() => {
    if (isStopwatchRunning) {
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
  }, [isStopwatchRunning]);

  // Format Stopwatch Display mm:ss.ms
  const formatTimer = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  // Recompute MicroOperation Statistics
  const computeMicroOpStats = (
    step: MicroOperation,
    pace: number = globalPaceRating,
    allowance: number = globalAllowancePct
  ): MicroOperation => {
    const samples = step.samples || [];
    if (samples.length === 0) {
      return {
        ...step,
        meanSeconds: 0,
        meanMinutes: 0,
        normalTimeMinutes: 0,
        standardTimeMinutes: 0,
        standardTimeSeconds: 0
      };
    }

    const secSum = samples.reduce((acc, s) => acc + s.timeInSeconds, 0);
    const meanSec = secSum / samples.length;
    const meanMin = meanSec / 60;
    const normMin = meanMin * pace;
    const stdMin = Number((normMin * (1 + allowance)).toFixed(2));

    return {
      ...step,
      meanSeconds: Number(meanSec.toFixed(1)),
      meanMinutes: Number(meanMin.toFixed(3)),
      paceRating: pace,
      allowancePercentage: allowance,
      normalTimeMinutes: Number(normMin.toFixed(3)),
      standardTimeMinutes: stdMin,
      standardTimeSeconds: Number((stdMin * 60).toFixed(1))
    };
  };

  // Add a new Micro-operation
  const handleAddMicroOp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepName.trim()) {
      showToast('Informe o nome da micro-operação.', 'error');
      return;
    }

    const newOp: MicroOperation = {
      id: `micro-${Date.now()}-${microOperations.length + 1}`,
      orderIndex: microOperations.length + 1,
      name: newStepName.trim(),
      type: newStepType,
      samples: [],
      meanSeconds: 0,
      meanMinutes: 0,
      paceRating: globalPaceRating,
      allowancePercentage: globalAllowancePct,
      normalTimeMinutes: 0,
      standardTimeMinutes: 0,
      standardTimeSeconds: 0
    };

    setMicroOperations(prev => [...prev, newOp]);
    setNewStepName('');
    showToast(`Micro-operação "${newOp.name}" adicionada ao percurso!`, 'success');
  };

  // Delete Micro-operation
  const handleDeleteMicroOp = (id: string) => {
    setMicroOperations(prev =>
      prev
        .filter(op => op.id !== id)
        .map((op, idx) => ({ ...op, orderIndex: idx + 1 }))
    );
  };

  // Update Lean classification for a micro-operation
  const handleToggleStepType = (id: string) => {
    setMicroOperations(prev =>
      prev.map(op => {
        if (op.id === id) {
          const nextType: LeanActionType =
            op.type === 'valor_agregado'
              ? 'necessario'
              : op.type === 'necessario'
              ? 'desperdicio'
              : 'valor_agregado';
          return { ...op, type: nextType };
        }
        return op;
      })
    );
  };

  // Record Sequential Lap
  const handleRecordSequentialStep = () => {
    if (microOperations.length === 0) return;
    if (elapsedMs < 200) {
      showToast('Tempo muito curto (mínimo 0.2s).', 'error');
      return;
    }

    const currentStep = microOperations[currentStepIndex];
    if (!currentStep) return;

    const sec = elapsedMs / 1000;
    const min = sec / 60;

    const newSample: TimeStudySample = {
      id: `sample-${Date.now()}-${currentStep.samples.length + 1}`,
      sampleIndex: currentStep.samples.length + 1,
      timeInSeconds: Number(sec.toFixed(2)),
      timeInMinutes: Number(min.toFixed(3)),
      type: currentStep.type,
      stepId: currentStep.id,
      stepName: currentStep.name,
      cycleIndex: currentCycleNumber,
      timestamp: new Date().toISOString()
    };

    // Update the specific micro-operation with new sample
    const updatedStep = computeMicroOpStats({
      ...currentStep,
      samples: [...currentStep.samples, newSample]
    });

    const nextOperations = [...microOperations];
    nextOperations[currentStepIndex] = updatedStep;
    setMicroOperations(nextOperations);

    // Reset stopwatch for next step
    setElapsedMs(0);
    startTimeRef.current = Date.now();

    // Advance to next step or complete cycle
    if (currentStepIndex + 1 < microOperations.length) {
      setCurrentStepIndex(prev => prev + 1);
      showToast(`Passo #${currentStepIndex + 1} gravado (${sec.toFixed(1)}s). Próximo: ${microOperations[currentStepIndex + 1].name}`, 'info');
    } else {
      // Completed full cycle!
      setCurrentStepIndex(0);
      setCurrentCycleNumber(prev => prev + 1);
      showToast(`🎉 Ciclo #${currentCycleNumber} completo finalizado! Iniciando próximo ciclo.`, 'success');
    }
  };

  // Add Manual Time to a Micro-operation
  const handleAddManualTimeToStep = (stepId: string) => {
    const secStr = manualSecondsInput[stepId];
    const sec = parseFloat(secStr);
    if (isNaN(sec) || sec <= 0) {
      showToast('Informe um tempo válido em segundos.', 'error');
      return;
    }

    setMicroOperations(prev =>
      prev.map(op => {
        if (op.id === stepId) {
          const sample: TimeStudySample = {
            id: `sample-${Date.now()}-${op.samples.length + 1}`,
            sampleIndex: op.samples.length + 1,
            timeInSeconds: Number(sec.toFixed(2)),
            timeInMinutes: Number((sec / 60).toFixed(3)),
            type: op.type,
            stepId: op.id,
            stepName: op.name,
            timestamp: new Date().toISOString()
          };
          return computeMicroOpStats({
            ...op,
            samples: [...op.samples, sample]
          });
        }
        return op;
      })
    );

    setManualSecondsInput(prev => ({ ...prev, [stepId]: '' }));
    showToast(`Tempo de ${sec}s adicionado à micro-operação.`, 'success');
  };

  // Global Consolidated Calculations: Sum of all Micro-operations
  const totalStats: TimeStudyStats = useMemo(() => {
    const totalStandardMinutes = microOperations.reduce((sum, op) => sum + op.standardTimeMinutes, 0);
    const totalStandardSeconds = totalStandardMinutes * 60;

    let totalVaMin = 0;
    let totalNnvaMin = 0;
    let totalNvaMin = 0;

    microOperations.forEach(op => {
      if (op.type === 'valor_agregado') totalVaMin += op.standardTimeMinutes;
      else if (op.type === 'necessario') totalNnvaMin += op.standardTimeMinutes;
      else if (op.type === 'desperdicio') totalNvaMin += op.standardTimeMinutes;
    });

    const sumMinutes = totalVaMin + totalNnvaMin + totalNvaMin;
    const vaRatio = sumMinutes > 0 ? (totalVaMin / sumMinutes) * 100 : 0;
    const nnvaRatio = sumMinutes > 0 ? (totalNnvaMin / sumMinutes) * 100 : 0;
    const nvaRatio = sumMinutes > 0 ? (totalNvaMin / sumMinutes) * 100 : 0;

    // Cycle samples count (max samples in any step)
    const maxSamples = Math.max(1, ...microOperations.map(op => op.samples.length));
    const meanTotalMinutes = microOperations.reduce((sum, op) => sum + op.meanMinutes, 0);

    // Statistical Sizing N' = [ (z * s) / (e * x̄) ]^2
    const z = Z_VALUES[confidenceLevel] || 1.96;
    const e = errorMarginPct;
    // Approximated cycle standard deviation
    const stdDevSum = Math.sqrt(
      microOperations.reduce((acc, op) => {
        if (op.samples.length <= 1) return acc;
        const mean = op.meanMinutes;
        const variance = op.samples.reduce((s, x) => s + Math.pow(x.timeInMinutes - mean, 2), 0) / (op.samples.length - 1);
        return acc + variance;
      }, 0)
    );

    let requiredSamples = 1;
    if (meanTotalMinutes > 0 && stdDevSum > 0) {
      const exactN = Math.pow((z * stdDevSum) / (e * meanTotalMinutes), 2);
      requiredSamples = Math.max(1, Math.ceil(exactN));
    }

    const isStatisticallyValid = maxSamples >= requiredSamples;

    return {
      meanMinutes: Number(meanTotalMinutes.toFixed(3)),
      meanSeconds: Number((meanTotalMinutes * 60).toFixed(1)),
      stdDevMinutes: Number(stdDevSum.toFixed(4)),
      variance: Number(Math.pow(stdDevSum, 2).toFixed(4)),
      minMinutes: 0,
      maxMinutes: 0,
      sampleCount: maxSamples,
      zValue: z,
      confidenceLevel,
      errorMarginPct,
      requiredSamples,
      isStatisticallyValid,
      remainingSamplesNeeded: Math.max(0, requiredSamples - maxSamples),
      vaMinutes: Number(totalVaMin.toFixed(2)),
      nnvaMinutes: Number(totalNnvaMin.toFixed(2)),
      nvaMinutes: Number(totalNvaMin.toFixed(2)),
      vaRatio: Number(vaRatio.toFixed(1)),
      nnvaRatio: Number(nnvaRatio.toFixed(1)),
      nvaRatio: Number(nvaRatio.toFixed(1)),
      paceRating: globalPaceRating,
      allowancePercentage: globalAllowancePct,
      totalStandardTimeMinutes: Number(totalStandardMinutes.toFixed(2)),
      totalStandardTimeSeconds: Number(totalStandardSeconds.toFixed(1))
    };
  }, [microOperations, confidenceLevel, errorMarginPct, globalPaceRating, globalAllowancePct]);

  // Update pace and allowance across all micro-operations
  const handleUpdateGlobalPaceAndAllowance = (pace: number, allowance: number) => {
    setGlobalPaceRating(pace);
    setGlobalAllowancePct(allowance);
    setMicroOperations(prev =>
      prev.map(op => computeMicroOpStats(op, pace, allowance))
    );
  };

  // Chart data for Micro-operations Breakdown (Kaizen & Bottleneck analysis)
  const microOpsChartData = useMemo(() => {
    const total = totalStats.totalStandardTimeMinutes || 1;
    return microOperations.map(op => {
      const pct = Number(((op.standardTimeMinutes / total) * 100).toFixed(1));
      return {
        name: op.name.length > 28 ? op.name.substring(0, 26) + '...' : op.name,
        fullName: op.name,
        timeMin: Number(op.standardTimeMinutes.toFixed(2)),
        timeSec: Number(op.standardTimeSeconds.toFixed(1)),
        sharePct: pct,
        type: op.type,
        color:
          op.type === 'valor_agregado'
            ? '#10b981'
            : op.type === 'necessario'
            ? '#f59e0b'
            : '#f43f5e'
      };
    });
  }, [microOperations, totalStats.totalStandardTimeMinutes]);

  if (!isOpen || !operation) return null;

  const config = categoriesConfig[operation.category];

  // Save Study & Apply Consolidated Sum
  const handleSaveAndApply = async (applyToOperation: boolean = true) => {
    if (microOperations.length === 0) {
      showToast('Cadastre ao menos uma micro-operação no percurso.', 'error');
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
      microOperations,
      stats: totalStats,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveTimeStudyAndApply(study, applyToOperation);

    if (applyToOperation) {
      try {
        confetti({
          particleCount: 70,
          spread: 75,
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

  const currentActiveStep = microOperations[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: `${config.colorHex}20`,
                borderColor: `${config.colorHex}40`,
                color: config.colorHex
              }}
            >
              <Workflow className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Mapeamento de Micro-operações & Cronoanálise
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
                Operação: <strong className="text-slate-200">{operation.name}</strong> &bull; Tempo Catálogo: {operation.time.toFixed(2)} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-2 border-b border-slate-800 bg-slate-950/30">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('flow')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'flow'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              Percurso & Cronômetro Sequencial ({microOperations.length} etapas)
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'charts'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Gráfico de Gargalos & Kaizen
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'stats'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-4 h-4" />
              Estatística Amostral N&apos;
            </button>
          </div>

          {/* Consolidated Time Badge in Tab Bar */}
          <div className="hidden sm:flex items-center gap-2 pb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Soma das Micro-etapas:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
              {totalStats.totalStandardTimeMinutes.toFixed(2)} min ({totalStats.totalStandardTimeSeconds.toFixed(0)}s)
            </span>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          
          {/* TAB 1: FLOW & SEQUENTIAL STOPWATCH */}
          {activeTab === 'flow' && (
            <div className="space-y-6">
              
              {/* Sequential Stopwatch Console */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                
                {/* Active Step Info & Progress */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Cronômetro Sequencial de Percurso &bull; Ciclo #{currentCycleNumber}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      Passo {currentStepIndex + 1} de {microOperations.length}
                    </span>
                  </div>

                  {/* Active Step Box */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                        {currentStepIndex + 1}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">
                          {currentActiveStep ? currentActiveStep.name : 'Nenhuma etapa cadastrada'}
                        </span>
                        {currentActiveStep && (
                          <span className={`text-[10px] font-bold ${leanBadges[currentActiveStep.type].color}`}>
                            {leanBadges[currentActiveStep.type].label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">Tempo Atual da Etapa:</span>
                      <strong className="text-xs font-mono text-emerald-300">
                        {currentActiveStep?.standardTimeMinutes.toFixed(2)} min
                      </strong>
                    </div>
                  </div>

                  {/* Step Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${microOperations.length > 0 ? ((currentStepIndex + 1) / microOperations.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Digital Counter & Buttons */}
                <div className="flex flex-col items-center justify-center gap-3 shrink-0">
                  <div className="font-mono text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                    {formatTimer(elapsedMs)}
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 active:scale-95 ${
                        isStopwatchRunning
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                      }`}
                    >
                      {isStopwatchRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{isStopwatchRunning ? 'Pausar' : 'Iniciar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRecordSequentialStep}
                      disabled={elapsedMs === 0 || microOperations.length === 0}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Zap className="w-4 h-4" />
                      <span>
                        {currentStepIndex + 1 === microOperations.length
                          ? 'Concluir Ciclo 🎉'
                          : 'Gravar & Próxima Etapa'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsStopwatchRunning(false);
                        setElapsedMs(0);
                      }}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Zerar cronômetro atual"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Add New Micro-operation Form */}
              <form onSubmit={handleAddMicroOp} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    required
                    value={newStepName}
                    onChange={e => setNewStepName(e.target.value)}
                    placeholder="Adicionar nova micro-etapa (ex: 7. Inspecionar costura da alça)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={newStepType}
                    onChange={e => setNewStepType(e.target.value as LeanActionType)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="valor_agregado">Valor Agregado (VA)</option>
                    <option value="necessario">Necessário (NNVA)</option>
                    <option value="desperdicio">Desperdício (NVA)</option>
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </form>

              {/* Micro-operations Table */}
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Micro-operação (Elemento de Trabalho)</th>
                        <th className="py-3 px-4 text-center">Classificação Lean</th>
                        <th className="py-3 px-4 text-center">Tomadas</th>
                        <th className="py-3 px-4 text-right">Tempo Cronometrado</th>
                        <th className="py-3 px-4 text-right">Tempo Padrão (TP)</th>
                        <th className="py-3 px-4 text-right">% do Bag</th>
                        <th className="py-3 px-4 text-right">Manual</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {microOperations.map((op, idx) => {
                        const badge = leanBadges[op.type];
                        const isCurrent = currentStepIndex === idx;
                        const share = totalStats.totalStandardTimeMinutes > 0
                          ? ((op.standardTimeMinutes / totalStats.totalStandardTimeMinutes) * 100).toFixed(1)
                          : '0.0';

                        return (
                          <tr
                            key={op.id}
                            className={`transition-colors ${
                              isCurrent ? 'bg-cyan-950/20 border-l-4 border-cyan-400' : 'hover:bg-slate-800/30'
                            }`}
                          >
                            {/* Step Order */}
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                              {op.orderIndex}
                            </td>

                            {/* Name */}
                            <td className="py-3 px-4">
                              <span className="font-semibold text-white block">
                                {op.name}
                              </span>
                            </td>

                            {/* Lean Classification */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleStepType(op.id)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${badge.bg} ${badge.color} ${badge.border}`}
                                title="Clique para alternar VA / NNVA / NVA"
                              >
                                {op.type === 'valor_agregado' ? '🟢 VA' : op.type === 'necessario' ? '🟡 NNVA' : '🔴 NVA'}
                              </button>
                            </td>

                            {/* Sample count */}
                            <td className="py-3 px-4 text-center font-mono text-slate-400">
                              {op.samples.length} tomadas
                            </td>

                            {/* Mean Cronometrado */}
                            <td className="py-3 px-4 text-right font-mono text-slate-300">
                              <strong>{op.meanSeconds.toFixed(1)}s</strong>
                              <span className="text-[10px] text-slate-500 block">
                                ({op.meanMinutes.toFixed(3)}m)
                              </span>
                            </td>

                            {/* Standard Time TP */}
                            <td className="py-3 px-4 text-right font-mono">
                              <strong className="text-emerald-300 text-sm">
                                {op.standardTimeMinutes.toFixed(2)} min
                              </strong>
                              <span className="text-[10px] text-slate-500 block">
                                ({op.standardTimeSeconds.toFixed(1)}s)
                              </span>
                            </td>

                            {/* Share % */}
                            <td className="py-3 px-4 text-right font-mono text-slate-400">
                              {share}%
                            </td>

                            {/* Manual Time Input */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder="s"
                                  value={manualSecondsInput[op.id] || ''}
                                  onChange={e =>
                                    setManualSecondsInput({
                                      ...manualSecondsInput,
                                      [op.id]: e.target.value
                                    })
                                  }
                                  className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-white text-right font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddManualTimeToStep(op.id)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold border border-slate-700"
                                  title="Adicionar medição manual"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Delete */}
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteMicroOp(op.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                                title="Remover micro-operação"
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

            </div>
          )}

          {/* TAB 2: CHARTS & KAIZEN ANALYSIS */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              
              {/* Micro-operations Horizontal Bar Chart */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      Gargalos e Tempos por Micro-operação
                    </h3>
                    <p className="text-xs text-slate-400">
                      Identificação visual de onde está concentrado o tempo e os desperdícios (NVA/NNVA)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Valor Agregado
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Necessário
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Desperdício
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={microOpsChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        width={180}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val: any) => [`${val} min`, 'Tempo Padrão']}
                      />
                      <Bar dataKey="timeMin" radius={[0, 6, 6, 0]}>
                        {microOpsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lean Breakdown Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
                  <span className="text-[11px] font-bold uppercase text-emerald-400 block">
                    🟢 Valor Agregado (VA)
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold font-mono text-emerald-300">
                      {totalStats.vaMinutes.toFixed(2)} min
                    </span>
                    <span className="text-xs text-emerald-400 font-mono">({totalStats.vaRatio}%)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Costura efetiva e montagem</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40">
                  <span className="text-[11px] font-bold uppercase text-amber-400 block">
                    🟡 Necessário (NNVA)
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold font-mono text-amber-300">
                      {totalStats.nnvaMinutes.toFixed(2)} min
                    </span>
                    <span className="text-xs text-amber-400 font-mono">({totalStats.nnvaRatio}%)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Posicionamento e manuseio</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40">
                  <span className="text-[11px] font-bold uppercase text-rose-400 block">
                    🔴 Desperdício (NVA)
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold font-mono text-rose-300">
                      {totalStats.nvaMinutes.toFixed(2)} min
                    </span>
                    <span className="text-xs text-rose-400 font-mono">({totalStats.nvaRatio}%)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Oportunidade imediata de Kaizen</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: STATISTICAL SIZING */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    Cálculo da Precisão Estatística do Estudo
                  </h3>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold border ${
                      totalStats.isStatisticallyValid
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                        : 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                    }`}
                  >
                    {totalStats.isStatisticallyValid ? '✓ Amostragem Válida' : `Faltam ${totalStats.remainingSamplesNeeded} ciclos`}
                  </span>
                </div>

                {/* Formula display */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="font-mono text-base text-cyan-300 font-bold">
                    N&apos; = [ (z &middot; s) / (e &middot; x̄) ]&sup2;
                  </div>
                  <div className="text-xs text-slate-300 font-mono">
                    z = {totalStats.zValue} ({totalStats.confidenceLevel}%) &bull; e = {(totalStats.errorMarginPct * 100).toFixed(0)}% &bull; s = {totalStats.stdDevMinutes.toFixed(3)}m
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Ciclos Realizados</span>
                    <span className="text-lg font-bold font-mono text-white">{totalStats.sampleCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Recomendado (N&apos;)</span>
                    <span className="text-lg font-bold font-mono text-cyan-300">{totalStats.requiredSamples}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Desvio Padrão Acumulado</span>
                    <span className="text-lg font-bold font-mono text-slate-200">&plusmn;{totalStats.stdDevMinutes.toFixed(3)} min</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Global Bottom Synthesis Bar */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Pace & Allowance Sliders */}
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Ritmo (Velocidade):</span>
                <strong className="font-mono text-cyan-300 ml-1">{(globalPaceRating * 100).toFixed(0)}%</strong>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.30"
                step="0.05"
                value={globalPaceRating}
                onChange={e => handleUpdateGlobalPaceAndAllowance(parseFloat(e.target.value), globalAllowancePct)}
                className="w-28 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Fadiga / Tolerância:</span>
                <strong className="font-mono text-amber-300 ml-1">{(globalAllowancePct * 100).toFixed(0)}%</strong>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.30"
                step="0.01"
                value={globalAllowancePct}
                onChange={e => handleUpdateGlobalPaceAndAllowance(globalPaceRating, parseFloat(e.target.value))}
                className="w-28 accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Consolidated Total & Action Buttons */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Novo Tempo da Operação (∑ Micro-etapas):
              </span>
              <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono">
                {totalStats.totalStandardTimeMinutes.toFixed(2)} <span className="text-sm font-bold text-teal-400">min</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveAndApply(false)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Salvar Estudo
              </button>

              <button
                type="button"
                onClick={() => handleSaveAndApply(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Aplicar Soma à Operação</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
