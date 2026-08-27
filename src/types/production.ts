export type ComponentCategoryKey = string;

export interface OperationTimeHistoryEntry {
  id: string;
  operationId: string;
  time: number; // in minutes (e.g. 2.50)
  date: string; // ISO date string or YYYY-MM-DD
  notes?: string; // e.g. "Kaizen: eliminação de desperdício no posicionamento", "Baseline inicial"
  source?: 'cronoanalise' | 'manual' | 'inicial';
}

export interface OperationItem {
  id: string;
  name: string;
  time: number; // in minutes (e.g. 2.50) - Nova Medição / Tempo Atual
  previousTime?: number; // Tempo da medição anterior (ponto de partida do ciclo atual)
  initialTime?: number; // Tempo original inicial histórico (baseline de fábrica)
  isDefault: boolean;
  category: ComponentCategoryKey;
  description?: string;
  history?: OperationTimeHistoryEntry[];
  updatedAt?: string;
}

export interface FinancialImpactConfig {
  monthlyVolume: number;              // Quantidade do mês (ex: 20000 bags)
  defaultHourlyRate: number;          // Custo hora-homem padrão (ex: 28.50 R$/h)
  sectorHourlyRates: Record<string, number>; // Custo hora-homem específico por setor/categoria
  comparisonBaselineMode?: 'previous' | 'initial'; // 'previous' = última medição anterior | 'initial' = baseline inicial
}

export interface ComponentCategoryConfig {
  key: string;
  title: string;
  icon?: string;
  colorClass?: string;
  colorHex: string;
  description?: string;
  orderIndex?: number;
}

export type CellModelType =
  | 'one'
  | 'travado'
  | 'sala_limpa'
  | 'multi'
  | 'fertilizante'
  | 'fertilizante_liner';

export interface CellProductionConfig {
  peopleOne: number;                 // Nº de pessoas na célula One (padrão: 8.5)
  peopleTravado: number;             // Nº de pessoas na célula Travado (padrão: 11.0)
  peopleSalaLimpa?: number;          // Nº de pessoas na célula Sala Limpa (padrão: 8.5)
  peopleMulti?: number;              // Nº de pessoas na célula Multi (padrão: 8.5)
  peopleFertilizante?: number;       // Nº de pessoas na célula Fertilizante (padrão: 8.5)
  peopleFertilizanteLiner?: number;  // Nº de pessoas na célula Fertilizante c/ Liner (padrão: 8.5)
  shiftHours: number;                // Horas produtivas por dia/turno (padrão: 8.5h)
}

export interface CellModelDefinition {
  id: CellModelType;
  name: string;
  shortName: string;
  configKey: 'peopleOne' | 'peopleTravado' | 'peopleSalaLimpa' | 'peopleMulti' | 'peopleFertilizante' | 'peopleFertilizanteLiner';
  defaultPeople: number;
  badgeColor: string;
  gradientClass: string;
  description: string;
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

export type StatisticalReliabilityLevel =
  | 'amostragem_inicial'     // < 3 amostras
  | 'baixa_confiabilidade'   // erro > 10%
  | 'confiabilidade_media'   // erro 5% a 10%
  | 'padrao_industrial'      // erro <= 5% com 95% de confiança
  | 'alta_precisao';         // erro <= 2% com 99% de confiança

export interface TimeStudyStats {
  meanMinutes: number;         // Média total amostral do ciclo (x̄)
  meanSeconds: number;
  stdDevMinutes: number;       // Desvio padrão amostral (s)
  variance: number;
  coefficientOfVariationPct: number; // CV = (s / x̄) * 100
  minMinutes: number;
  maxMinutes: number;
  sampleCount: number;         // Número de ciclos completos
  zValue: number;              // Valor crítico de z (1.645 p/ 90%, 1.96 p/ 95%, 2.576 p/ 99%)
  confidenceLevel: number;     // Nível de confiança (90, 95, 99)
  errorMarginPct: number;      // Margem de erro relativo meta (ex: 0.05 para 5%)
  currentAchievedErrorPct: number; // Margem de erro real atingida com as n amostras atuais
  requiredSamples: number;     // N' = [ (z · s) / (e · x̄) ]²
  isStatisticallyValid: boolean; // n >= N'
  remainingSamplesNeeded: number; // Max(0, N' - n)
  reliabilityLevel: StatisticalReliabilityLevel;
  reliabilityLabel: string;
  reliabilityRecommendation: string;

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
