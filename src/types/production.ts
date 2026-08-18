export type ComponentCategoryKey =
  | 'alca'
  | 'fundo'
  | 'topo'
  | 'travas'
  | 'fechamento'
  | 'valvFundo'
  | 'valvTopo'
  | 'saia'
  | 'valvCustom'
  | 'outras'
  | 'preparacao';

export interface OperationItem {
  id: string;
  name: string;
  time: number; // in minutes (e.g. 2.50)
  isDefault: boolean;
  category: ComponentCategoryKey;
  description?: string;
}

export interface ComponentCategoryConfig {
  key: ComponentCategoryKey;
  title: string;
  icon: string;
  colorClass: string;
  colorHex: string;
  description?: string;
}

export type OrderStatus = 'planejada' | 'em_producao' | 'concluida' | 'cancelada';

export interface ComponentTimeEntry {
  category: ComponentCategoryKey;
  standardTime: number; // planned minutes per unit
  actualTime: number;   // realized minutes per unit or total
  efficiency: number;   // % (standard / actual) * 100
  notes?: string;
}

export interface ProductionOrder {
  id: string;
  opNumber: string;         // e.g. "OP-2024-001"
  client: string;           // e.g. "AgroTech Brasil"
  modelDescription: string; // e.g. "Big Bag 1.500kg - Travado com Liner"
  targetQuantity: number;   // e.g. 100 bags
  producedQuantity: number; // e.g. 100 bags
  selectedOperationIds: string[]; // operations chosen in calculator
  standardTimePerBag: number;     // in minutes
  totalStandardTime: number;      // standardTimePerBag * targetQuantity (in minutes)
  actualTimeTotal?: number;       // total minutes spent
  componentTimes?: Record<ComponentCategoryKey, number>; // actual minutes spent per component
  operatorName?: string;
  shift?: string;
  status: OrderStatus;
  notes?: string;
  createdAt: string;       // ISO string
  updatedAt: string;       // ISO string
  completedAt?: string;    // ISO string
}

export interface DashboardMetrics {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  plannedOrders: number;
  totalPlannedUnits: number;
  totalProducedUnits: number;
  globalStandardMinutes: number;
  globalActualMinutes: number;
  globalEfficiency: number; // %
}

export interface ComponentEfficiencyStat {
  category: ComponentCategoryKey;
  title: string;
  colorHex: string;
  standardMinutes: number;
  actualMinutes: number;
  efficiency: number; // %
  countUsage: number;
}

// ==============================================================================
// LEAN MICRO-OPERATIONS & TIME STUDY TYPES
// ==============================================================================

export type LeanActionType = 'valor_agregado' | 'necessario' | 'desperdicio';

export interface TimeStudySample {
  id: string;
  sampleIndex: number;
  timeInSeconds: number;
  timeInMinutes: number;
  type: LeanActionType;
  stepId?: string;
  stepName?: string;
  cycleIndex?: number;
  notes?: string;
  timestamp: string;
}

export interface MicroOperation {
  id: string;
  orderIndex: number;
  name: string;
  type: LeanActionType; // 'valor_agregado' | 'necessario' | 'desperdicio'
  description?: string;
  samples: TimeStudySample[];
  meanSeconds: number;
  meanMinutes: number;
  paceRating: number;          // Fator de Ritmo (ex: 1.0 = 100%)
  allowancePercentage: number; // Tolerâncias / Suplementos (ex: 0.12 = 12%)
  normalTimeMinutes: number;   // TN = TC * FR
  standardTimeMinutes: number; // TP = TN * (1 + FT)
  standardTimeSeconds: number;
  sharePercentage?: number;    // % deste passo no tempo total da operação
}

export interface TimeStudyStats {
  meanMinutes: number;         // Média total amostral do ciclo (x̄)
  meanSeconds: number;
  stdDevMinutes: number;       // Desvio padrão amostral (s)
  variance: number;
  minMinutes: number;
  maxMinutes: number;
  sampleCount: number;         // Número de ciclos completos
  zValue: number;              // Valor crítico de z (1.645 p/ 90%, 1.96 p/ 95%, 2.576 p/ 99%)
  confidenceLevel: number;     // Nível de confiança (90, 95, 99)
  errorMarginPct: number;      // Margem de erro relativo (ex: 0.05 para 5%)
  requiredSamples: number;     // N' = [ (z · s) / (e · x̄) ]²
  isStatisticallyValid: boolean; // n >= N'
  remainingSamplesNeeded: number; // Max(0, N' - n)

  // Lean Breakdown
  vaMinutes: number;           // Minutos em Valor Agregado
  nnvaMinutes: number;         // Minutos em Necessário
  nvaMinutes: number;          // Minutos em Desperdício
  vaRatio: number;             // % Valor Agregado
  nnvaRatio: number;           // % Necessário
  nvaRatio: number;            // % Desperdício

  // Standard Time Calculations
  paceRating: number;          // Fator de Ritmo
  allowancePercentage: number; // Tolerâncias
  totalStandardTimeMinutes: number; // Soma de todas as micro-operações
  totalStandardTimeSeconds: number;
}

export interface TimeStudy {
  id: string;
  operationId: string;
  operationName: string;
  category: ComponentCategoryKey;
  operatorName?: string;
  analystName?: string;
  date: string;
  microOperations: MicroOperation[];
  stats: TimeStudyStats;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
