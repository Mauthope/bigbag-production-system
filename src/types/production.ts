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
