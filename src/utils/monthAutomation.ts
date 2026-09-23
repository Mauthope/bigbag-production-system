import { OperationItem, FinancialImpactConfig, MonthlyClosingRecord } from '@/types/production';

/**
 * Retorna a chave do mês no formato 'YYYY-MM' (ex: '2026-09')
 */
export const getCurrentMonthKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

/**
 * Retorna o rótulo legível do mês (ex: 'Setembro/2026')
 */
export const getMonthLabel = (monthKey: string): string => {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [year, monthNum] = monthKey.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const idx = parseInt(monthNum, 10) - 1;
  return `${monthNames[idx] || monthNum}/${year}`;
};

/**
 * Retorna a data ISO (YYYY-MM-DD) do último dia do mês especificado
 */
export const getLastDayOfMonth = (monthKey: string): string => {
  if (!monthKey || !monthKey.includes('-')) return new Date().toISOString().split('T')[0];
  const [yearStr, monthStr] = monthKey.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10); // 1-12
  // Dia 0 do mês m+1 retorna o último dia do mês m
  const lastDate = new Date(y, m, 0);
  const day = String(lastDate.getDate()).padStart(2, '0');
  const mon = String(lastDate.getMonth() + 1).padStart(2, '0');
  return `${lastDate.getFullYear()}-${mon}-${day}`;
};

/**
 * Informações e contagem regressiva para o próximo encerramento automático
 */
export const getNextMonthClosingDate = (monthKey: string): {
  lastDateFormatted: string;
  isLastDay: boolean;
  daysRemaining: number;
  lastDateIso: string;
} => {
  const now = new Date();
  const [yearStr, monthStr] = (monthKey || getCurrentMonthKey()).split('-');
  const y = parseInt(yearStr, 10) || now.getFullYear();
  const m = parseInt(monthStr, 10) || (now.getMonth() + 1);

  const lastDate = new Date(y, m, 0, 23, 59, 59, 999);
  const diffTime = lastDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isLastDay =
    now.getFullYear() === y &&
    (now.getMonth() + 1) === m &&
    now.getDate() === lastDate.getDate();

  const dayStr = String(lastDate.getDate()).padStart(2, '0');
  const lastDateFormatted = `${dayStr}/${String(m).padStart(2, '0')}/${y}`;
  const lastDateIso = `${y}-${String(m).padStart(2, '0')}-${dayStr}`;

  return { lastDateFormatted, isLastDay, daysRemaining, lastDateIso };
};

/**
 * Calcula o consolidado financeiro do mês (ganhos com dedução de margem de erro, perdas Kaizen, horas poupadas)
 */
export function calculateMonthFinancialSummary(
  operations: OperationItem[],
  finConfig: FinancialImpactConfig,
  targetVolume?: number
): {
  grossSavings: number;
  totalSavings: number;
  totalLosses: number;
  netSavings: number;
  hoursSaved: number;
  hoursLost: number;
  netHours: number;
} {
  const monthlyVolume = targetVolume !== undefined && targetVolume > 0 ? targetVolume : finConfig.monthlyVolume;
  const defaultHourlyRate = finConfig.defaultHourlyRate;
  const sectorHourlyRates = finConfig.sectorHourlyRates || {};
  const errorMarginPercent = finConfig.errorMarginPercent ?? 5;

  let grossMonthlyGains = 0;
  let grossHoursGained = 0;
  let grossLossesAmount = 0;
  let grossLossesHours = 0;

  operations.forEach(op => {
    let baselineTime = op.time;
    if (op.previousTime !== undefined && op.previousTime !== null && Math.abs(op.previousTime - op.time) > 0.0001 && op.previousTime > 0.0001) {
      baselineTime = op.previousTime;
    } else if (op.history && op.history.length > 1) {
      baselineTime = op.history[op.history.length - 2].time;
    }

    const currentTime = op.time;
    const deltaMinutes = currentTime - baselineTime;
    const timeSavedMinutes = baselineTime - currentTime;

    const hourlyRate =
      sectorHourlyRates[op.category] !== undefined
        ? sectorHourlyRates[op.category]
        : defaultHourlyRate;

    const effectiveVolume =
      op.customVolume !== undefined && op.customVolume > 0
        ? op.customVolume
        : monthlyVolume;

    const monthlyHoursImpacted = (timeSavedMinutes * effectiveVolume) / 60;
    const monthlyFinancialImpact = monthlyHoursImpacted * hourlyRate;

    if (deltaMinutes < -0.001) {
      // Ganho de tempo
      grossMonthlyGains += monthlyFinancialImpact;
      grossHoursGained += monthlyHoursImpacted;
    } else if (deltaMinutes > 0.001) {
      // Perda / Oportunidade Kaizen (não subtraído dos ganhos)
      grossLossesAmount += Math.abs(monthlyFinancialImpact);
      grossLossesHours += Math.abs(monthlyHoursImpacted);
    }
  });

  const grossMonthlySavings = grossMonthlyGains;
  const errorMarginAmount = grossMonthlySavings * (errorMarginPercent / 100);
  const totalMonthlySavings = grossMonthlySavings - errorMarginAmount;

  const grossHoursSaved = grossHoursGained;
  const errorHoursAmount = grossHoursSaved * (errorMarginPercent / 100);
  const totalMonthlyHoursSaved = grossHoursSaved - errorHoursAmount;

  return {
    grossSavings: grossMonthlySavings,
    totalSavings: totalMonthlySavings,
    totalLosses: grossLossesAmount,
    netSavings: totalMonthlySavings,
    hoursSaved: totalMonthlyHoursSaved,
    hoursLost: grossLossesHours,
    netHours: totalMonthlyHoursSaved
  };
}

