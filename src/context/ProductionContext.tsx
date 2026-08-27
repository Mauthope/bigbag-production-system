'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  ComponentCategoryKey,
  ComponentCategoryConfig,
  OperationItem,
  TimeStudy,
  OperationTimeHistoryEntry,
  CellProductionConfig,
  FinancialImpactConfig,
  MonthlyClosingRecord
} from '@/types/production';
import { CATEGORIES_CONFIG, DEFAULT_CATEGORIES, DEFAULT_OPERATIONS, DEFAULT_CELL_CONFIG, DEFAULT_FINANCIAL_CONFIG } from '@/data/defaultData';
import { localStorageService } from '@/services/storage/localStorageService';
import { StorageData } from '@/services/storage/types';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ProductionContextType {
  // Config & Categories
  categories: ComponentCategoryConfig[];
  categoriesConfig: Record<string, ComponentCategoryConfig>;
  addCategory: (category: Omit<ComponentCategoryConfig, 'key'> & { key?: string }) => Promise<void>;
  updateCategory: (key: string, updates: Partial<ComponentCategoryConfig>) => Promise<void>;
  deleteCategory: (key: string) => Promise<void>;
  resetCategoriesToDefault: () => Promise<void>;

  // Cell & Headcount Config (Pessoas nas células)
  cellConfig: CellProductionConfig;
  updateCellConfig: (updates: Partial<CellProductionConfig>) => Promise<void>;
  resetCellConfig: () => Promise<void>;

  // Financial Impact Config & ROI Indicators
  financialConfig: FinancialImpactConfig;
  updateFinancialConfig: (updates: Partial<FinancialImpactConfig>) => Promise<void>;
  resetFinancialConfig: () => Promise<void>;
  updateOperationBaseline: (id: string, initialTime?: number, previousTime?: number) => Promise<void>;
  changeActiveMonth: (monthKey: string) => Promise<void>;
  saveMonthlyClosing: (monthKey: string, summary: Partial<MonthlyClosingRecord>) => Promise<void>;

  // Operations Catalog
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

  // Calculator State & Totals
  selectedOperationIds: string[];
  toggleOperation: (id: string) => void;
  selectAllOperations: () => void;
  clearAllOperations: () => void;
  resetToStandardOperations: () => void;
  calculatorTotalMinutes: number;
  calculatorReadableTime: string;
  categoryTotals: Record<string, { totalTime: number; selectedCount: number; totalCount: number }>;

  // Time Studies (Cronoanálise Lean)
  timeStudies: TimeStudy[];
  getTimeStudy: (operationId: string) => TimeStudy | undefined;
  saveTimeStudyAndApply: (study: TimeStudy, applyToCatalog?: boolean) => Promise<void>;
  deleteTimeStudy: (id: string) => Promise<void>;

  // Backup & Restore
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
  const [cellConfig, setCellConfig] = useState<CellProductionConfig>(DEFAULT_CELL_CONFIG);
  const [financialConfig, setFinancialConfig] = useState<FinancialImpactConfig>(DEFAULT_FINANCIAL_CONFIG);
  const [operations, setOperations] = useState<OperationItem[]>(DEFAULT_OPERATIONS);
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
        const [loadedCats, loadedOps, loadedStudies, loadedSelection, loadedCell, loadedFin] = await Promise.all([
          localStorageService.getCategories(),
          localStorageService.getOperations(),
          localStorageService.getTimeStudies(),
          localStorageService.getCalculatorSelection(),
          localStorageService.getCellConfig ? localStorageService.getCellConfig() : Promise.resolve(DEFAULT_CELL_CONFIG),
          localStorageService.getFinancialConfig ? localStorageService.getFinancialConfig() : Promise.resolve(DEFAULT_FINANCIAL_CONFIG)
        ]);
        setCategories(loadedCats);
        setOperations(loadedOps);
        setTimeStudies(loadedStudies);
        setSelectedOperationIds(loadedSelection);
        if (loadedCell) setCellConfig(loadedCell);
        if (loadedFin) setFinancialConfig(loadedFin);
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
    if (localStorageService.resetCategories) {
      const defs = await localStorageService.resetCategories();
      setCategories(defs);
      showToast('Blocos restaurados para a lista de fábrica!', 'success');
    }
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

        const initialBaseline = op.initialTime ?? (existingHistory[0]?.time ?? op.time);

        return {
          ...op,
          previousTime: op.time, // A medição anterior torna-se o novo ponto de partida para a próxima comparação
          initialTime: initialBaseline,
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

  const updateOperationBaseline = useCallback(async (id: string, initialTime?: number, previousTime?: number) => {
    const updated = operations.map(op => {
      if (op.id === id) {
        return {
          ...op,
          ...(initialTime !== undefined ? { initialTime: Number(initialTime) } : {}),
          ...(previousTime !== undefined ? { previousTime: Number(previousTime) } : {}),
          updatedAt: new Date().toISOString()
        };
      }
      return op;
    });
    setOperations(updated);
    await localStorageService.saveOperations(updated);
    showToast('Ponto de partida atualizado com sucesso!', 'success');
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

  // Export / Import
  const exportData = useCallback(async () => {
    return await localStorageService.exportAllData();
  }, []);

  const importData = useCallback(async (data: StorageData) => {
    await localStorageService.importAllData(data);
    const [loadedCats, loadedOps, loadedStudies, loadedSelection] = await Promise.all([
      localStorageService.getCategories(),
      localStorageService.getOperations(),
      localStorageService.getTimeStudies(),
      localStorageService.getCalculatorSelection()
    ]);
    setCategories(loadedCats);
    setOperations(loadedOps);
    setTimeStudies(loadedStudies);
    setSelectedOperationIds(loadedSelection);
    showToast('Dados importados com sucesso!', 'success');
  }, [showToast]);

  const clearAllDataForProduction = useCallback(async () => {
    if (localStorageService.clearAllDataForProduction) {
      await localStorageService.clearAllDataForProduction();
    }
    setOperations(DEFAULT_OPERATIONS);
    setTimeStudies([]);
    const defaultIds = DEFAULT_OPERATIONS.filter(o => o.isDefault).map(o => o.id);
    setSelectedOperationIds(defaultIds);
    showToast('Banco de dados limpo! Pronto para uso.', 'success');
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

  const updateCellConfig = useCallback(async (updates: Partial<CellProductionConfig>) => {
    setCellConfig(prev => {
      const updated = { ...prev, ...updates };
      if (localStorageService.saveCellConfig) {
        localStorageService.saveCellConfig(updated);
      }
      return updated;
    });
    showToast('Configuração da célula atualizada!', 'success');
  }, [showToast]);

  const resetCellConfig = useCallback(async () => {
    setCellConfig(DEFAULT_CELL_CONFIG);
    if (localStorageService.saveCellConfig) {
      await localStorageService.saveCellConfig(DEFAULT_CELL_CONFIG);
    }
    showToast('Pessoas na célula redefinidas para o padrão (8.5 One / 11.0 Travado).', 'info');
  }, [showToast]);

  const updateFinancialConfig = useCallback(async (updates: Partial<FinancialImpactConfig>) => {
    setFinancialConfig(prev => {
      const updated = { ...prev, ...updates };
      // If monthlyVolume changed, update the active month record as well
      if (updates.monthlyVolume !== undefined && prev.activeMonthKey) {
        const history = updated.monthlyHistory || {};
        const activeMonth = history[prev.activeMonthKey];
        if (activeMonth) {
          updated.monthlyHistory = {
            ...history,
            [prev.activeMonthKey]: {
              ...activeMonth,
              volume: updates.monthlyVolume
            }
          };
        }
      }
      if (localStorageService.saveFinancialConfig) {
        localStorageService.saveFinancialConfig(updated);
      }
      return updated;
    });
    showToast('Parâmetros de impacto financeiro atualizados!', 'success');
  }, [showToast]);

  const changeActiveMonth = useCallback(async (monthKey: string) => {
    setFinancialConfig(prev => {
      const existingHistory = prev.monthlyHistory || {};
      const targetMonth = existingHistory[monthKey];
      
      const newVolume = targetMonth ? targetMonth.volume : prev.monthlyVolume;
      const updated: FinancialImpactConfig = {
        ...prev,
        activeMonthKey: monthKey,
        monthlyVolume: newVolume
      };

      if (!targetMonth) {
        const [year, monthNum] = monthKey.split('-');
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const monthLabel = `${monthNames[parseInt(monthNum, 10) - 1] || monthNum}/${year}`;

        updated.monthlyHistory = {
          ...existingHistory,
          [monthKey]: {
            monthKey,
            monthLabel,
            volume: newVolume,
            defaultHourlyRate: prev.defaultHourlyRate,
            totalSavings: 0,
            totalLosses: 0,
            netSavings: 0,
            hoursSaved: 0,
            hoursLost: 0,
            netHours: 0,
            isClosed: false
          }
        };
      }

      if (localStorageService.saveFinancialConfig) {
        localStorageService.saveFinancialConfig(updated);
      }
      return updated;
    });
    showToast(`Mês de referência alterado para ${monthKey}!`, 'info');
  }, [showToast]);

  const saveMonthlyClosing = useCallback(async (monthKey: string, summary: Partial<MonthlyClosingRecord>) => {
    setFinancialConfig(prev => {
      const existingHistory = prev.monthlyHistory || {};
      const currentRec = existingHistory[monthKey];
      const [year, monthNum] = monthKey.split('-');
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const defaultLabel = `${monthNames[parseInt(monthNum, 10) - 1] || monthNum}/${year}`;

      const updatedRecord: MonthlyClosingRecord = {
        monthKey,
        monthLabel: currentRec?.monthLabel || defaultLabel,
        volume: summary.volume !== undefined ? summary.volume : (currentRec?.volume || prev.monthlyVolume),
        defaultHourlyRate: summary.defaultHourlyRate !== undefined ? summary.defaultHourlyRate : (currentRec?.defaultHourlyRate || prev.defaultHourlyRate),
        totalSavings: summary.totalSavings !== undefined ? summary.totalSavings : (currentRec?.totalSavings || 0),
        totalLosses: summary.totalLosses !== undefined ? summary.totalLosses : (currentRec?.totalLosses || 0),
        netSavings: summary.netSavings !== undefined ? summary.netSavings : (currentRec?.netSavings || 0),
        hoursSaved: summary.hoursSaved !== undefined ? summary.hoursSaved : (currentRec?.hoursSaved || 0),
        hoursLost: summary.hoursLost !== undefined ? summary.hoursLost : (currentRec?.hoursLost || 0),
        netHours: summary.netHours !== undefined ? summary.netHours : (currentRec?.netHours || 0),
        isClosed: summary.isClosed !== undefined ? summary.isClosed : (currentRec?.isClosed || false),
        closedAt: summary.isClosed ? new Date().toISOString().split('T')[0] : currentRec?.closedAt
      };

      const updated: FinancialImpactConfig = {
        ...prev,
        monthlyHistory: {
          ...existingHistory,
          [monthKey]: updatedRecord
        }
      };

      if (localStorageService.saveFinancialConfig) {
        localStorageService.saveFinancialConfig(updated);
      }
      return updated;
    });
    showToast(`Mês ${monthKey} consolidado e salvo com sucesso!`, 'success');
  }, [showToast]);

  const resetFinancialConfig = useCallback(async () => {
    setFinancialConfig(DEFAULT_FINANCIAL_CONFIG);
    if (localStorageService.saveFinancialConfig) {
      await localStorageService.saveFinancialConfig(DEFAULT_FINANCIAL_CONFIG);
    }
    showToast('Parâmetros financeiros redefinidos para o padrão.', 'info');
  }, [showToast]);

  return (
    <ProductionContext.Provider
      value={{
        categories,
        categoriesConfig,
        addCategory,
        updateCategory,
        deleteCategory,
        resetCategoriesToDefault,
        cellConfig,
        updateCellConfig,
        resetCellConfig,
        financialConfig,
        updateFinancialConfig,
        resetFinancialConfig,
        updateOperationBaseline,
        changeActiveMonth,
        saveMonthlyClosing,
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
        timeStudies,
        getTimeStudy,
        saveTimeStudyAndApply,
        deleteTimeStudy,
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
