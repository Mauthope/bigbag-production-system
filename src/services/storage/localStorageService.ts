import { DEFAULT_CATEGORIES, DEFAULT_OPERATIONS, DEFAULT_CELL_CONFIG } from '@/data/defaultData';
import { ComponentCategoryConfig, OperationItem, TimeStudy, CellProductionConfig } from '@/types/production';
import { IStorageService, StorageData } from './types';

const STORAGE_KEYS = {
  CATEGORIES: 'bigbag_production_categories_v1',
  OPERATIONS: 'bigbag_production_operations_v1',
  TIME_STUDIES: 'bigbag_production_time_studies_v1',
  CALCULATOR_SELECTION: 'bigbag_calculator_selection_v1',
  CELL_CONFIG: 'bigbag_cell_config_v1',
  DATA_VERSION: '2.0.0'
};

export class LocalStorageService implements IStorageService {
  name: 'localStorage' = 'localStorage';

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  // Categories / Blocks
  async getCategories(): Promise<ComponentCategoryConfig[]> {
    if (!this.isClient()) return DEFAULT_CATEGORIES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!stored) {
        await this.saveCategories(DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading categories from localStorage:', e);
      return DEFAULT_CATEGORIES;
    }
  }

  async saveCategories(categories: ComponentCategoryConfig[]): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  async resetCategories(): Promise<ComponentCategoryConfig[]> {
    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    return DEFAULT_CATEGORIES;
  }

  // Operations
  async getOperations(): Promise<OperationItem[]> {
    if (!this.isClient()) return DEFAULT_OPERATIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OPERATIONS);
      if (!stored) {
        // Initialize with default operations
        await this.saveOperations(DEFAULT_OPERATIONS);
        return DEFAULT_OPERATIONS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading operations from localStorage:', e);
      return DEFAULT_OPERATIONS;
    }
  }

  async saveOperations(operations: OperationItem[]): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(operations));
  }

  async updateOperation(operation: OperationItem): Promise<void> {
    const current = await this.getOperations();
    const index = current.findIndex(op => op.id === operation.id);
    if (index >= 0) {
      current[index] = operation;
    } else {
      current.push(operation);
    }
    await this.saveOperations(current);
  }

  async resetOperations(): Promise<OperationItem[]> {
    if (this.isClient()) {
      localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(DEFAULT_OPERATIONS));
    }
    return DEFAULT_OPERATIONS;
  }

  // Time Studies (Cronoanálise Lean)
  async getTimeStudies(): Promise<TimeStudy[]> {
    if (!this.isClient()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TIME_STUDIES);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading time studies from localStorage:', e);
      return [];
    }
  }

  async getTimeStudyByOperationId(operationId: string): Promise<TimeStudy | null> {
    const studies = await this.getTimeStudies();
    return studies.find(s => s.operationId === operationId) || null;
  }

  async saveTimeStudy(study: TimeStudy): Promise<void> {
    if (!this.isClient()) return;
    const studies = await this.getTimeStudies();
    const index = studies.findIndex(s => s.id === study.id || s.operationId === study.operationId);
    if (index >= 0) {
      studies[index] = { ...study, updatedAt: new Date().toISOString() };
    } else {
      studies.unshift({
        ...study,
        createdAt: study.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    localStorage.setItem(STORAGE_KEYS.TIME_STUDIES, JSON.stringify(studies));
  }

  async deleteTimeStudy(id: string): Promise<void> {
    if (!this.isClient()) return;
    const studies = await this.getTimeStudies();
    const filtered = studies.filter(s => s.id !== id && s.operationId !== id);
    localStorage.setItem(STORAGE_KEYS.TIME_STUDIES, JSON.stringify(filtered));
  }

  // Calculator State
  async getCalculatorSelection(): Promise<string[]> {
    if (!this.isClient()) return DEFAULT_OPERATIONS.filter(o => o.isDefault).map(o => o.id);
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CALCULATOR_SELECTION);
      if (!stored) {
        const defaultIds = DEFAULT_OPERATIONS.map(o => o.id);
        await this.saveCalculatorSelection(defaultIds);
        return defaultIds;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading selection from localStorage:', e);
      return [];
    }
  }

  async saveCalculatorSelection(selectedIds: string[]): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.CALCULATOR_SELECTION, JSON.stringify(selectedIds));
  }

  // Cell & Headcount Config
  async getCellConfig(): Promise<CellProductionConfig> {
    if (!this.isClient()) return DEFAULT_CELL_CONFIG;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CELL_CONFIG);
      if (!stored) {
        await this.saveCellConfig(DEFAULT_CELL_CONFIG);
        return DEFAULT_CELL_CONFIG;
      }
      return { ...DEFAULT_CELL_CONFIG, ...JSON.parse(stored) };
    } catch (e) {
      console.error('Error reading cell config from localStorage:', e);
      return DEFAULT_CELL_CONFIG;
    }
  }

  async saveCellConfig(config: CellProductionConfig): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.CELL_CONFIG, JSON.stringify(config));
  }

  // Backup & Restore
  async exportAllData(): Promise<StorageData> {
    const categories = await this.getCategories();
    const operations = await this.getOperations();
    const timeStudies = await this.getTimeStudies();
    const selectedCalculatorIds = await this.getCalculatorSelection();
    const cellConfig = await this.getCellConfig();

    return {
      categories,
      operations,
      timeStudies,
      selectedCalculatorIds,
      cellConfig,
      lastUpdated: new Date().toISOString(),
      version: STORAGE_KEYS.DATA_VERSION
    };
  }

  async importAllData(data: StorageData): Promise<void> {
    if (!this.isClient()) return;
    if (data.categories && Array.isArray(data.categories)) {
      await this.saveCategories(data.categories);
    }
    if (data.operations && Array.isArray(data.operations)) {
      await this.saveOperations(data.operations);
    }
    if (data.timeStudies && Array.isArray(data.timeStudies)) {
      localStorage.setItem(STORAGE_KEYS.TIME_STUDIES, JSON.stringify(data.timeStudies));
    }
    if (data.selectedCalculatorIds && Array.isArray(data.selectedCalculatorIds)) {
      await this.saveCalculatorSelection(data.selectedCalculatorIds);
    }
    if (data.cellConfig && typeof data.cellConfig === 'object') {
      await this.saveCellConfig(data.cellConfig);
    }
  }

  async clearAllDataForProduction(): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(DEFAULT_OPERATIONS));
    localStorage.setItem(STORAGE_KEYS.TIME_STUDIES, JSON.stringify([]));
    const defaultIds = DEFAULT_OPERATIONS.filter(o => o.isDefault).map(o => o.id);
    localStorage.setItem(STORAGE_KEYS.CALCULATOR_SELECTION, JSON.stringify(defaultIds));
  }
}

export const localStorageService = new LocalStorageService();
