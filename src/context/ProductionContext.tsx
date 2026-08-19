'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  ComponentCategoryKey,
  ComponentCategoryConfig,
  OperationItem,
  ProductionOrder,
  DashboardMetrics,
  ComponentEfficiencyStat,
  TimeStudy,
  OperationTimeHistoryEntry
} from '@/types/production';
import { CATEGORIES_CONFIG, DEFAULT_CATEGORIES, DEFAULT_OPERATIONS } from '@/data/defaultData';
import { localStorageService } from '@/services/storage/localStorageService';
import { StorageData } from '@/services/storage/types';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ProductionContextType {
  // Config & Operations
  categories: ComponentCategoryConfig[];
  categoriesConfig: Record<string, ComponentCategoryConfig>;
  addCategory: (category: Omit<ComponentCategoryConfig, 'key'> & { key?: string }) => Promise<void>;
  updateCategory: (key: string, updates: Partial<ComponentCategoryConfig>) => Promise<void>;
  deleteCategory: (key: string) => Promise<void>;
  resetCategoriesToDefault: () => Promise<void>;

  operations: OperationItem[];
  isLoading: boolean;
  updateOperationTime: (
    id: string,
    newTime: number,
    notes?: string,
    source?: 'cronoanalise' | 'manual'
  ) => Promise<void>;
  updateOperationHistory: (id: string, history: OperationTimeHistoryEntry[]) => Promise<void>;
  updateOperation: (id: string, updates: Partial<OperationItem>) => Promise<void>;
  addCustomOperation: (item: Omit<OperationItem, 'id'>) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;
  resetOperationsToDefault: () => Promise<void>;

  // Calculator State
  selectedOperationIds: string[];
  toggleOperation: (id: string) => void;
  selectAllOperations: () => void;
  clearAllOperations: () => void;
  resetToStandardOperations: () => void;
  calculatorTotalMinutes: number;
  calculatorReadableTime: string;
  categoryTotals: Record<string, { totalTime: number; selectedCount: number; totalCount: number }>;

  // Production Orders (OP)
  orders: ProductionOrder[];
  addOrder: (orderData: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProductionOrder>;
  updateOrder: (order: ProductionOrder) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  recordOrderTime: (
    orderId: string,
    actualTimeTotal: number,
    componentTimes?: Record<ComponentCategoryKey, number>,
    producedQuantity?: number,
    notes?: string
  ) => Promise<void>;

  // Time Studies (Cronoanálise Lean)
  timeStudies: TimeStudy[];
  getTimeStudy: (operationId: string) => TimeStudy | undefined;
  saveTimeStudyAndApply: (study: TimeStudy, applyToCatalog?: boolean) => Promise<void>;
  deleteTimeStudy: (id: string) => Promise<void>;

  // Metrics & Efficiency
  metrics: DashboardMetrics;
  componentStats: ComponentEfficiencyStat[];

  // Export / Import
  exportData: () => Promise<StorageData>;
  importData: (data: StorageData) => Promise<void>;
  clearAllDataForProduction: () => Promise<void>;

  // Toast Helper
  toast: ToastState;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined);

export const ProductionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<ComponentCategoryConfig[]>(DEFAULT_CATEGORIES);
  const [operations, setOperations] = useState<OperationItem[]>(DEFAULT_OPERATIONS);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [timeStudies, setTimeStudies] = useState<TimeStudy[]>([]);
  const [selectedOperationIds, setSelectedOperationIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  const categoriesConfig = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.key] = cat;
      return acc;
    }, {} as Record<string, ComponentCategoryConfig>);
  }, [categories]);

  // Initial Load from Storage
  useEffect(() => {
    async function init() {
      try {
        const [loadedCats, loadedOps, loadedOrders, loadedStudies, loadedSelection] = await Promise.all([
          localStorageService.getCategories(),
          localStorageService.getOperations(),
          localStorageService.getOrders(),
          localStorageService.getTimeStudies(),
          localStorageService.getCalculatorSelection()
        ]);
        setCategories(loadedCats);
        setOperations(loadedOps);
        setOrders(loadedOrders);
        setTimeStudies(loadedStudies);
        setSelectedOperationIds(loadedSelection);
      } catch (err) {
        console.error('Error loading initial state:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Category / Block Management
  const addCategory = useCallback(async (catData: Omit<ComponentCategoryConfig, 'key'> & { key?: string }) => {
    const rawKey = catData.key?.trim() || catData.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const uniqueKey = rawKey || `cat_${Date.now()}`;
    const newCat: ComponentCategoryConfig = {
      key: uniqueKey,
      title: catData.title,
      colorHex: catData.colorHex || '#06b6d4',
      description: catData.description || '',
      icon: catData.icon || 'M4 6h16M4 12h16M4 18h16',
      orderIndex: categories.length + 1
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    await localStorageService.saveCategories(updated);
    showToast(`Bloco "${newCat.title}" criado com sucesso!`, 'success');
  }, [categories, showToast]);

  const updateCategory = useCallback(async (key: string, updates: Partial<ComponentCategoryConfig>) => {
    const updated = categories.map(cat => (cat.key === key ? { ...cat, ...updates } : cat));
    setCategories(updated);
    await localStorageService.saveCategories(updated);
    showToast('Bloco atualizado com sucesso!', 'success');
  }, [categories, showToast]);

  const deleteCategory = useCallback(async (key: string) => {
    const updatedCats = categories.filter(c => c.key !== key);
    const updatedOps = operations.filter(op => op.category !== key);
    const removedOpIds = operations.filter(op => op.category === key).map(op => op.id);

    setCategories(updatedCats);
    setOperations(updatedOps);
    setSelectedOperationIds(prev => prev.filter(id => !removedOpIds.includes(id)));

    await localStorageService.saveCategories(updatedCats);
    await localStorageService.saveOperations(updatedOps);
    showToast('Bloco e operações vinculadas removidos com sucesso!', 'info');
  }, [categories, operations, showToast]);

  const resetCategoriesToDefault = useCallback(async () => {
    const defs = await localStorageService.resetCategories();
    setCategories(defs);
    showToast('Blocos restaurados para a lista de fábrica!', 'success');
  }, [showToast]);

  // Calculator Toggles
  const toggleOperation = useCallback((id: string) => {
    setSelectedOperationIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorageService.saveCalculatorSelection(next);
      return next;
    });
  }, []);

  const selectAllOperations = useCallback(() => {
    const allIds = operations.map(op => op.id);
    setSelectedOperationIds(allIds);
    localStorageService.saveCalculatorSelection(allIds);
    showToast('Todas as operações foram marcadas!', 'info');
  }, [operations, showToast]);

  const clearAllOperations = useCallback(() => {
    setSelectedOperationIds([]);
    localStorageService.saveCalculatorSelection([]);
    showToast('Todas as operações foram desmarcadas!', 'info');
  }, [showToast]);

  const resetToStandardOperations = useCallback(() => {
    const defaultIds = operations.filter(op => op.isDefault).map(op => op.id);
    setSelectedOperationIds(defaultIds);
    localStorageService.saveCalculatorSelection(defaultIds);
    showToast('Restaurado para as Operações Padrão!', 'success');
  }, [operations, showToast]);

  // Operations Operations (Settings)
  const updateOperationTime = useCallback(async (
    id: string,
    newTime: number,
    notes?: string,
    source: 'cronoanalise' | 'manual' = 'manual'
  ) => {
    const updated = operations.map(op => {
      if (op.id === id) {
        const existingHistory = op.history || [
          {
            id: `hist-${op.id}-base`,
            operationId: op.id,
            time: op.time,
            date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: 'Tempo padrão de fábrica (Baseline inicial)',
            source: 'inicial' as const
          }
        ];

        const newEntry: OperationTimeHistoryEntry = {
          id: `hist-${Date.now()}`,
          operationId: op.id,
          time: Number(newTime),
          date: new Date().toISOString().split('T')[0],
          notes: notes || (source === 'cronoanalise' ? 'Cronoanálise Lean & Mapeamento de Micro-operações' : 'Ajuste manual de tempo'),
          source
        };

        return {
          ...op,
          time: Number(newTime),
          history: [...existingHistory, newEntry],
          updatedAt: new Date().toISOString()
        };
      }
      return op;
    });

    setOperations(updated);
    await localStorageService.saveOperations(updated);
    showToast('Tempo padrão atualizado e marco histórico registrado!', 'success');
  }, [operations, showToast]);

  const updateOperationHistory = useCallback(async (id: string, history: OperationTimeHistoryEntry[]) => {
    const latestTime = history.length > 0 ? history[history.length - 1].time : undefined;

    const updated = operations.map(op => {
      if (op.id === id) {
        return {
          ...op,
          time: latestTime !== undefined ? latestTime : op.time,
          history,
          updatedAt: new Date().toISOString()
        };
      }
      return op;
    });

    setOperations(updated);
    await localStorageService.saveOperations(updated);
  }, [operations]);

  const updateOperation = useCallback(async (id: string, updates: Partial<OperationItem>) => {
    const updated = operations.map(op => {
      if (op.id === id) {
        return {
          ...op,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return op;
    });
    setOperations(updated);
    await localStorageService.saveOperations(updated);
    showToast('Operação atualizada com sucesso!', 'success');
  }, [operations, showToast]);

  const addCustomOperation = useCallback(async (item: Omit<OperationItem, 'id'>) => {
    const newId = `${item.category}-custom-${Date.now()}`;
    const newOp: OperationItem = {
      ...item,
      id: newId,
      history: [
        {
          id: `hist-${newId}-1`,
          operationId: newId,
          time: item.time,
          date: new Date().toISOString().split('T')[0],
          notes: 'Cadastro inicial da operação customizada',
          source: 'inicial'
        }
      ],
      updatedAt: new Date().toISOString()
    };
    const updated = [...operations, newOp];
    setOperations(updated);
    await localStorageService.saveOperations(updated);
    showToast(`Operação "${item.name}" adicionada com sucesso!`, 'success');
  }, [operations, showToast]);

  const deleteOperation = useCallback(async (id: string) => {
    const updated = operations.filter(op => op.id !== id);
    setOperations(updated);
    setSelectedOperationIds(prev => prev.filter(itemId => itemId !== id));
    await localStorageService.saveOperations(updated);
    showToast('Operação removida com sucesso!', 'info');
  }, [operations, showToast]);

  const resetOperationsToDefault = useCallback(async () => {
    const defaults = await localStorageService.resetOperations();
    setOperations(defaults);
    showToast('Catálogo de tempos restaurado para os padrões de fábrica!', 'success');
  }, [showToast]);

  // Time Studies (Cronoanálise Lean)
  const getTimeStudy = useCallback((operationId: string) => {
    return timeStudies.find(s => s.operationId === operationId);
  }, [timeStudies]);

  const saveTimeStudyAndApply = useCallback(async (study: TimeStudy, applyToCatalog: boolean = true) => {
    await localStorageService.saveTimeStudy(study);
    setTimeStudies(prev => {
      const index = prev.findIndex(s => s.id === study.id || s.operationId === study.operationId);
      if (index >= 0) {
        const next = [...prev];
        next[index] = study;
        return next;
      }
      return [study, ...prev];
    });

    const newStdTime = study.stats?.totalStandardTimeMinutes ?? (study.stats as any)?.standardTimeMinutes;
    if (applyToCatalog && newStdTime && newStdTime > 0) {
      const justification =
        study.notes?.trim() ||
        `Cronoanálise Lean (${study.microOperations.length} micro-etapas)`;
      await updateOperationTime(
        study.operationId,
        newStdTime,
        justification,
        'cronoanalise'
      );
    }

    showToast(`Estudo de tempos e percurso da operação "${study.operationName}" salvo com sucesso!`, 'success');
  }, [updateOperationTime, showToast]);

  const deleteTimeStudy = useCallback(async (id: string) => {
    await localStorageService.deleteTimeStudy(id);
    setTimeStudies(prev => prev.filter(s => s.id !== id && s.operationId !== id));
    showToast('Estudo de tempos removido!', 'info');
  }, [showToast]);

  // Orders Management (OP)
  const addOrder = useCallback(async (orderData: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newOrder: ProductionOrder = {
      ...orderData,
      id: `op-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    await localStorageService.saveOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    showToast(`Ordem de Produção ${newOrder.opNumber} criada com sucesso!`, 'success');
    return newOrder;
  }, [showToast]);

  const updateOrder = useCallback(async (order: ProductionOrder) => {
    await localStorageService.saveOrder(order);
    setOrders(prev => prev.map(o => (o.id === order.id ? order : o)));
    showToast(`OP ${order.opNumber} atualizada com sucesso!`, 'success');
  }, [showToast]);

  const deleteOrder = useCallback(async (id: string) => {
    await localStorageService.deleteOrder(id);
    setOrders(prev => prev.filter(o => o.id !== id));
    showToast('Ordem de Produção removida!', 'info');
  }, [showToast]);

  const recordOrderTime = useCallback(async (
    orderId: string,
    actualTimeTotal: number,
    componentTimes?: Record<ComponentCategoryKey, number>,
    producedQuantity?: number,
    notes?: string
  ) => {
    const current = orders.find(o => o.id === orderId);
    if (!current) return;

    const completed = (producedQuantity ?? current.producedQuantity) >= current.targetQuantity;
    const updated: ProductionOrder = {
      ...current,
      actualTimeTotal,
      componentTimes: componentTimes || current.componentTimes,
      producedQuantity: producedQuantity !== undefined ? producedQuantity : current.producedQuantity,
      status: completed ? 'concluida' : 'em_producao',
      notes: notes !== undefined ? notes : current.notes,
      updatedAt: new Date().toISOString(),
      completedAt: completed ? new Date().toISOString() : current.completedAt
    };

    await localStorageService.saveOrder(updated);
    setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
    showToast(`Apontamento da OP ${updated.opNumber} registrado!`, 'success');
  }, [orders, showToast]);

  // Export / Import
  const exportData = useCallback(async () => {
    return await localStorageService.exportAllData();
  }, []);

  const importData = useCallback(async (data: StorageData) => {
    await localStorageService.importAllData(data);
    const [loadedCats, loadedOps, loadedOrders, loadedStudies, loadedSelection] = await Promise.all([
      localStorageService.getCategories(),
      localStorageService.getOperations(),
      localStorageService.getOrders(),
      localStorageService.getTimeStudies(),
      localStorageService.getCalculatorSelection()
    ]);
    setCategories(loadedCats);
    setOperations(loadedOps);
    setOrders(loadedOrders);
    setTimeStudies(loadedStudies);
    setSelectedOperationIds(loadedSelection);
    showToast('Dados importados com sucesso!', 'success');
  }, [showToast]);

  const clearAllDataForProduction = useCallback(async () => {
    if (localStorageService.clearAllDataForProduction) {
      await localStorageService.clearAllDataForProduction();
    }
    setOperations(DEFAULT_OPERATIONS);
    setOrders([]);
    setTimeStudies([]);
    const defaultIds = DEFAULT_OPERATIONS.filter(o => o.isDefault).map(o => o.id);
    setSelectedOperationIds(defaultIds);
    showToast('Banco de dados 100% limpo! Pronto para produção real.', 'success');
  }, [showToast]);

  // Calculator Totals Computation
  const { calculatorTotalMinutes, categoryTotals } = useMemo(() => {
    let grandTotal = 0;
    const catTotals: Record<string, { totalTime: number; selectedCount: number; totalCount: number }> = {};
    
    categories.forEach(cat => {
      catTotals[cat.key] = { totalTime: 0, selectedCount: 0, totalCount: 0 };
    });

    operations.forEach(item => {
      const cat = item.category;
      if (!catTotals[cat]) {
        catTotals[cat] = { totalTime: 0, selectedCount: 0, totalCount: 0 };
      }
      catTotals[cat].totalCount++;
      if (selectedOperationIds.includes(item.id)) {
        catTotals[cat].selectedCount++;
        catTotals[cat].totalTime += item.time;
        grandTotal += item.time;
      }
    });

    return {
      calculatorTotalMinutes: grandTotal,
      categoryTotals: catTotals
    };
  }, [categories, operations, selectedOperationIds]);

  const calculatorReadableTime = useMemo(() => {
    const absMinutes = Math.abs(calculatorTotalMinutes);
    const wholeMinutes = Math.floor(absMinutes);
    const seconds = Math.round((absMinutes - wholeMinutes) * 60);

    let res = '';
    if (calculatorTotalMinutes < 0) res += '- ';
    if (wholeMinutes > 0) res += `${wholeMinutes} min `;
    if (seconds > 0 || wholeMinutes === 0) res += `${seconds} s`;
    return res.trim();
  }, [calculatorTotalMinutes]);

  // Global Metrics Computation
  const metrics: DashboardMetrics = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'concluida').length;
    const inProgressOrders = orders.filter(o => o.status === 'em_producao').length;
    const plannedOrders = orders.filter(o => o.status === 'planejada').length;

    let totalPlannedUnits = 0;
    let totalProducedUnits = 0;
    let globalStandardMinutes = 0;
    let globalActualMinutes = 0;

    orders.forEach(order => {
      totalPlannedUnits += order.targetQuantity;
      totalProducedUnits += order.producedQuantity;

      const stdForProduced = (order.standardTimePerBag || 0) * (order.producedQuantity || 0);
      globalStandardMinutes += stdForProduced;

      if (order.actualTimeTotal && order.actualTimeTotal > 0) {
        globalActualMinutes += order.actualTimeTotal;
      }
    });

    const globalEfficiency =
      globalActualMinutes > 0 ? (globalStandardMinutes / globalActualMinutes) * 100 : 100;

    return {
      totalOrders,
      completedOrders,
      inProgressOrders,
      plannedOrders,
      totalPlannedUnits,
      totalProducedUnits,
      globalStandardMinutes,
      globalActualMinutes,
      globalEfficiency
    };
  }, [orders]);

  // Component Efficiency Statistics for Dashboard
  const componentStats: ComponentEfficiencyStat[] = useMemo(() => {
    return categories.map(cat => {
      let standardMinutes = 0;
      let actualMinutes = 0;
      let countUsage = 0;

      orders.forEach(order => {
        const catOps = operations.filter(
          op => op.category === cat.key && order.selectedOperationIds.includes(op.id)
        );
        const catStdTimePerBag = catOps.reduce((sum, op) => sum + op.time, 0);
        const totalCatStd = catStdTimePerBag * (order.producedQuantity || 0);

        if (totalCatStd > 0) {
          standardMinutes += totalCatStd;
          countUsage += order.producedQuantity || 0;
        }

        if (order.componentTimes && order.componentTimes[cat.key]) {
          actualMinutes += order.componentTimes[cat.key] || 0;
        }
      });

      const effectiveActual = actualMinutes > 0 ? actualMinutes : standardMinutes;
      const efficiency =
        effectiveActual > 0 ? (standardMinutes / effectiveActual) * 100 : 100;

      return {
        category: cat.key,
        title: cat.title,
        colorHex: cat.colorHex,
        standardMinutes,
        actualMinutes: effectiveActual,
        efficiency,
        countUsage
      };
    });
  }, [categories, orders, operations]);

  return (
    <ProductionContext.Provider
      value={{
        categories,
        categoriesConfig,
        addCategory,
        updateCategory,
        deleteCategory,
        resetCategoriesToDefault,
        operations,
        isLoading,
        updateOperationTime,
        updateOperationHistory,
        updateOperation,
        addCustomOperation,
        deleteOperation,
        resetOperationsToDefault,
        selectedOperationIds,
        toggleOperation,
        selectAllOperations,
        clearAllOperations,
        resetToStandardOperations,
        calculatorTotalMinutes,
        calculatorReadableTime,
        categoryTotals,
        orders,
        addOrder,
        updateOrder,
        deleteOrder,
        recordOrderTime,
        timeStudies,
        getTimeStudy,
        saveTimeStudyAndApply,
        deleteTimeStudy,
        metrics,
        componentStats,
        exportData,
        importData,
        clearAllDataForProduction,
        toast,
        showToast
      }}
    >
      {children}
    </ProductionContext.Provider>
  );
};

export const useProduction = () => {
  const context = useContext(ProductionContext);
  if (!context) {
    throw new Error('useProduction must be used within a ProductionProvider');
  }
  return context;
};
