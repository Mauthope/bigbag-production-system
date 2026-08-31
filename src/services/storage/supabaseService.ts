import { DEFAULT_CATEGORIES, DEFAULT_OPERATIONS, DEFAULT_CELL_CONFIG, DEFAULT_FINANCIAL_CONFIG } from '@/data/defaultData';
import { ComponentCategoryConfig, OperationItem, TimeStudy, CellProductionConfig, FinancialImpactConfig } from '@/types/production';
import { IStorageService, StorageData } from './types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { localStorageService } from './localStorageService';

/**
 * Supabase Storage Service
 * Comunicação direta com o banco PostgreSQL no Supabase na nuvem.
 * Mantém fallback inteligente para LocalStorage caso o Supabase não esteja configurado ou offline.
 */
export class SupabaseStorageService implements IStorageService {
  name: 'supabase' = 'supabase';

  private getClient() {
    return getSupabaseClient();
  }

  public isReady(): boolean {
    return isSupabaseConfigured();
  }

  // ============================================================================
  // 1. Categories / Blocos Operacionais
  // ============================================================================
  async getCategories(): Promise<ComponentCategoryConfig[]> {
    const client = this.getClient();
    if (!client) return localStorageService.getCategories();

    try {
      const { data, error } = await client
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error || !data || data.length === 0) {
        // Se a tabela estiver vazia, sincroniza com os defaults
        if (data && data.length === 0) {
          await this.saveCategories(DEFAULT_CATEGORIES);
        }
        return DEFAULT_CATEGORIES;
      }

      return data.map(item => ({
        key: item.key,
        title: item.title,
        icon: item.icon || undefined,
        colorClass: item.color_class || item.key,
        colorHex: item.color_hex || '#06b6d4',
        description: item.description || undefined,
        orderIndex: item.order_index ?? 0
      }));
    } catch (e) {
      console.warn('Erro ao carregar categorias do Supabase, usando LocalStorage:', e);
      return localStorageService.getCategories();
    }
  }

  async saveCategories(categories: ComponentCategoryConfig[]): Promise<void> {
    const client = this.getClient();
    if (!client) {
      return localStorageService.saveCategories(categories);
    }

    try {
      const rows = categories.map((cat, idx) => ({
        key: cat.key,
        title: cat.title,
        icon: cat.icon || null,
        color_class: cat.colorClass || cat.key,
        color_hex: cat.colorHex || '#06b6d4',
        description: cat.description || null,
        order_index: cat.orderIndex ?? idx + 1
      }));

      const { error } = await client.from('categories').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      
      // Mantém cache local sincronizado
      await localStorageService.saveCategories(categories);
    } catch (e) {
      console.error('Erro ao salvar categorias no Supabase:', e);
      await localStorageService.saveCategories(categories);
    }
  }

  async resetCategories(): Promise<ComponentCategoryConfig[]> {
    await this.saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }

  // ============================================================================
  // 2. Cell & Headcount Config
  // ============================================================================
  async getCellConfig(): Promise<CellProductionConfig> {
    const client = this.getClient();
    if (!client) return localStorageService.getCellConfig ? localStorageService.getCellConfig() : DEFAULT_CELL_CONFIG;

    try {
      const { data, error } = await client
        .from('cell_config')
        .select('*')
        .eq('id', 'default_cell_config')
        .single();

      if (error || !data) {
        await this.saveCellConfig(DEFAULT_CELL_CONFIG);
        return DEFAULT_CELL_CONFIG;
      }

      return {
        peopleOne: Number(data.people_one) || DEFAULT_CELL_CONFIG.peopleOne,
        peopleTravado: Number(data.people_travado) || DEFAULT_CELL_CONFIG.peopleTravado,
        peopleSalaLimpa: Number(data.people_sala_limpa) || DEFAULT_CELL_CONFIG.peopleSalaLimpa,
        peopleMulti: Number(data.people_multi) || DEFAULT_CELL_CONFIG.peopleMulti,
        peopleFertilizante: Number(data.people_fertilizante) || DEFAULT_CELL_CONFIG.peopleFertilizante,
        peopleFertilizanteLiner: Number(data.people_fertilizante_liner) || DEFAULT_CELL_CONFIG.peopleFertilizanteLiner,
        shiftHours: Number(data.shift_hours) || DEFAULT_CELL_CONFIG.shiftHours
      };
    } catch (e) {
      console.warn('Erro ao carregar cellConfig do Supabase, usando LocalStorage:', e);
      return localStorageService.getCellConfig ? localStorageService.getCellConfig() : DEFAULT_CELL_CONFIG;
    }
  }

  async saveCellConfig(config: CellProductionConfig): Promise<void> {
    const client = this.getClient();
    if (!client) {
      if (localStorageService.saveCellConfig) await localStorageService.saveCellConfig(config);
      return;
    }

    try {
      const payload = {
        id: 'default_cell_config',
        people_one: config.peopleOne,
        people_travado: config.peopleTravado,
        people_sala_limpa: config.peopleSalaLimpa,
        people_multi: config.peopleMulti,
        people_fertilizante: config.peopleFertilizante,
        people_fertilizante_liner: config.peopleFertilizanteLiner,
        shift_hours: config.shiftHours,
        updated_at: new Date().toISOString()
      };

      const { error } = await client.from('cell_config').upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      if (localStorageService.saveCellConfig) await localStorageService.saveCellConfig(config);
    } catch (e) {
      console.error('Erro ao salvar cellConfig no Supabase:', e);
      if (localStorageService.saveCellConfig) await localStorageService.saveCellConfig(config);
    }
  }

  // ============================================================================
  // 3. Financial Impact & ROI Config
  // ============================================================================
  async getFinancialConfig(): Promise<FinancialImpactConfig> {
    const client = this.getClient();
    if (!client) return localStorageService.getFinancialConfig ? localStorageService.getFinancialConfig() : DEFAULT_FINANCIAL_CONFIG;

    try {
      const { data, error } = await client
        .from('financial_config')
        .select('*')
        .eq('id', 'default_financial_config')
        .single();

      if (error || !data) {
        await this.saveFinancialConfig(DEFAULT_FINANCIAL_CONFIG);
        return DEFAULT_FINANCIAL_CONFIG;
      }

      return {
        activeMonthKey: data.active_month_key || DEFAULT_FINANCIAL_CONFIG.activeMonthKey,
        monthlyVolume: Number(data.monthly_volume) || DEFAULT_FINANCIAL_CONFIG.monthlyVolume,
        defaultHourlyRate: Number(data.default_hourly_rate) || DEFAULT_FINANCIAL_CONFIG.defaultHourlyRate,
        sectorHourlyRates: data.sector_hourly_rates || {},
        comparisonBaselineMode: data.comparison_baseline_mode || 'previous',
        errorMarginPercent: Number(data.error_margin_percent) ?? 5,
        monthlyHistory: data.monthly_history || DEFAULT_FINANCIAL_CONFIG.monthlyHistory
      };
    } catch (e) {
      console.warn('Erro ao carregar financialConfig do Supabase, usando LocalStorage:', e);
      return localStorageService.getFinancialConfig ? localStorageService.getFinancialConfig() : DEFAULT_FINANCIAL_CONFIG;
    }
  }

  async saveFinancialConfig(config: FinancialImpactConfig): Promise<void> {
    const client = this.getClient();
    if (!client) {
      if (localStorageService.saveFinancialConfig) await localStorageService.saveFinancialConfig(config);
      return;
    }

    try {
      const payload = {
        id: 'default_financial_config',
        active_month_key: config.activeMonthKey,
        monthly_volume: config.monthlyVolume,
        default_hourly_rate: config.defaultHourlyRate,
        sector_hourly_rates: config.sectorHourlyRates || {},
        comparison_baseline_mode: config.comparisonBaselineMode || 'previous',
        error_margin_percent: config.errorMarginPercent ?? 5,
        monthly_history: config.monthlyHistory || {},
        updated_at: new Date().toISOString()
      };

      const { error } = await client.from('financial_config').upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      if (localStorageService.saveFinancialConfig) await localStorageService.saveFinancialConfig(config);
    } catch (e) {
      console.error('Erro ao salvar financialConfig no Supabase:', e);
      if (localStorageService.saveFinancialConfig) await localStorageService.saveFinancialConfig(config);
    }
  }

  // ============================================================================
  // 4. Operations Catalog
  // ============================================================================
  async getOperations(): Promise<OperationItem[]> {
    const client = this.getClient();
    if (!client) return localStorageService.getOperations();

    try {
      const { data, error } = await client
        .from('operations')
        .select('*')
        .order('id', { ascending: true });

      if (error || !data || data.length === 0) {
        if (data && data.length === 0) {
          await this.saveOperations(DEFAULT_OPERATIONS);
        }
        return DEFAULT_OPERATIONS;
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        time: Number(item.time) || 0,
        previousTime: item.previous_time !== null && item.previous_time !== undefined ? Number(item.previous_time) : undefined,
        initialTime: item.initial_time !== null && item.initial_time !== undefined ? Number(item.initial_time) : undefined,
        customVolume: item.custom_volume !== null && item.custom_volume !== undefined ? Number(item.custom_volume) : undefined,
        isDefault: Boolean(item.is_default),
        category: item.category,
        description: item.description || undefined,
        history: item.history || [],
        updatedAt: item.updated_at
      }));
    } catch (e) {
      console.warn('Erro ao carregar operações do Supabase, usando LocalStorage:', e);
      return localStorageService.getOperations();
    }
  }

  async saveOperations(operations: OperationItem[]): Promise<void> {
    const client = this.getClient();
    if (!client) {
      return localStorageService.saveOperations(operations);
    }

    try {
      const rows = operations.map(op => ({
        id: op.id,
        name: op.name,
        time: op.time,
        previous_time: op.previousTime ?? null,
        initial_time: op.initialTime ?? null,
        custom_volume: op.customVolume ?? null,
        is_default: op.isDefault,
        category: op.category,
        description: op.description || null,
        history: op.history || [],
        updated_at: new Date().toISOString()
      }));

      const { error } = await client.from('operations').upsert(rows, { onConflict: 'id' });
      if (error) throw error;

      await localStorageService.saveOperations(operations);
    } catch (e) {
      console.error('Erro ao salvar operações no Supabase:', e);
      await localStorageService.saveOperations(operations);
    }
  }

  async updateOperation(operation: OperationItem): Promise<void> {
    const client = this.getClient();
    if (!client) {
      return localStorageService.updateOperation(operation);
    }

    try {
      const payload = {
        id: operation.id,
        name: operation.name,
        time: operation.time,
        previous_time: operation.previousTime ?? null,
        initial_time: operation.initialTime ?? null,
        custom_volume: operation.customVolume ?? null,
        is_default: operation.isDefault,
        category: operation.category,
        description: operation.description || null,
        history: operation.history || [],
        updated_at: new Date().toISOString()
      };

      const { error } = await client.from('operations').upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      await localStorageService.updateOperation(operation);
    } catch (e) {
      console.error('Erro ao atualizar operação no Supabase:', e);
      await localStorageService.updateOperation(operation);
    }
  }

  async resetOperations(): Promise<OperationItem[]> {
    await this.saveOperations(DEFAULT_OPERATIONS);
    return DEFAULT_OPERATIONS;
  }

  // ============================================================================
  // 5. Time Studies (Cronoanálise Lean)
  // ============================================================================
  async getTimeStudies(): Promise<TimeStudy[]> {
    const client = this.getClient();
    if (!client) return localStorageService.getTimeStudies();

    try {
      const { data, error } = await client
        .from('time_studies')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data) return [];

      return data.map(item => ({
        id: item.id,
        operationId: item.operation_id,
        operationName: item.operation_name,
        category: item.category,
        operatorName: item.operator_name || undefined,
        analystName: item.analyst_name || undefined,
        date: item.date,
        microOperations: item.micro_operations || [],
        stats: item.stats || {},
        notes: item.notes || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (e) {
      console.warn('Erro ao carregar time studies do Supabase:', e);
      return localStorageService.getTimeStudies();
    }
  }

  async getTimeStudyByOperationId(operationId: string): Promise<TimeStudy | null> {
    const client = this.getClient();
    if (!client) return localStorageService.getTimeStudyByOperationId(operationId);

    try {
      const { data, error } = await client
        .from('time_studies')
        .select('*')
        .eq('operation_id', operationId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        operationId: data.operation_id,
        operationName: data.operation_name,
        category: data.category,
        operatorName: data.operator_name || undefined,
        analystName: data.analyst_name || undefined,
        date: data.date,
        microOperations: data.micro_operations || [],
        stats: data.stats || {},
        notes: data.notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (e) {
      console.warn('Erro ao buscar time study por ID no Supabase:', e);
      return localStorageService.getTimeStudyByOperationId(operationId);
    }
  }

  async saveTimeStudy(study: TimeStudy): Promise<void> {
    const client = this.getClient();
    if (!client) {
      return localStorageService.saveTimeStudy(study);
    }

    try {
      const payload = {
        id: study.id,
        operation_id: study.operationId,
        operation_name: study.operationName,
        category: study.category,
        operator_name: study.operatorName || null,
        analyst_name: study.analystName || null,
        date: study.date || new Date().toISOString(),
        micro_operations: study.microOperations || [],
        stats: study.stats || {},
        notes: study.notes || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await client.from('time_studies').upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      await localStorageService.saveTimeStudy(study);
    } catch (e) {
      console.error('Erro ao salvar time study no Supabase:', e);
      await localStorageService.saveTimeStudy(study);
    }
  }

  async deleteTimeStudy(id: string): Promise<void> {
    const client = this.getClient();
    if (!client) {
      return localStorageService.deleteTimeStudy(id);
    }

    try {
      const { error } = await client.from('time_studies').delete().eq('id', id);
      if (error) throw error;

      await localStorageService.deleteTimeStudy(id);
    } catch (e) {
      console.error('Erro ao deletar time study no Supabase:', e);
      await localStorageService.deleteTimeStudy(id);
    }
  }

  // ============================================================================
  // 6. Calculator Selection & Preferences
  // ============================================================================
  async getCalculatorSelection(): Promise<string[]> {
    return localStorageService.getCalculatorSelection();
  }

  async saveCalculatorSelection(selectedIds: string[]): Promise<void> {
    return localStorageService.saveCalculatorSelection(selectedIds);
  }

  // ============================================================================
  // 7. Backup & Global Sync
  // ============================================================================
  async exportAllData(): Promise<StorageData> {
    const categories = await this.getCategories();
    const operations = await this.getOperations();
    const timeStudies = await this.getTimeStudies();
    const cellConfig = await this.getCellConfig();
    const financialConfig = await this.getFinancialConfig();
    const selectedCalculatorIds = await this.getCalculatorSelection();

    return {
      categories,
      operations,
      timeStudies,
      cellConfig,
      financialConfig,
      selectedCalculatorIds,
      lastUpdated: new Date().toISOString(),
      version: '2.0.0-supabase'
    };
  }

  async importAllData(data: StorageData): Promise<void> {
    if (data.categories) await this.saveCategories(data.categories);
    if (data.operations) await this.saveOperations(data.operations);
    if (data.cellConfig) await this.saveCellConfig(data.cellConfig);
    if (data.financialConfig) await this.saveFinancialConfig(data.financialConfig);
    if (data.timeStudies) {
      for (const study of data.timeStudies) {
        await this.saveTimeStudy(study);
      }
    }
    if (data.selectedCalculatorIds) {
      await this.saveCalculatorSelection(data.selectedCalculatorIds);
    }
  }

  async clearAllDataForProduction(): Promise<void> {
    await this.resetCategories();
    await this.resetOperations();
    await this.saveCellConfig(DEFAULT_CELL_CONFIG);
    await this.saveFinancialConfig(DEFAULT_FINANCIAL_CONFIG);
    if (localStorageService.clearAllDataForProduction) {
      await localStorageService.clearAllDataForProduction();
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();
