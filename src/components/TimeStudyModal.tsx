'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import {
  OperationItem,
  LeanActionType,
  MicroOperation,
  TimeStudySample,
  TimeStudyStats,
  TimeStudy,
  StatisticalReliabilityLevel,
  OperationTimeHistoryEntry
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
  BarChart3,
  ListOrdered,
  Workflow,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Target,
  FileCode2,
  Calculator,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Coffee,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
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
  const { categoriesConfig, getTimeStudy, saveTimeStudyAndApply, updateOperationHistory, showToast } = useProduction();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'flow' | 'stats' | 'charts'>('flow');

  // Show / Hide Memorial de Cálculo
  const [showMemorial, setShowMemorial] = useState<boolean>(true);

  // Metadata & Parameters
  const [operatorName, setOperatorName] = useState<string>('');
  const [analystName, setAnalystName] = useState<string>('Eng. de Processos');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [errorMarginPct, setErrorMarginPct] = useState<number>(0.05); // 5%
  const [notes, setNotes] = useState<string>('');

  // Kaizen Cycle Reset Modal State
  const [isKaizenModalOpen, setIsKaizenModalOpen] = useState<boolean>(false);
  const [kaizenActionDescription, setKaizenActionDescription] = useState<string>('');

  // Bulk Apply Modal/Popover state
  const [showBulkAdjust, setShowBulkAdjust] = useState<boolean>(false);
  const [bulkPace, setBulkPace] = useState<number>(1.0);
  const [bulkAllowance, setBulkAllowance] = useState<number>(0.12);

  // Micro-operations list
  const [microOperations, setMicroOperations] = useState<MicroOperation[]>([]);

  // Per-Micro-operation Mini-stopwatch timers state: { [stepId]: { isRunning: boolean, elapsedMs: number } }
  const [timers, setTimers] = useState<Record<string, { isRunning: boolean; elapsedMs: number }>>({});
  const timerRefs = useRef<Record<string, { interval: NodeJS.Timeout | null; startTime: number }>>({});

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
        setNotes(existing.notes || '');
      } else {
        // Seed default micro-operations
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
      }

      // Reset all mini-stopwatches
      setTimers({});
    }
  }, [operation, getTimeStudy]);

  // Clean up all timer intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(t => {
        if (t.interval) clearInterval(t.interval);
      });
    };
  }, []);

  // Format Mini-Stopwatch Display (e.g. "14.8s" or "01:14.8")
  const formatMiniTimer = (ms: number) => {
    const totalSec = ms / 1000;
    if (totalSec < 60) {
      return `${totalSec.toFixed(1)}s`;
    }
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(1);
    return `${mins}m ${secs}s`;
  };

  // Mini-Stopwatch Actions per step
  const handleToggleTimer = (stepId: string) => {
    const current = timers[stepId] || { isRunning: false, elapsedMs: 0 };

    if (current.isRunning) {
      // Pause
      if (timerRefs.current[stepId]?.interval) {
        clearInterval(timerRefs.current[stepId].interval!);
      }
      setTimers(prev => ({
        ...prev,
        [stepId]: { ...current, isRunning: false }
      }));
    } else {
      // Start
      const startTime = Date.now() - current.elapsedMs;
      timerRefs.current[stepId] = {
        startTime,
        interval: setInterval(() => {
          setTimers(prev => {
            const t = prev[stepId] || { isRunning: true, elapsedMs: 0 };
            return {
              ...prev,
              [stepId]: { ...t, elapsedMs: Date.now() - startTime }
            };
          });
        }, 50)
      };

      setTimers(prev => ({
        ...prev,
        [stepId]: { isRunning: true, elapsedMs: current.elapsedMs }
      }));
    }
  };

  const handleResetTimer = (stepId: string) => {
    if (timerRefs.current[stepId]?.interval) {
      clearInterval(timerRefs.current[stepId].interval!);
    }
    setTimers(prev => ({
      ...prev,
      [stepId]: { isRunning: false, elapsedMs: 0 }
    }));
  };

  // Record lap from mini-stopwatch into step samples
  const handleRecordStepLap = (step: MicroOperation) => {
    const timer = timers[step.id];
    if (!timer || timer.elapsedMs < 200) {
      showToast('Tempo muito curto no cronômetro (mínimo 0.2s).', 'error');
      return;
    }

    const sec = timer.elapsedMs / 1000;
    const min = sec / 60;

    const newSample: TimeStudySample = {
      id: `sample-${Date.now()}-${step.samples.length + 1}`,
      sampleIndex: step.samples.length + 1,
      timeInSeconds: Number(sec.toFixed(2)),
      timeInMinutes: Number(min.toFixed(3)),
      type: step.type,
      stepId: step.id,
      stepName: step.name,
      timestamp: new Date().toISOString()
    };

    const updatedStep = computeMicroOpStats({
      ...step,
      samples: [...step.samples, newSample]
    });

    setMicroOperations(prev =>
      prev.map(op => (op.id === step.id ? updatedStep : op))
    );

    // Reset stopwatch for this step
    handleResetTimer(step.id);
    showToast(`Tomada #${newSample.sampleIndex} gravada para "${step.name}" (${sec.toFixed(1)}s)!`, 'success');
  };

  // Recompute MicroOperation Statistics
  const computeMicroOpStats = (
    step: MicroOperation,
    pace: number = step.paceRating || 1.0,
    allowance: number = step.allowancePercentage || 0.12
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

  // Update Pace or Allowance for a specific Micro-Operation
  const handleUpdateStepPaceAndAllowance = (
    stepId: string,
    newPace?: number,
    newAllowance?: number
  ) => {
    setMicroOperations(prev =>
      prev.map(op => {
        if (op.id === stepId) {
          const pace = newPace !== undefined ? newPace : op.paceRating || 1.0;
          const allowance = newAllowance !== undefined ? newAllowance : op.allowancePercentage || 0.12;
          return computeMicroOpStats(op, pace, allowance);
        }
        return op;
      })
    );
  };

  // Bulk Apply Pace & Allowance to all micro-operations
  const handleBulkApplyPaceAndAllowance = () => {
    setMicroOperations(prev =>
      prev.map(op => computeMicroOpStats(op, bulkPace, bulkAllowance))
    );
    setShowBulkAdjust(false);
    showToast(`Ritmo (${(bulkPace * 100).toFixed(0)}%) e Fadiga (${(bulkAllowance * 100).toFixed(0)}%) aplicados a todas as etapas!`, 'success');
  };

  // ==============================================================================
  // KAIZEN IMPROVEMENT CYCLE RESET (START NEW METHOD FROM SAMPLE #1)
  // ==============================================================================
  const handleStartKaizenCycle = async () => {
    if (!operation) return;

    const actionText = kaizenActionDescription.trim() || 'Nova Melhoria Kaizen de Processo';

    // 1. If operation has historical entries, archive the current baseline point
    if (operation.history && operation.history.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const hasTodayBaseline = operation.history.some(h => h.date === today);
      if (!hasTodayBaseline) {
        const baselinePoint: OperationTimeHistoryEntry = {
          id: `hist-pre-kaizen-${Date.now()}`,
          operationId: operation.id,
          time: operation.time,
          date: today,
          notes: `Método anterior ao Kaizen (${operation.time.toFixed(2)} min)`,
          source: 'cronoanalise'
        };
        await updateOperationHistory(operation.id, [...operation.history, baselinePoint]);
      }
    }

    // 2. Clear samples across all micro-operations to start clean at Sample #1
    setMicroOperations(prev =>
      prev.map(op => ({
        ...op,
        samples: [],
        meanSeconds: 0,
        meanMinutes: 0,
        normalTimeMinutes: 0,
        standardTimeMinutes: 0,
        standardTimeSeconds: 0
      }))
    );

    // 3. Set the Kaizen notes and reset stopwatches
    setNotes(actionText);
    setTimers({});

    // 4. Close Kaizen modal and celebrate
    setIsKaizenModalOpen(false);
    setKaizenActionDescription('');

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    showToast('✨ Novo Ciclo Kaizen iniciado! As medições anteriores foram arquivadas. A próxima medição será a Tomada #1.', 'success');
  };

  // Reset samples for a single micro-operation (partial Kaizen)
  const handleResetSingleStepSamples = (stepId: string) => {
    handleResetTimer(stepId);
    setMicroOperations(prev =>
      prev.map(op => {
        if (op.id === stepId) {
          return {
            ...op,
            samples: [],
            meanSeconds: 0,
            meanMinutes: 0,
            normalTimeMinutes: 0,
            standardTimeMinutes: 0,
            standardTimeSeconds: 0
          };
        }
        return op;
      })
    );
    showToast('Amostras da micro-etapa resetadas para iniciar novo método.', 'info');
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
      paceRating: 1.0,
      allowancePercentage: 0.12,
      normalTimeMinutes: 0,
      standardTimeMinutes: 0,
      standardTimeSeconds: 0
    };

    setMicroOperations(prev => [...prev, newOp]);
    setNewStepName('');
    showToast(`Micro-operação "${newOp.name}" adicionada!`, 'success');
  };

  // Delete Micro-operation
  const handleDeleteMicroOp = (id: string) => {
    handleResetTimer(id);
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
    showToast(`Tempo manual de ${sec}s adicionado à micro-etapa.`, 'success');
  };

  // Remove individual sample from a micro-operation
  const handleDeleteSample = (stepId: string, sampleId: string) => {
    setMicroOperations(prev =>
      prev.map(op => {
        if (op.id === stepId) {
          const filtered = op.samples.filter(s => s.id !== sampleId);
          return computeMicroOpStats({
            ...op,
            samples: filtered
          });
        }
        return op;
      })
    );
  };

  // ==============================================================================
  // RIGOROUS INDUSTRIAL STATISTICAL ANALYSIS ENGINE
  // ==============================================================================
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
    const nvaRatio = sumMinutes > 0 ? (totalNnvaMin / sumMinutes) * 100 : 0;

    // Minimum samples across all steps (limiting factor)
    const minSamplesInSteps = microOperations.length > 0
      ? Math.min(...microOperations.map(op => op.samples.length))
      : 0;

    const meanTotalMinutes = microOperations.reduce((sum, op) => sum + op.meanMinutes, 0);

    // Critical value z
    const z = Z_VALUES[confidenceLevel] || 1.96;
    const targetError = errorMarginPct; // e.g. 0.05 (5%)

    // Standard deviation computation across steps
    let stdDevSum = 0;
    if (minSamplesInSteps >= 2) {
      stdDevSum = Math.sqrt(
        microOperations.reduce((acc, op) => {
          if (op.samples.length <= 1) return acc;
          const mean = op.meanMinutes;
          const variance = op.samples.reduce((s, x) => s + Math.pow(x.timeInMinutes - mean, 2), 0) / (op.samples.length - 1);
          return acc + variance;
        }, 0)
      );
    }

    // Effective standard deviation for statistical sizing:
    let effectiveStdDev = stdDevSum;
    let cvPct = 0;

    if (minSamplesInSteps === 0) {
      effectiveStdDev = 0;
      cvPct = 0;
    } else if (minSamplesInSteps === 1) {
      effectiveStdDev = meanTotalMinutes * 0.10; // Benchmark 10%
      cvPct = 10;
    } else {
      cvPct = meanTotalMinutes > 0 ? (stdDevSum / meanTotalMinutes) * 100 : 0;
      effectiveStdDev = Math.max(stdDevSum, meanTotalMinutes * 0.03); // Minimum 3% to avoid collapse
    }

    // Statistical Sizing N' = [ (z * s) / (e * x̄) ]^2
    let requiredSamples = 5; // Absolute minimum industrial pilot
    if (meanTotalMinutes > 0 && effectiveStdDev > 0) {
      const exactN = Math.pow((z * effectiveStdDev) / (targetError * meanTotalMinutes), 2);
      requiredSamples = Math.max(5, Math.ceil(exactN));
    }

    // Current Achieved Relative Error with current n
    let currentAchievedErrorPct = 100;
    if (minSamplesInSteps === 1) {
      currentAchievedErrorPct = 39.2;
    } else if (minSamplesInSteps >= 2 && meanTotalMinutes > 0) {
      const exactE = (z * effectiveStdDev) / (Math.sqrt(minSamplesInSteps) * meanTotalMinutes);
      currentAchievedErrorPct = Number((exactE * 100).toFixed(1));
    }

    // Statistical Validity: ONLY valid if AT LEAST 5 samples exist AND n >= N' AND error <= targetError
    const isStatisticallyValid =
      minSamplesInSteps >= 5 &&
      minSamplesInSteps >= requiredSamples &&
      currentAchievedErrorPct <= (targetError * 100);

    const remainingSamplesNeeded = Math.max(0, requiredSamples - minSamplesInSteps);

    // Human-readable Reliability Assessment
    let reliabilityLevel: StatisticalReliabilityLevel = 'amostragem_inicial';
    let reliabilityLabel = 'Amostragem Inicial (1 tomada - Insuficiente)';
    let reliabilityRecommendation = `Com apenas ${minSamplesInSteps} tomada, não há dados suficientes para certificar a repetibilidade. Para atingir o Padrão Industrial (95% Confiança / ±5% Erro), são necessárias ${requiredSamples} tomadas no total (faltam ${remainingSamplesNeeded}).`;

    if (minSamplesInSteps === 0) {
      reliabilityLevel = 'amostragem_inicial';
      reliabilityLabel = 'Sem Amostras Gravadas (Novo Método)';
      reliabilityRecommendation = 'Inicie cronometrando cada micro-operação com o mini-cronômetro para iniciar o estudo do novo método Kaizen.';
    } else if (minSamplesInSteps === 1) {
      reliabilityLevel = 'amostragem_inicial';
      reliabilityLabel = 'Amostragem Inicial (1 tomada do Novo Método)';
      reliabilityRecommendation = `Primeira medição registrada! O desvio padrão é preliminar (margem de erro estimada em ±${currentAchievedErrorPct}%). Colete ao menos ${requiredSamples} tomadas para certificar o Padrão Industrial (faltam ${remainingSamplesNeeded}).`;
    } else if (minSamplesInSteps < 5) {
      reliabilityLevel = 'amostragem_inicial';
      reliabilityLabel = `Amostragem Preliminar (${minSamplesInSteps} tomadas)`;
      reliabilityRecommendation = `Com ${minSamplesInSteps} tomadas do novo método, a margem de erro atual é de ±${currentAchievedErrorPct}%. Colete mais ${remainingSamplesNeeded} tomada(s) para atingir o Padrão Industrial (total recomendado: ${requiredSamples}).`;
    } else if (isStatisticallyValid) {
      reliabilityLevel = 'padrao_industrial';
      reliabilityLabel = '✅ Padrão Industrial Certificado (95% Confiança, erro ≤ 5%)';
      reliabilityRecommendation = `Excelente! Com ${minSamplesInSteps} tomadas, o novo método atingiu o rigor estatístico exigido pela engenharia de produção (margem de erro de ±${currentAchievedErrorPct}%).`;
    } else if (currentAchievedErrorPct <= 10) {
      reliabilityLevel = 'confiabilidade_media';
      reliabilityLabel = `Confiabilidade Intermediária (Margem de erro: ±${currentAchievedErrorPct}%)`;
      reliabilityRecommendation = `Boa aproximação inicial (erro de ±${currentAchievedErrorPct}%), mas faltam ${remainingSamplesNeeded} tomada(s) para atingir a certificação de alta precisão (±5%).`;
    } else {
      reliabilityLevel = 'baixa_confiabilidade';
      reliabilityLabel = `Variação Detectada (Margem de erro: ±${currentAchievedErrorPct}%)`;
      reliabilityRecommendation = `Há oscilação entre as tomadas (CV = ${cvPct.toFixed(1)}%). São necessárias mais ${remainingSamplesNeeded} tomadas para estabilizar a média do novo ciclo.`;
    }

    // Average Pace and Allowance across micro-operations
    const avgPace = microOperations.length > 0
      ? microOperations.reduce((sum, op) => sum + (op.paceRating || 1.0), 0) / microOperations.length
      : 1.0;
    const avgAllowance = microOperations.length > 0
      ? microOperations.reduce((sum, op) => sum + (op.allowancePercentage || 0.12), 0) / microOperations.length
      : 0.12;

    return {
      meanMinutes: Number(meanTotalMinutes.toFixed(3)),
      meanSeconds: Number((meanTotalMinutes * 60).toFixed(1)),
      stdDevMinutes: Number(stdDevSum.toFixed(4)),
      variance: Number(Math.pow(stdDevSum, 2).toFixed(4)),
      coefficientOfVariationPct: minSamplesInSteps >= 2 ? Number(cvPct.toFixed(1)) : 0,
      minMinutes: 0,
      maxMinutes: 0,
      sampleCount: minSamplesInSteps,
      zValue: z,
      confidenceLevel,
      errorMarginPct: targetError,
      currentAchievedErrorPct,
      requiredSamples,
      isStatisticallyValid,
      remainingSamplesNeeded,
      reliabilityLevel,
      reliabilityLabel,
      reliabilityRecommendation,
      vaMinutes: Number(totalVaMin.toFixed(2)),
      nnvaMinutes: Number(totalNnvaMin.toFixed(2)),
      nvaMinutes: Number(totalNvaMin.toFixed(2)),
      vaRatio: Number(vaRatio.toFixed(1)),
      nnvaRatio: Number(nnvaRatio.toFixed(1)),
      nvaRatio: Number(nvaRatio.toFixed(1)),
      paceRating: avgPace,
      allowancePercentage: avgAllowance,
      totalStandardTimeMinutes: Number(totalStandardMinutes.toFixed(2)),
      totalStandardTimeSeconds: Number(totalStandardSeconds.toFixed(1))
    };
  }, [microOperations, confidenceLevel, errorMarginPct]);

  // ==============================================================================
  // COMPARATIVE MATRIX OF CONFIDENCE LEVELS (Quantas amostras para cada nível)
  // ==============================================================================
  const confidenceMatrix = useMemo(() => {
    const n = totalStats.sampleCount;
    const mean = totalStats.meanMinutes;
    const s = totalStats.stdDevMinutes;

    const effectiveS = n >= 2 ? Math.max(s, mean * 0.03) : mean * 0.10;

    const levels = [
      {
        key: 'preliminar',
        name: 'Nível Preliminar / Rápido',
        confidence: 90,
        z: 1.645,
        errorPct: 0.10, // 10%
        minPilot: 3,
        desc: 'Para estudos rápidos e estimativas preliminares de fábrica',
        badge: 'bg-blue-950/60 text-blue-300 border-blue-800/60'
      },
      {
        key: 'industrial',
        name: 'Padrão Industrial (Recomendado)',
        confidence: 95,
        z: 1.96,
        errorPct: 0.05, // 5%
        minPilot: 5,
        desc: 'Padrão ouro exigido pela engenharia de produção e Lean Manufacturing',
        isRecommended: true,
        badge: 'bg-emerald-950 text-emerald-300 border-emerald-500/70 shadow-sm ring-1 ring-emerald-500/30'
      },
      {
        key: 'alta_precisao',
        name: 'Alta Precisão / Processo Crítico',
        confidence: 99,
        z: 2.576,
        errorPct: 0.05, // 5%
        minPilot: 8,
        desc: 'Para gargalos críticos de linha e auditorias rigorosas',
        badge: 'bg-purple-950/60 text-purple-300 border-purple-800/60'
      },
      {
        key: 'classe_mundial',
        name: 'Classe Mundial / Seis Sigma',
        confidence: 99,
        z: 2.576,
        errorPct: 0.02, // 2%
        minPilot: 15,
        desc: 'Precisão máxima para produção em altíssima escala',
        badge: 'bg-amber-950/60 text-amber-300 border-amber-800/60'
      }
    ];

    return levels.map(lvl => {
      let reqN = lvl.minPilot;
      if (mean > 0 && effectiveS > 0) {
        const exactN = Math.pow((lvl.z * effectiveS) / (lvl.errorPct * mean), 2);
        reqN = Math.max(lvl.minPilot, Math.ceil(exactN));
      }

      const isAchieved = n >= lvl.minPilot && n >= reqN;
      const remaining = Math.max(0, reqN - n);

      return {
        ...lvl,
        requiredSamples: reqN,
        isAchieved,
        remainingNeeded: remaining
      };
    });
  }, [totalStats.sampleCount, totalStats.meanMinutes, totalStats.stdDevMinutes]);

  // Chart data for Micro-operations Breakdown (Kaizen & Bottleneck analysis)
  const microOpsChartData = useMemo(() => {
    const total = totalStats.totalStandardTimeMinutes || 1;
    return microOperations.map(op => {
      const pct = Number(((op.standardTimeMinutes / total) * 100).toFixed(1));
      return {
        name: op.name.length > 30 ? op.name.substring(0, 28) + '...' : op.name,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
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
                Operação: <strong className="text-slate-200">{operation.name}</strong> &bull; Tempo Atual: {operation.time.toFixed(2)} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Button: Start New Kaizen Cycle */}
            <button
              onClick={() => setIsKaizenModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              title="Arquivar o método anterior e iniciar a cronometragem do novo método Kaizen a partir da Tomada #1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>✨ Iniciar Ciclo Kaizen (Novo Método)</span>
            </button>

            <button
              onClick={() => setShowBulkAdjust(!showBulkAdjust)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Ajustar Ritmo e Fadiga de todas as micro-operações de uma só vez"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ajustar em Massa</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bulk Adjust Popover Banner */}
        {showBulkAdjust && (
          <div className="px-6 py-3 bg-slate-950 border-b border-cyan-900/60 flex flex-wrap items-center justify-between gap-4 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">Padronizar Ritmo & Fadiga para todas as micro-etapas:</span>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              
              {/* Ritmo Geral com Tooltip */}
              <div className="flex items-center gap-2">
                <div className="relative group/tooltip flex items-center">
                  <span className="text-slate-300 font-semibold cursor-help underline decoration-dotted decoration-cyan-500/60 underline-offset-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    Ritmo Geral:
                  </span>
                  <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-64 p-2.5 rounded-xl bg-slate-950/95 border border-cyan-500/50 text-slate-200 text-xs shadow-2xl shadow-cyan-950/60 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 z-50 leading-relaxed backdrop-blur-md">
                    <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Ritmo do Operador (Pace Rating)
                    </div>
                    <p className="text-slate-300 text-[10px]">
                      Avaliação da velocidade e destreza do operador durante a cronometragem comparado a um operador padrão trabalhando a 100%.
                    </p>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 font-mono">
                      Fórmula: Tempo Normal (TN) = TO &times; Ritmo
                    </div>
                    <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-950" />
                  </div>
                </div>

                <select
                  value={bulkPace}
                  onChange={e => setBulkPace(parseFloat(e.target.value))}
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-bold cursor-pointer"
                >
                  <option value={0.80}>80% (Lento)</option>
                  <option value={0.90}>90% (Hesitante)</option>
                  <option value={0.95}>95% (Prudente)</option>
                  <option value={1.00}>100% (Ritmo Padrão)</option>
                  <option value={1.05}>105% (Fluido)</option>
                  <option value={1.10}>110% (Ágil)</option>
                  <option value={1.15}>115% (Muito Rápido)</option>
                  <option value={1.20}>120% (Perito)</option>
                </select>
              </div>

              {/* Fadiga Geral com Tooltip Detalhado */}
              <div className="flex items-center gap-2">
                <div className="relative group/tooltip flex items-center">
                  <span className="text-slate-300 font-semibold cursor-help underline decoration-dotted decoration-amber-500/60 underline-offset-2 flex items-center gap-1">
                    <Coffee className="w-3 h-3 text-amber-400" />
                    Fadiga Geral:
                  </span>
                  <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-80 p-3 rounded-xl bg-slate-950/98 border border-amber-500/60 text-slate-200 text-xs shadow-2xl shadow-amber-950/70 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 z-50 leading-relaxed backdrop-blur-md">
                    <div className="font-bold text-amber-300 mb-1.5 flex items-center gap-1.5 border-b border-slate-800 pb-1">
                      <Coffee className="w-3.5 h-3.5 text-amber-400" />
                      Fadiga & Tolerâncias (Allowances)
                    </div>
                    
                    <div className="space-y-1.5 text-[10.5px]">
                      <div>
                        <strong className="text-amber-200 font-bold block">1. Necessidades Pessoais (5%):</strong>
                        <span className="text-slate-300">Ir ao banheiro, beber água, higiene.</span>
                      </div>
                      
                      <div>
                        <strong className="text-amber-200 font-bold block">2. Fadiga Física e Visual (4% a 6%):</strong>
                        <span className="text-slate-300">Tensão muscular ao guiar tecidos pesados de ráfia, esforço visual constante na agulha, postura sentada/em pé, vibração e ruído da máquina.</span>
                      </div>
                      
                      <div>
                        <strong className="text-amber-200 font-bold block">3. Pequenas Esperas Inevitáveis (3% a 4%):</strong>
                        <span className="text-slate-300">Troca de bobina/carretel de linha, ajuste rápido da tensão da linha, desembaraçar uma alça, pegar novo lote de peças na esteira.</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-amber-400 font-mono flex items-center justify-between">
                      <span>Fórmula:</span>
                      <strong>TP = TN &times; (1 + Fadiga)</strong>
                    </div>
                    <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-950" />
                  </div>
                </div>

                <select
                  value={bulkAllowance}
                  onChange={e => setBulkAllowance(parseFloat(e.target.value))}
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bold cursor-pointer"
                >
                  <option value={0.08}>+8% (Leve)</option>
                  <option value={0.10}>+10% (Costura Básica)</option>
                  <option value={0.12}>+12% (Padrão Big Bag)</option>
                  <option value={0.15}>+15% (Costura Pesada)</option>
                  <option value={0.18}>+18% (Alta Tensão/Esforço)</option>
                  <option value={0.20}>+20% (Condições Severas)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleBulkApplyPaceAndAllowance}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition-colors"
              >
                Aplicar a Todas
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-2 border-b border-slate-800 bg-slate-950/40">
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
              Micro-etapas, Cronômetros & Ritmo ({microOperations.length})
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
              Diagnóstico & Memorial de Cálculo (N&apos;)
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
          </div>

          {/* Top Time Sum Pill */}
          <div className="hidden sm:flex items-center gap-2 pb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Tempo Padrão Consolidado (∑):</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
              {totalStats.totalStandardTimeMinutes.toFixed(2)} min ({totalStats.totalStandardTimeSeconds.toFixed(0)}s)
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          
          {/* TAB 1: FLOW & INDIVIDUAL CONTROLS (STOPWATCH + PACE + FATIGUE PER MICRO-OPERATION) */}
          {activeTab === 'flow' && (
            <div className="space-y-5">
              
              {/* Quick Guidance Alert */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Cronometre cada micro-operação e ajuste o <strong>Ritmo (%)</strong> e a <strong>Fadiga (%)</strong> diretamente no card de cada etapa para calcular o Tempo Padrão (TP).
                  </span>
                </div>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border shrink-0 ${
                  totalStats.isStatisticallyValid
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                    : 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                }`}>
                  {totalStats.reliabilityLabel}
                </span>
              </div>

              {/* Add New Micro-operation Form */}
              <form onSubmit={handleAddMicroOp} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    required
                    value={newStepName}
                    onChange={e => setNewStepName(e.target.value)}
                    placeholder="Adicionar nova micro-etapa (ex: 7. Inspecionar e empilhar)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={newStepType}
                    onChange={e => setNewStepType(e.target.value as LeanActionType)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="valor_agregado">🟢 Valor Agregado (VA)</option>
                    <option value="necessario">🟡 Necessário (NNVA)</option>
                    <option value="desperdicio">🔴 Desperdício (NVA)</option>
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

              {/* Micro-operations Cards with Dedicated Mini-Stopwatches and INLINE PACE & FATIGUE */}
              <div className="space-y-4">
                {microOperations.map(step => {
                  const timer = timers[step.id] || { isRunning: false, elapsedMs: 0 };
                  const badge = leanBadges[step.type];
                  const share = totalStats.totalStandardTimeMinutes > 0
                    ? ((step.standardTimeMinutes / totalStats.totalStandardTimeMinutes) * 100).toFixed(1)
                    : '0.0';

                  const pace = step.paceRating || 1.0;
                  const allowance = step.allowancePercentage || 0.12;

                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                        timer.isRunning
                          ? 'bg-slate-950/90 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                          : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700/80'
                      }`}
                    >
                      {/* Top Row: Title, Lean Badge & Mini-Stopwatch Controls */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Step Title & Lean Badge */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                            #{step.orderIndex}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white truncate" title={step.name}>
                                {step.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleStepType(step.id)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${badge.bg} ${badge.color} ${badge.border}`}
                                title="Clique para alternar VA / NNVA / NVA"
                              >
                                {step.type === 'valor_agregado' ? '🟢 VA' : step.type === 'necessario' ? '🟡 NNVA' : '🔴 NVA'}
                              </button>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({share}% do ciclo)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mini-Stopwatch & Action Controls for this specific step */}
                        <div className="flex items-center gap-3 flex-wrap justify-between lg:justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-800/80">
                          
                          {/* Digital Mini-timer */}
                          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                            <Clock className={`w-3.5 h-3.5 ${timer.isRunning ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                            <span className={`font-mono text-sm font-extrabold ${timer.isRunning ? 'text-cyan-300' : 'text-slate-300'}`}>
                              {formatMiniTimer(timer.elapsedMs)}
                            </span>
                          </div>

                          {/* Stopwatch Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleTimer(step.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1 active:scale-95 ${
                                timer.isRunning
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                              }`}
                            >
                              {timer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                              <span>{timer.isRunning ? 'Pausar' : 'Cronometrar'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRecordStepLap(step)}
                              disabled={timer.elapsedMs === 0}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1 active:scale-95"
                              title="Gravar tomada deste mini-cronômetro"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Gravar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResetTimer(step.id)}
                              disabled={timer.elapsedMs === 0}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                              title="Zerar mini-cronômetro"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Manual Input inline */}
                          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="seg"
                              value={manualSecondsInput[step.id] || ''}
                              onChange={e =>
                                setManualSecondsInput({
                                  ...manualSecondsInput,
                                  [step.id]: e.target.value
                                })
                              }
                              className="w-12 px-1 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs text-white text-right font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddManualTimeToStep(step.id)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition-colors"
                              title="Inserir tempo manual em segundos"
                            >
                              +
                            </button>
                          </div>

                          {/* Reset Samples for this single step */}
                          <button
                            type="button"
                            onClick={() => handleResetSingleStepSamples(step.id)}
                            disabled={step.samples.length === 0}
                            className="p-1.5 text-slate-500 hover:text-amber-300 hover:bg-amber-950/30 disabled:opacity-20 rounded-lg transition-colors"
                            title="Resetar amostras apenas desta micro-etapa para iniciar novo método Kaizen"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Micro-op */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMicroOp(step.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors ml-1"
                            title="Remover micro-etapa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>

                      </div>

                      {/* ============================================================================== */}
                      {/* DEDICATED INDUSTRIAL CALCULATION STRIP (TO -> RITMO -> TN -> FADIGA -> TP) */}
                      {/* ============================================================================== */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                        
                        {/* 1. Tempo Observado (TO) */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">1. Observado (TO):</span>
                          <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {step.meanSeconds.toFixed(1)}s <span className="text-[10px] text-slate-400">({step.meanMinutes.toFixed(3)}m)</span>
                          </span>
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden md:block" />

                        {/* 2. Seletor de Ritmo (%) com Tooltip */}
                        <div className="flex items-center gap-2">
                          <div className="relative group/tooltip flex items-center">
                            <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1 cursor-help underline decoration-dotted decoration-cyan-500/60 underline-offset-2">
                              <Zap className="w-3 h-3 text-cyan-400" />
                              2. Ritmo:
                            </span>
                            <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-64 p-2.5 rounded-xl bg-slate-950/95 border border-cyan-500/50 text-slate-200 text-xs shadow-2xl shadow-cyan-950/60 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 z-50 leading-relaxed backdrop-blur-md">
                              <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" />
                                Ritmo desta Micro-etapa
                              </div>
                              <p className="text-slate-300 text-[10px]">
                                Avalie a velocidade e destreza do operador nesta ação (ex: 115% = costura ágil; 90% = movimento hesitante).
                              </p>
                              <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 font-mono">
                                TN = TO &times; Ritmo
                              </div>
                              <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-950" />
                            </div>
                          </div>

                          <select
                            value={pace}
                            onChange={e => handleUpdateStepPaceAndAllowance(step.id, parseFloat(e.target.value), undefined)}
                            className="px-2 py-1 rounded-lg bg-slate-950 border border-cyan-800/60 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                            title="Avalie a velocidade do operador nesta etapa específica"
                          >
                            <option value={0.80}>80% (Lento)</option>
                            <option value={0.85}>85%</option>
                            <option value={0.90}>90% (Hesitante)</option>
                            <option value={0.95}>95%</option>
                            <option value={1.00}>100% (Padrão)</option>
                            <option value={1.05}>105%</option>
                            <option value={1.10}>110% (Ágil)</option>
                            <option value={1.15}>115% (Rápido)</option>
                            <option value={1.20}>120% (Perito)</option>
                          </select>
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden md:block" />

                        {/* 3. Tempo Normal (TN) */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">3. Normal (TN):</span>
                          <span className="font-mono font-bold text-cyan-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {(step.meanSeconds * pace).toFixed(1)}s
                          </span>
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden md:block" />

                        {/* 4. Seletor de Fadiga / Tolerância (%) com Tooltip Detalhado */}
                        <div className="flex items-center gap-2">
                          <div className="relative group/tooltip flex items-center">
                            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 cursor-help underline decoration-dotted decoration-amber-500/60 underline-offset-2">
                              <Coffee className="w-3 h-3 text-amber-400" />
                              4. Fadiga:
                            </span>
                            <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-80 p-3 rounded-xl bg-slate-950/98 border border-amber-500/60 text-slate-200 text-xs shadow-2xl shadow-amber-950/70 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 z-50 leading-relaxed backdrop-blur-md">
                              <div className="font-bold text-amber-300 mb-1.5 flex items-center gap-1.5 border-b border-slate-800 pb-1">
                                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                                Fadiga & Tolerâncias (Allowances)
                              </div>
                              
                              <div className="space-y-1.5 text-[10.5px]">
                                <div>
                                  <strong className="text-amber-200 font-bold block">1. Necessidades Pessoais (5%):</strong>
                                  <span className="text-slate-300">Ir ao banheiro, beber água, higiene.</span>
                                </div>
                                
                                <div>
                                  <strong className="text-amber-200 font-bold block">2. Fadiga Física e Visual (4% a 6%):</strong>
                                  <span className="text-slate-300">Tensão muscular ao guiar tecidos pesados de ráfia, esforço visual constante na agulha, postura sentada/em pé, vibração e ruído da máquina.</span>
                                </div>
                                
                                <div>
                                  <strong className="text-amber-200 font-bold block">3. Pequenas Esperas Inevitáveis (3% a 4%):</strong>
                                  <span className="text-slate-300">Troca de bobina/carretel de linha, ajuste rápido da tensão da linha, desembaraçar uma alça, pegar novo lote de peças na esteira.</span>
                                </div>
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-amber-400 font-mono flex items-center justify-between">
                                <span>Fórmula:</span>
                                <strong>TP = TN &times; (1 + Fadiga)</strong>
                              </div>
                              <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-950" />
                            </div>
                          </div>

                          <select
                            value={allowance}
                            onChange={e => handleUpdateStepPaceAndAllowance(step.id, undefined, parseFloat(e.target.value))}
                            className="px-2 py-1 rounded-lg bg-slate-950 border border-amber-800/60 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                            title="Tolerância para necessidades pessoais e cansaço físico"
                          >
                            <option value={0.08}>+8% (Leve)</option>
                            <option value={0.10}>+10% (Normal)</option>
                            <option value={0.12}>+12% (Padrão)</option>
                            <option value={0.15}>+15% (Pesado)</option>
                            <option value={0.18}>+18% (Severo)</option>
                            <option value={0.20}>+20% (Extremo)</option>
                          </select>
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden md:block" />

                        {/* 5. Tempo Padrão Final da Etapa (TP) */}
                        <div className="flex items-center gap-2 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/40">
                          <span className="text-[10px] uppercase font-bold text-emerald-400">5. TP Final:</span>
                          <span className="font-mono font-extrabold text-emerald-300">
                            {step.standardTimeMinutes.toFixed(2)}m <span className="text-[10px] text-emerald-400">({step.standardTimeSeconds.toFixed(1)}s)</span>
                          </span>
                        </div>

                      </div>

                      {/* Recorded Sample Pills for this step */}
                      {step.samples && step.samples.length > 0 && (
                        <div className="pt-2 border-t border-slate-900/80 flex items-center gap-2 overflow-x-auto">
                          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">
                            {step.samples.length} tomadas registradas:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {step.samples.map(s => (
                              <span
                                key={s.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                              >
                                <span>{s.timeInSeconds.toFixed(1)}s</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSample(step.id, s.id)}
                                  className="text-slate-500 hover:text-rose-400 transition-colors ml-0.5"
                                  title="Remover esta medição"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 2: CLEAR INDUSTRIAL STATISTICAL GUIDANCE, COMPARATIVE MATRIX & MEMORIAL DE CÁLCULO */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              
              {/* Main Statistical Diagnosis Card */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-5">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Diagnóstico de Confiabilidade & Precisão Amostral
                      </h3>
                      <p className="text-xs text-slate-400">
                        Validação estatística rigorosa para certificação de tempos industriais
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold border self-start sm:self-auto ${
                      totalStats.isStatisticallyValid
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    {totalStats.isStatisticallyValid ? '✓ Padrão Industrial Atingido' : `⏳ Amostragem Preliminar (Faltam ${totalStats.remainingSamplesNeeded} tomadas)`}
                  </span>
                </div>

                {/* Plain-language explanation banner */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                  totalStats.isStatisticallyValid
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                }`}>
                  {totalStats.isStatisticallyValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block text-sm font-bold mb-1">
                      {totalStats.reliabilityLabel}
                    </strong>
                    <p className="opacity-90">
                      {totalStats.reliabilityRecommendation}
                    </p>
                  </div>
                </div>

                {/* 3 Key Questions Answered for the Industrial User */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 block font-semibold">
                      1. Amostras Realizadas:
                    </span>
                    <div className="text-2xl font-extrabold font-mono text-white">
                      {totalStats.sampleCount} <span className="text-xs font-normal text-slate-400">tomada{totalStats.sampleCount > 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {totalStats.sampleCount < 2 ? (
                        <span className="text-amber-400 font-mono">Margem de erro estimada: &plusmn;{totalStats.currentAchievedErrorPct}%</span>
                      ) : (
                        <span>Margem de erro atual: <strong className="text-cyan-300">&plusmn;{totalStats.currentAchievedErrorPct}%</strong></span>
                      )}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                    <span className="text-emerald-400 block font-semibold flex items-center justify-between">
                      <span>2. Meta Padrão Industrial (N&apos;):</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        95% / &plusmn;5%
                      </span>
                    </span>
                    <div className="text-2xl font-extrabold font-mono text-emerald-300">
                      {totalStats.requiredSamples} <span className="text-xs font-normal text-slate-400">tomadas no total</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      {totalStats.isStatisticallyValid ? (
                        <strong className="text-emerald-400">✓ Amostragem suficiente ({totalStats.sampleCount} &ge; {totalStats.requiredSamples})</strong>
                      ) : (
                        <span>Faltam <strong>{totalStats.remainingSamplesNeeded}</strong> tomadas para certificar</span>
                      )}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 block font-semibold">
                      3. Estabilidade do Processo (CV):
                    </span>
                    <div className="text-2xl font-extrabold font-mono text-cyan-300">
                      {totalStats.sampleCount < 2 ? (
                        <span className="text-base text-slate-400 font-sans font-bold">Indeterminado</span>
                      ) : (
                        `${totalStats.coefficientOfVariationPct}%`
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {totalStats.sampleCount < 2
                        ? 'Requer ao menos 2 tomadas para calcular dispersão'
                        : totalStats.coefficientOfVariationPct <= 10
                        ? 'Processo altamente estável e repetível'
                        : 'Oscilação moderada entre tomadas'}
                    </span>
                  </div>

                </div>

              </div>

              {/* ============================================================================== */}
              {/* TABELA DE METAS POR NÍVEL DE CONFIABILIDADE (Quantas amostras para cada nível) */}
              {/* ============================================================================== */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">
                      Dimensionamento Amostral por Nível de Confiabilidade
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Amostragem atual: <strong className="text-white font-mono">{totalStats.sampleCount} tomada{totalStats.sampleCount > 1 ? 's' : ''}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase font-bold text-slate-400">
                        <th className="py-2.5 px-3">Nível & Aplicação</th>
                        <th className="py-2.5 px-3 text-center">Confiança</th>
                        <th className="py-2.5 px-3 text-center">Margem de Erro</th>
                        <th className="py-2.5 px-3 text-center">Total Necessário (N&apos;)</th>
                        <th className="py-2.5 px-3 text-center">Faltam</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {confidenceMatrix.map(lvl => (
                        <tr
                          key={lvl.key}
                          className={`hover:bg-slate-800/30 transition-colors ${
                            lvl.isRecommended ? 'bg-emerald-950/20' : ''
                          }`}
                        >
                          {/* Name & Desc */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white block">
                                {lvl.name}
                              </span>
                              {lvl.isRecommended && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  Padrão Fábrica
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {lvl.desc}
                            </span>
                          </td>

                          {/* Confidence */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                            {lvl.confidence}%
                          </td>

                          {/* Error margin */}
                          <td className="py-3 px-3 text-center font-mono text-cyan-300">
                            &plusmn;{(lvl.errorPct * 100).toFixed(0)}%
                          </td>

                          {/* Required N' */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-white">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sm">
                              {lvl.requiredSamples}
                            </span>
                          </td>

                          {/* Remaining */}
                          <td className="py-3 px-3 text-center font-mono">
                            {lvl.remainingNeeded === 0 ? (
                              <span className="text-emerald-400 font-bold">0</span>
                            ) : (
                              <span className="text-amber-400 font-bold">
                                {lvl.remainingNeeded} tomadas
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-right">
                            {lvl.isAchieved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
                                <CheckCircle2 className="w-3 h-3" /> Atingido
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50">
                                <Clock className="w-3 h-3" /> Em Progresso ({totalStats.sampleCount}/{lvl.requiredSamples})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ============================================================================== */}
              {/* MEMORIAL DE CÁLCULO PASSO A PASSO (Walkthrough Matemático com Valores Reais) */}
              {/* ============================================================================== */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
                <div
                  onClick={() => setShowMemorial(!showMemorial)}
                  className="flex items-center justify-between pb-2 border-b border-slate-800 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        Memorial de Cálculo Matemático Passo a Passo
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Demonstração de todas as fórmulas estatísticas aplicadas com os valores reais das medições
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-white transition-colors"
                  >
                    {showMemorial ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {showMemorial && (
                  <div className="space-y-4 pt-1 animate-in fade-in">
                    
                    {/* Passo 1: Média Aritmética */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <span>Passo 1:</span> Média dos Tempos Amostrais (&xmacr;)
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          n = {totalStats.sampleCount} tomada{totalStats.sampleCount > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto">
                        &xmacr; = (&Sigma; x_i) / n = {totalStats.meanMinutes.toFixed(3)} min ({totalStats.meanSeconds.toFixed(1)} segundos)
                      </div>
                    </div>

                    {/* Passo 2: Desvio Padrão */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <span>Passo 2:</span> Desvio Padrão Amostral (s) & Variância (s&sup2;)
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {totalStats.sampleCount < 2 ? 'Graus de liberdade = 0 (n < 2)' : `Graus de liberdade: ${totalStats.sampleCount - 1}`}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto">
                        {totalStats.sampleCount < 2 ? (
                          <span className="text-amber-300">
                            s = Indeterminado com 1 tomada (requer n &ge; 2). Adotada estimativa técnica de variabilidade inicial CV &asymp; 10% (s &asymp; &plusmn;{(totalStats.meanMinutes * 0.10).toFixed(4)} min).
                          </span>
                        ) : (
                          <span>
                            s = &radic;[ &Sigma;(x_i - &xmacr;)&sup2; / (n - 1) ] = &plusmn;{totalStats.stdDevMinutes.toFixed(4)} min &bull; s&sup2; = {totalStats.variance.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Passo 3: Coeficiente de Variação (CV) */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <span>Passo 3:</span> Coeficiente de Variação / Estabilidade (CV)
                        </span>
                        <span className={`text-[11px] font-bold font-mono ${totalStats.sampleCount >= 2 && totalStats.coefficientOfVariationPct <= 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {totalStats.sampleCount < 2 ? 'Requer n ≥ 2' : totalStats.coefficientOfVariationPct <= 10 ? 'Estável (≤ 10%)' : 'Oscilação (> 10%)'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto">
                        {totalStats.sampleCount < 2 ? (
                          <span className="text-slate-400">
                            CV = Indeterminado para n=1. A dispersão real será calculada a partir da 2ª tomada de tempo.
                          </span>
                        ) : (
                          <span>
                            CV = (s / &xmacr;) &times; 100% = ({totalStats.stdDevMinutes.toFixed(4)} / {totalStats.meanMinutes.toFixed(3)}) &times; 100% = {totalStats.coefficientOfVariationPct}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Passo 4: Dimensionamento Amostral Exato N' */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <span>Passo 4:</span> Fórmula de Dimensionamento Amostral (N&apos;)
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400">
                          Padrão Industrial (95% / &plusmn;5%)
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-emerald-300 overflow-x-auto space-y-1">
                        <div>N&apos; = [ (z &middot; s) / (e &middot; &xmacr;) ]&sup2;</div>
                        <div className="text-slate-300">
                          {totalStats.sampleCount < 2 ? (
                            <span>N&apos; = [ (1.96 &middot; {(totalStats.meanMinutes * 0.10).toFixed(4)}) / (0.05 &middot; {totalStats.meanMinutes.toFixed(3)}) ]&sup2; = [ 3.92 ]&sup2; &asymp; 15.36</span>
                          ) : (
                            <span>N&apos; = [ ({totalStats.zValue} &middot; {totalStats.stdDevMinutes.toFixed(4)}) / ({totalStats.errorMarginPct} &middot; {totalStats.meanMinutes.toFixed(3)}) ]&sup2;</span>
                          )}
                        </div>
                        <div className="text-white font-bold pt-1">
                          N&apos; = {totalStats.requiredSamples} tomadas recomendadas no total (faltam {totalStats.remainingSamplesNeeded})
                        </div>
                      </div>
                    </div>

                    {/* Passo 5: Erro Relativo Real Atingido */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <span>Passo 5:</span> Margem de Erro Atual Atingida (e_atual)
                        </span>
                        <span className="text-[11px] font-mono text-cyan-300">
                          Com {totalStats.sampleCount} tomada realizada
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto">
                        {totalStats.sampleCount < 2 ? (
                          <span>e_atual &asymp; &plusmn;{totalStats.currentAchievedErrorPct}% (margem de erro preliminar elevada)</span>
                        ) : (
                          <span>e_atual = (z &middot; s) / (&radic;n &middot; &xmacr;) = ({totalStats.zValue} &middot; {totalStats.stdDevMinutes.toFixed(4)}) / (&radic;{totalStats.sampleCount} &middot; {totalStats.meanMinutes.toFixed(3)}) = &plusmn;{totalStats.currentAchievedErrorPct}%</span>
                        )}
                      </div>
                    </div>

                    {/* Passo 6: Síntese de Tempo Padrão TP */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <span>Passo 6:</span> Tempo Normal (TN) & Tempo Padrão Final (TP)
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Média Ritmo: {(totalStats.paceRating * 100).toFixed(0)}% &bull; Média Fadiga: {(totalStats.allowancePercentage * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto space-y-1">
                        <div>TN = &xmacr; &times; FR = {totalStats.meanMinutes.toFixed(3)} &times; {totalStats.paceRating.toFixed(2)} = {(totalStats.meanMinutes * totalStats.paceRating).toFixed(3)} min</div>
                        <div className="text-emerald-400 font-bold">
                          TP = &Sigma; Micro-etapas = {totalStats.totalStandardTimeMinutes.toFixed(2)} min ({totalStats.totalStandardTimeSeconds.toFixed(0)} segundos)
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: CHARTS & KAIZEN ANALYSIS */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              
              {/* Horizontal Bar Chart of Micro-operations */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      Gargalos & Tempos por Micro-operação
                    </h3>
                    <p className="text-xs text-slate-400">
                      Visualização comparativa de tempo por micro-etapa para identificar desperdícios e Kaizen
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> VA (Valor Agregado)
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> NNVA (Necessário)
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> NVA (Desperdício)
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

              {/* Lean Distribution Cards */}
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

        </div>

        {/* Global Bottom Synthesis Bar with Kaizen Justification */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/95 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Left: Kaizen Justification & Analyst Notes */}
          <div className="flex-1 w-full lg:max-w-xl">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Justificativa / Melhoria Kaizen (Grava na Linha do Tempo):
              </label>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>Responsável:</span>
                <input
                  type="text"
                  value={analystName}
                  onChange={e => setAnalystName(e.target.value)}
                  placeholder="Eng. Responsável"
                  className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-cyan-300 text-[10px] font-mono focus:outline-none focus:border-cyan-500 w-32"
                />
              </div>
            </div>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Implementado gabarito magnético de alça para reduzir dobras manuais..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          {/* Right: Consolidated Total & Action Buttons */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-800/80">
            <div className="text-left lg:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Novo Tempo da Operação (∑ TP):
              </span>
              <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 font-mono">
                {totalStats.totalStandardTimeMinutes.toFixed(2)} <span className="text-sm font-bold text-teal-400">min</span>
                <span className="text-xs font-normal text-slate-400 ml-1">({totalStats.totalStandardTimeSeconds.toFixed(0)}s)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveAndApply(false)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                title="Salvar o estudo de micro-etapas sem alterar o tempo oficial"
              >
                Salvar Estudo
              </button>

              <button
                type="button"
                onClick={() => handleSaveAndApply(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 active:scale-95"
                title="Salvar, aplicar novo tempo padrão e registrar marco na Linha do Tempo Kaizen"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Aplicar Soma & Kaizen</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ============================================================================== */}
      {/* POP-UP MODAL: INICIAR NOVO CICLO KAIZEN */}
      {/* ============================================================================== */}
      {isKaizenModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Iniciar Novo Ciclo Kaizen
                  </h3>
                  <p className="text-xs text-slate-400">
                    Arquivar método anterior e cronometrar a partir da Tomada #1
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsKaizenModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 leading-relaxed space-y-1.5">
              <div className="font-bold flex items-center gap-1 text-amber-300">
                <Target className="w-3.5 h-3.5" />
                O que acontecerá ao confirmar:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                <li>O tempo atual (<strong>{operation.time.toFixed(2)} min</strong>) será arquivado no <strong>Histórico de Revisões</strong> como marco anterior.</li>
                <li>As tomadas antigas de todas as micro-etapas serão <strong>resetadas</strong>.</li>
                <li>A próxima medição no cronômetro será tratada como a <strong>Tomada #1 do Novo Método</strong>.</li>
                <li>O motor estatístico ($N'$) recalculará o número de amostras necessárias para certificar a melhoria.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Descrição da Melhoria / Ação Kaizen Realizada:
              </label>
              <textarea
                rows={3}
                required
                value={kaizenActionDescription}
                onChange={e => setKaizenActionDescription(e.target.value)}
                placeholder="Ex: Instalado novo gabarito magnético e trocado calcador para eliminar 2 dobras manuais da alça..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsKaizenModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleStartKaizenCycle}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Iniciar Medição do Novo Ciclo</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