/**
 * Verifica se o mês ativo expirou (mudança de mês no calendário) e executa a virada automática:
 * 1. Congela e fecha o mês anterior com seus totais calculados (closedAt no último dia do mês).
 * 2. Avança o ponto de partida das operações (previousTime = currentTime), zerando os balanços para o novo mês.
 * 3. Inicializa o novo mês no histórico como ativo em aberto.
 */
export function checkAndPerformMonthRollover(
  operations: OperationItem[],
  finConfig: FinancialImpactConfig,
  currentDate: Date = new Date()
): {
  updatedOperations: OperationItem[];
  updatedFinConfig: FinancialImpactConfig;
  rolledOver: boolean;
  message?: string;
} {
  const currentKey = getCurrentMonthKey(currentDate);
  const activeKey = finConfig.activeMonthKey;

  // Se a chave ativa já for a chave do mês do calendário atual
  if (activeKey === currentKey) {
    const existingHistory = finConfig.monthlyHistory || {};
    // Garante que o registro do mês atual existe no histórico
    if (!existingHistory[currentKey]) {
      const updatedHistory = {
        ...existingHistory,
        [currentKey]: {
          monthKey: currentKey,
          monthLabel: getMonthLabel(currentKey),
          volume: finConfig.monthlyVolume,
          defaultHourlyRate: finConfig.defaultHourlyRate,
          grossSavings: 0,
          totalSavings: 0,
          totalLosses: 0,
          netSavings: 0,
          hoursSaved: 0,
          hoursLost: 0,
          netHours: 0,
          isClosed: false
        }
      };
      return {
        updatedOperations: operations,
        updatedFinConfig: {
          ...finConfig,
          monthlyHistory: updatedHistory
        },
        rolledOver: false
      };
    }
    return {
      updatedOperations: operations,
      updatedFinConfig: finConfig,
      rolledOver: false
    };
  }

  // Se a chave ativa for anterior ao mês atual do calendário (ex: '2026-08' < '2026-09')
  const existingHistory: Record<string, MonthlyClosingRecord> = { ...(finConfig.monthlyHistory || {}) };
  const prevRecord = existingHistory[activeKey];

  // 1. Consolidar o mês anterior caso ainda não estivesse fechado
  if (!prevRecord || !prevRecord.isClosed) {
    const summary = calculateMonthFinancialSummary(operations, finConfig, prevRecord?.volume);
    existingHistory[activeKey] = {
      monthKey: activeKey,
      monthLabel: prevRecord?.monthLabel || getMonthLabel(activeKey),
      volume: prevRecord?.volume || finConfig.monthlyVolume,
      defaultHourlyRate: prevRecord?.defaultHourlyRate || finConfig.defaultHourlyRate,
      grossSavings: summary.grossSavings,
      totalSavings: summary.totalSavings,
      totalLosses: summary.totalLosses,
      netSavings: summary.netSavings,
      hoursSaved: summary.hoursSaved,
      hoursLost: summary.hoursLost,
      netHours: summary.netHours,
      isClosed: true,
      closedAt: getLastDayOfMonth(activeKey)
    };
  }

  // 2. Avançar baselines de todas as operações para o novo mês:
  // previousTime passa a ser o tempo medido atual (delta = 0, balanço zerado no novo ciclo)
  const updatedOperations = operations.map(op => ({
    ...op,
    previousTime: op.time,
    updatedAt: new Date().toISOString()
  }));

  // 3. Criar o registro do novo mês corrente
  existingHistory[currentKey] = {
    monthKey: currentKey,
    monthLabel: getMonthLabel(currentKey),
    volume: prevRecord?.volume || finConfig.monthlyVolume,
    defaultHourlyRate: finConfig.defaultHourlyRate,
    grossSavings: 0,
    totalSavings: 0,
    totalLosses: 0,
    netSavings: 0,
    hoursSaved: 0,
    hoursLost: 0,
    netHours: 0,
    isClosed: false
  };

  const updatedFinConfig: FinancialImpactConfig = {
    ...finConfig,
    activeMonthKey: currentKey,
    monthlyHistory: existingHistory
  };

  return {
    updatedOperations,
    updatedFinConfig,
    rolledOver: true,
    message: `Virada de mês automática: Mês ${getMonthLabel(activeKey)} finalizado e consolidado. Mês ${getMonthLabel(currentKey)} iniciado com balanço zerado!`
  };
}
