'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  ComponentCategoryKey,
  ComponentCategoryConfig,
  OperationItem,
  TimeStudy,
  OperationTimeHistoryEntry,
  KaizenAction,
  CellProductionConfig,
  FinancialImpactConfig,
  MonthlyClosingRecord
} from '@/types/production';
import { CATEGORIES_CONFIG, DEFAULT_CATEGORIES, DEFAULT_OPERATIONS, DEFAULT_CELL_CONFIG, DEFAULT_FINANCIAL_CONFIG } from '@/data/defaultData';
import { storage as localStorageService } from '@/services/storage';
import { StorageData } from '@/services/storage/types';
import {
  getCurrentMonthKey,
  getMonthLabel,
  getLastDayOfMonth,
  checkAndPerformMonthRollover
} from '@/utils/monthAutomation';

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
  updateOperationCustomVolume: (id: string, customVolume?: number) => Promise<void>;
  changeActiveMonth: (monthKey: string) => Promise<void>;
  startNewMonth: (monthKey: string, volume: number, monthLabel?: string) => Promise<void>;
  resetCurrentMonthMeasurements: () => Promise<void>;
  saveMonthlyClosing: (monthKey: string, summary: Partial<MonthlyClosingRecord>) => Promise<void>;
  triggerMonthRolloverCheck: () => Promise<void>;

  // Kaizen Operations & Lifecycle
  registerKaizenAction: (operationId: string, description?: string, responsible?: string) => Promise<void>;
  discardKaizenOpportunity: (operationId: string, reason?: string) => Promise<void>;
  completeKaizenWithMeasurement: (operationId: string, newTime: number, notes?: string, responsible?: string) => Promise<void>;

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

  // Access Modes & Link Permissions (Operador vs Gestão Completa)
  accessMode: 'full' | 'calculator_only';
  setAccessMode: (mode: 'full' | 'calculator_only') => void;
  isCalculatorOnly: boolean;

  // Cloud & Offline Status
  connectionStatus: 'online' | 'offline' | 'syncing' | 'connecting';
  isSupabaseOnline: boolean;
  hasPendingSync: boolean;
  checkConnection: () => Promise<boolean>;
  syncLocalToCloud: () => Promise<void>;

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
  const [accessMode, setAccessModeState] = useState<'full' | 'calculator_only'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const mode = (params.get('mode') || params.get('access') || params.get('view') || '').toLowerCase();
        if (['operador', 'calc', 'calculator', 'operator', 'fabrica'].includes(mode)) {
          return 'calculator_only';
        }
        if (['full', 'admin', 'master', 'gestao', 'engenharia'].includes(mode)) {
          return 'full';
        }
        const saved = localStorage.getItem('bagtime_access_mode');
        if (saved === 'calculator_only') return 'calculator_only';
      } catch (e) {
        console.error('Error in initial accessMode evaluation:', e);
      }
    }
    return 'full';
  });
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  // Cloud & Offline Status
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing' | 'connecting'>('connecting');
  const [hasPendingSync, setHasPendingSync] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(localStorage.getItem('bigbag_pending_offline_sync'));
    }
    return false;
  });

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      setConnectionStatus('offline');
      return false;
    }

    try {
      if (localStorageService.checkHealth) {
        const isHealthy = await localStorageService.checkHealth();
        setConnectionStatus(isHealthy ? 'online' : 'offline');
        return isHealthy;
      }
      setConnectionStatus('offline');
      return false;
    } catch {
      setConnectionStatus('offline');
      return false;
    }
  }, []);

  const syncLocalToCloud = useCallback(async () => {
    if (connectionStatus === 'syncing') return;
    setConnectionStatus('syncing');

    try {
      if (localStorageService.syncOfflineDataToCloud) {
        const result = await localStorageService.syncOfflineDataToCloud();
        if (result.success) {
          setHasPendingSync(false);
          setConnectionStatus('online');
          showToast(result.message, 'success');
          // Recarregar dados mais recentes da nuvem
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
        } else {
          setConnectionStatus('offline');
          showToast(result.message, 'error');
        }
      } else {
        setConnectionStatus('offline');
      }
    } catch (e: any) {
      setConnectionStatus('offline');
      showToast(`Erro na sincronização: ${e?.message || 'Falha de rede'}`, 'error');
    }
  }, [connectionStatus, showToast]);

  const isSupabaseOnline = connectionStatus === 'online';

  useEffect(() => {
    checkConnection();

    const handleOnline = () => {
      checkConnection().then(isOnline => {
        if (isOnline) {
          showToast('Conexão restabelecida! Nuvem online.', 'success');
          if (typeof window !== 'undefined' && localStorage.getItem('bigbag_pending_offline_sync')) {
            syncLocalToCloud();
          }
        }
      });
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
      showToast('Sem conexão de rede. Modo Offline ativado: dados salvos localmente.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      checkConnection();
    }, 45000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection, syncLocalToCloud, showToast]);

  // Detect access mode from URL query param (?mode=calc or ?mode=full) or localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams(window.location.search);
      const modeParam = (params.get('mode') || params.get('access') || params.get('view') || '').toLowerCase();

      if (['operador', 'calc', 'calculator', 'operator', 'fabrica'].includes(modeParam)) {
        setAccessModeState('calculator_only');
        localStorage.setItem('bagtime_access_mode', 'calculator_only');
        return;
      }

      if (['full', 'admin', 'master', 'gestao', 'engenharia'].includes(modeParam)) {
        setAccessModeState('full');
        localStorage.setItem('bagtime_access_mode', 'full');
        return;
      }

      // Check stored preference
      const saved = localStorage.getItem('bagtime_access_mode');
      if (saved === 'calculator_only') {
        setAccessModeState('calculator_only');
      }
    } catch (e) {
      console.error('Error parsing access mode:', e);
    }
  }, []);

  const setAccessMode = useCallback((mode: 'full' | 'calculator_only') => {
    setAccessModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bagtime_access_mode', mode);
    }
  }, []);

  const isCalculatorOnly = accessMode === 'calculator_only';

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
        setTimeStudies(loadedStudies);
        setSelectedOperationIds(loadedSelection);
        if (loadedCell) setCellConfig(loadedCell);

        // Verificação e virada automática de mês no arranque da aplicação
        const effectiveFin = loadedFin || DEFAULT_FINANCIAL_CONFIG;
        const rolloverResult = checkAndPerformMonthRollover(loadedOps, effectiveFin);

        if (rolloverResult.rolledOver) {
          console.log('[AutoMonthRollover on Init]', rolloverResult.message);
          setOperations(rolloverResult.updatedOperations);
          setFinancialConfig(rolloverResult.updatedFinConfig);
          await Promise.all([
            localStorageService.saveOperations(rolloverResult.updatedOperations),
            localStorageService.saveFinancialConfig ? localStorageService.saveFinancialConfig(rolloverResult.updatedFinConfig) : Promise.resolve()
          ]);
        } else {
          setOperations(rolloverResult.updatedOperations);
          setFinancialConfig(rolloverResult.updatedFinConfig);
          if (rolloverResult.updatedFinConfig !== effectiveFin && localStorageService.saveFinancialConfig) {
            await localStorageService.saveFinancialConfig(rolloverResult.updatedFinConfig);
          }
          // Sincroniza o cache local do navegador com a nuvem
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('bigbag_production_operations_v1', JSON.stringify(rolloverResult.updatedOperations));
              localStorage.setItem('bigbag_financial_config_v1', JSON.stringify(rolloverResult.updatedFinConfig));
            } catch (e) {
              console.error('Error syncing localStorage on init:', e);
            }
          }
        }
      } catch (err) {
        console.error('Error loading initial state:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Referências sincronizadas para verificação periódica de virada de mês
  const operationsRef = React.useRef(operations);
  operationsRef.current = operations;
  const financialConfigRef = React.useRef(financialConfig);
  financialConfigRef.current = financialConfig;

  const triggerMonthRolloverCheck = useCallback(async () => {
    const currentOps = operationsRef.current;
    const currentFin = financialConfigRef.current;
    if (!currentOps || !currentFin) return;

    const result = checkAndPerformMonthRollover(currentOps, currentFin);
    if (result.rolledOver) {
      setOperations(result.updatedOperations);
      setFinancialConfig(result.updatedFinConfig);
      await Promise.all([
        localStorageService.saveOperations(result.updatedOperations),
        localStorageService.saveFinancialConfig ? localStorageService.saveFinancialConfig(result.updatedFinConfig) : Promise.resolve()
      ]);
      showToast(result.message || 'Virada de mês automática concluída!', 'success');
    }
  }, [showToast]);

  // Monitoramento contínuo: checa a cada 60s ou quando a aba ganha foco
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      triggerMonthRolloverCheck();
    }, 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerMonthRolloverCheck();
      }
    };
    const handleFocus = () => {
      triggerMonthRolloverCheck();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isLoading, triggerMonthRolloverCheck]);

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

  // Kaizen Operations & Lifecycle
  const registerKaizenAction = useCallback(async (
    operationId: string,
    description: string = 'Melhoria Lean de Processo',
    responsible: string = 'Eng. de Processos'
  ) => {
    const updated = operations.map(op => {
      if (op.id === operationId) {
        const baseline = op.previousTime ?? (op.initialTime ?? op.time);
        const action: KaizenAction = {
          id: `kaizen-action-${Date.now()}`,
          operationId: op.id,
          status: 'registered',
          registeredAt: new Date().toISOString(),
          opportunityTime: op.time,
          baselineTime: baseline,
          actionDescription: description.trim() || 'Melhoria Lean de Processo',
          responsible: responsible.trim() || 'Eng. de Processos'
        };
        return {
          ...op,
          kaizenAction: action,
          updatedAt: new Date().toISOString()
        };
      }
      return op;
    });

    setOperations(updated);
    await localStorageService.saveOperations(updated);
    showToast('Ação Kaizen registrada! Realize a nova medição para comprovar os ganhos.', 'info');
  }, [operations, showToast]);

  const discardKaizenOpportunity = useCallback(async (
    operationId: string,
    reason: string = 'Oportunidade encerrada sem realização de Kaizen'
  ) => {
    const updated = operations.map(op => {
      if (op.id === operationId) {
        const baseline = op.previousTime ?? (op.initialTime ?? op.time);
        const lostAction: KaizenAction = {
          id: `kaizen-lost-${Date.now()}`,
          operationId: op.id,
          status: 'lost',
          registeredAt: op.kaizenAction?.registeredAt || new Date().toISOString(),
          opportunityTime: op.time,
          baselineTime: baseline,
          lostAt: new Date().toISOString(),
          lostReason: reason
        };
        return {
          ...op,
          kaizenAction: lostAction,
          kaizenHistory: [...(op.kaizenHistory || []), lostAction],
          updatedAt: new Date().toISOString()
        };
      }
      return op;
    });

    setOperations(updated);
    await localStorageService.saveOperations(updated);
    showToast('Oportunidade encerrada como perdida.', 'info');
  }, [operations, showToast]);

  // Operations Operations (Settings)
  const updateOperationTime = useCallback(async (
    id: string,
    newTime: number,
    notes?: string,
    source: 'cronoanalise' | 'manual' = 'manual'
  ) => {
    let toastMsg = 'Tempo padrão atualizado e marco histórico registrado!';
    let toastType: 'success' | 'info' | 'error' = 'success';

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

        const parsedNew = Number(newTime);
        const currentTime = op.time;
        const baselineTime = op.previousTime ?? (op.initialTime ?? op.time);
        const wasOpportunity = currentTime > (baselineTime + 0.001);

        let updatedKaizenAction = op.kaizenAction;
        let updatedKaizenHistory = op.kaizenHistory ? [...op.kaizenHistory] : [];
        let isKaizenGain = false;

        // 1. Cenário: Ação Kaizen estava formalmente registrada
        if (op.kaizenAction && op.kaizenAction.status === 'registered') {
          if (parsedNew < op.kaizenAction.opportunityTime) {
            // GANHO KAIZEN CONQUISTADO!
            const savedMin = op.kaizenAction.opportunityTime - parsedNew;
            const completedKaizen: KaizenAction = {
              ...op.kaizenAction,
              status: 'completed',
              completedAt: new Date().toISOString(),
              newMeasuredTime: parsedNew,
              savedMinutes: Number(savedMin.toFixed(2))
            };
            updatedKaizenAction = completedKaizen;
            updatedKaizenHistory.push(completedKaizen);
            isKaizenGain = true;
            toastMsg = `🎉 Ganho Kaizen Conquistado para "${op.name}"! Redução de ${savedMin.toFixed(2)} min confirmada pela nova medição!`;
            toastType = 'success';
          } else {
            toastMsg = `Nova medição registrada para "${op.name}". O tempo ainda não reduziu o desvio.`;
            toastType = 'info';
          }
        }
        // 2. Cenário: Havia oportunidade em aberto MAS SEM Kaizen registrado
        else if (wasOpportunity && (!op.kaizenAction || op.kaizenAction.status !== 'registered')) {
          // Oportunidade Perdida!
          const lostKaizen: KaizenAction = {
            id: `kaizen-lost-${Date.now()}`,
            operationId: op.id,
            status: 'lost',
            registeredAt: op.updatedAt || new Date().toISOString(),
            opportunityTime: currentTime,
            baselineTime: baselineTime,
            lostAt: new Date().toISOString(),
            lostReason: 'Nova medição realizada sem registro prévio de Kaizen'
          };
          updatedKaizenAction = lostKaizen;
          updatedKaizenHistory.push(lostKaizen);
          toastMsg = `⚠️ Nova medição registrada sem Kaizen prévio para "${op.name}". A oportunidade de melhoria foi perdida.`;
          toastType = 'info';
        }
        // 3. Cenário: Novo aumento de tempo registrado (cria nova oportunidade futura)
        else if (parsedNew > currentTime + 0.001) {
          updatedKaizenAction = undefined; // Libera para registro de nova ação Kaizen
          toastMsg = `Tempo aumentado para "${op.name}". Nova oportunidade Kaizen gerada!`;
          toastType = 'info';
        }

        const newEntry: OperationTimeHistoryEntry = {
          id: `hist-${Date.now()}`,
          operationId: op.id,
          time: parsedNew,
          date: new Date().toISOString().split('T')[0],
          notes: notes || (isKaizenGain
            ? `Ganho Kaizen Conquistado: redução de ${(op.kaizenAction?.opportunityTime ? op.kaizenAction.opportunityTime - parsedNew : 0).toFixed(2)} min`
            : source === 'cronoanalise'
              ? 'Cronoanálise Lean & Mapeamento de Micro-operações'
              : 'Ajuste manual de tempo'),
          source,
          isKaizenGain,
          kaizenActionId: isKaizenGain ? updatedKaizenAction?.id : undefined
        };

        const initialBaseline = op.initialTime ?? (existingHistory[0]?.time ?? op.time);

        return {
          ...op,
          previousTime: op.time, // A medição anterior torna-se o novo ponto de partida para a próxima comparação
          initialTime: initialBaseline,
          time: parsedNew,
          history: [...existingHistory, newEntry],
          kaizenAction: updatedKaizenAction,
          kaizenHistory: updatedKaizenHistory,
          updatedAt: new Date().toISOString()
        };
      }
      return op;
    });

    setOperations(updated);
    await localStorageService.saveOperations(updated);
    showToast(toastMsg, toastType);
  }, [operations, showToast]);

  const completeKaizenWithMeasurement = useCallback(async (
    operationId: string,
    newTime: number,
    notes: string = 'Kaizen Lean: redução de tempo de ciclo',
    responsible: string = 'Eng. de Processos'
  ) => {
    const op = operations.find(o => o.id === operationId);
    if (!op) return;

    const baseline = op.previousTime ?? (op.initialTime ?? op.time);
    const regAction: KaizenAction = {
      id: `kaizen-${Date.now()}`,
      operationId: op.id,
      status: 'registered',
      registeredAt: new Date().toISOString(),
      opportunityTime: op.time,
      baselineTime: baseline,
      actionDescription: notes,
      responsible
    };

    // Salva com status 'registered' para que updateOperationTime valide o ganho
    const opWithRegistered = operations.map(o => o.id === operationId ? { ...o, kaizenAction: regAction } : o);
    setOperations(opWithRegistered);
    await localStorageService.saveOperations(opWithRegistered);

    await updateOperationTime(operationId, newTime, notes, 'cronoanalise');
  }, [operations, updateOperationTime]);

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

  const updateOperationCustomVolume = useCallback(async (id: string, customVolume?: number) => {
    const updated = operations.map(op => {
      if (op.id === id) {
        return {
          ...op,
          customVolume: customVolume !== undefined && customVolume > 0 ? Number(customVolume) : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return op;
    });
    setOperations(updated);
    await localStorageService.saveOperations(updated);
    showToast(
      customVolume !== undefined && customVolume > 0
        ? `Volume específico de ${customVolume.toLocaleString('pt-BR')} bags definido para a operação!`
        : 'Volume da operação restaurado para o volume total do mês.',
      'info'
    );
  }, [operations, showToast]);

  const updateOperationHistory = useCallback(async (id: string, history: OperationTimeHistoryEntry[]) => {
    const latestTime = history.length > 0 ? history[history.length - 1].time : undefined;
    const priorTime = history.length > 1 ? history[history.length - 2].time : undefined;

    const updated = operations.map(op => {
      if (op.id === id) {
        return {
          ...op,
          time: latestTime !== undefined ? latestTime : op.time,
          ...(priorTime !== undefined ? { previousTime: priorTime } : {}),
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
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('bigbag_production_categories_v1');
        localStorage.removeItem('bigbag_production_operations_v1');
        localStorage.removeItem('bigbag_production_time_studies_v1');
        localStorage.removeItem('bigbag_calculator_selection_v1');
        localStorage.removeItem('bigbag_cell_config_v1');
        localStorage.removeItem('bigbag_financial_config_v1');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    }
    setCategories(DEFAULT_CATEGORIES);
    setOperations(DEFAULT_OPERATIONS);
    setTimeStudies([]);
    const defaultIds = DEFAULT_OPERATIONS.filter(o => o.isDefault).map(o => o.id);
    setSelectedOperationIds(defaultIds);
    setCellConfig(DEFAULT_CELL_CONFIG);
    setFinancialConfig(DEFAULT_FINANCIAL_CONFIG);
    showToast('Sistema, banco de dados e armazenamento local limpos! Pronto para uso oficial.', 'success');
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

  const startNewMonth = useCallback(async (monthKey: string, volume: number, monthLabel?: string) => {
    // 1. All operations advance: current measured time becomes the new baseline reference for the new month!
    setOperations(prevOps => {
      const updated = prevOps.map(op => ({
        ...op,
        previousTime: op.time // O tempo medido vira o ponto de partida (delta = 0, balanço zerado)
      }));
      if (localStorageService.saveOperations) {
        localStorageService.saveOperations(updated);
      }
      return updated;
    });

    // 2. Initialize new month record with clean zero balance
    setFinancialConfig(prev => {
      const existingHistory = prev.monthlyHistory || {};
      const [year, monthNum] = monthKey.split('-');
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const defaultLabel = `${monthNames[parseInt(monthNum, 10) - 1] || monthNum}/${year}`;

      const updated: FinancialImpactConfig = {
        ...prev,
        activeMonthKey: monthKey,
        monthlyVolume: volume,
        monthlyHistory: {
          ...existingHistory,
          [monthKey]: {
            monthKey,
            monthLabel: monthLabel || defaultLabel,
            volume,
            defaultHourlyRate: prev.defaultHourlyRate,
            grossSavings: 0,
            totalSavings: 0,
            totalLosses: 0,
            netSavings: 0,
            hoursSaved: 0,
            hoursLost: 0,
            netHours: 0,
            isClosed: false
          }
        }
      };

      if (localStorageService.saveFinancialConfig) {
        localStorageService.saveFinancialConfig(updated);
      }
      return updated;
    });

    showToast(`Novo mês ${monthKey} iniciado com medições zeradas!`, 'success');
  }, [showToast]);

  const resetCurrentMonthMeasurements = useCallback(async () => {
    // Resets current month baseline by aligning previousTime = op.time for all operations
    setOperations(prevOps => {
      const updated = prevOps.map(op => ({
        ...op,
        previousTime: op.time
      }));
      if (localStorageService.saveOperations) {
        localStorageService.saveOperations(updated);
      }
      return updated;
    });
    showToast('Medições do mês atual reiniciadas! Balanço zerado para novo ciclo.', 'success');
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
        closedAt: summary.isClosed
          ? (summary.closedAt || getLastDayOfMonth(monthKey))
          : currentRec?.closedAt
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
        updateOperationCustomVolume,
        changeActiveMonth,
        startNewMonth,
        resetCurrentMonthMeasurements,
        saveMonthlyClosing,
        triggerMonthRolloverCheck,
        registerKaizenAction,
        discardKaizenOpportunity,
        completeKaizenWithMeasurement,
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
        accessMode,
        setAccessMode,
        isCalculatorOnly,
        connectionStatus,
        isSupabaseOnline,
        hasPendingSync,
        checkConnection,
        syncLocalToCloud,
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
