import { ComponentCategoryConfig, OperationItem, TimeStudy } from '@/types/production';

export interface StorageData {
  categories?: ComponentCategoryConfig[];
  operations: OperationItem[];
  timeStudies?: TimeStudy[];
  selectedCalculatorIds: string[];
  lastUpdated: string;
  version: string;
}

export interface IStorageService {
  name: 'localStorage' | 'supabase';
  // Categories / Blocks
  getCategories(): Promise<ComponentCategoryConfig[]>;
  saveCategories(categories: ComponentCategoryConfig[]): Promise<void>;
  resetCategories?(): Promise<ComponentCategoryConfig[]>;

  // Operations
  getOperations(): Promise<OperationItem[]>;
  saveOperations(operations: OperationItem[]): Promise<void>;
  updateOperation(operation: OperationItem): Promise<void>;
  resetOperations(): Promise<OperationItem[]>;

  // Time Studies (Cronoanálise Lean)
  getTimeStudies(): Promise<TimeStudy[]>;
  getTimeStudyByOperationId(operationId: string): Promise<TimeStudy | null>;
  saveTimeStudy(study: TimeStudy): Promise<void>;
  deleteTimeStudy(id: string): Promise<void>;

  // Calculator State
  getCalculatorSelection(): Promise<string[]>;
  saveCalculatorSelection(selectedIds: string[]): Promise<void>;

  // Backup & Restore
  exportAllData(): Promise<StorageData>;
  importAllData(data: StorageData): Promise<void>;
  clearAllDataForProduction?(): Promise<void>;
}
