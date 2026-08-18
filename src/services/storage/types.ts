import { OperationItem, ProductionOrder } from '@/types/production';

export interface StorageData {
  operations: OperationItem[];
  orders: ProductionOrder[];
  selectedCalculatorIds: string[];
  lastUpdated: string;
  version: string;
}

export interface IStorageService {
  name: 'localStorage' | 'supabase';
  // Operations
  getOperations(): Promise<OperationItem[]>;
  saveOperations(operations: OperationItem[]): Promise<void>;
  updateOperation(operation: OperationItem): Promise<void>;
  resetOperations(): Promise<OperationItem[]>;

  // Production Orders (OP)
  getOrders(): Promise<ProductionOrder[]>;
  getOrderById(id: string): Promise<ProductionOrder | null>;
  saveOrder(order: ProductionOrder): Promise<void>;
  deleteOrder(id: string): Promise<void>;

  // Calculator State
  getCalculatorSelection(): Promise<string[]>;
  saveCalculatorSelection(selectedIds: string[]): Promise<void>;

  // Backup & Restore
  exportAllData(): Promise<StorageData>;
  importAllData(data: StorageData): Promise<void>;
}
