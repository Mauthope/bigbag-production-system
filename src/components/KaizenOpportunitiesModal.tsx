'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Trash2,
  CheckCircle2,
  DollarSign,
  Clock,
  Boxes,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Flame,
  Info
} from 'lucide-react';
import { ComponentCategoryConfig, OperationTimeHistoryEntry } from '@/types/production';

export interface KaizenOperationItem {
  id: string;
  name: string;
  category: string;
  baselineTime: number;
  currentTime: number;
  deltaMinutes: number;
  timeSavedMinutes: number;
  percentChange: number;
  hourlyRate: number;
  monthlyHoursImpacted: number;
  monthlyFinancialImpact: number;
  annualFinancialImpact: number;
  status: 'gain' | 'loss' | 'neutral';
  effectiveVolume: number;
  history?: OperationTimeHistoryEntry[];
}

interface KaizenOpportunitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  operations: KaizenOperationItem[];
  categories: ComponentCategoryConfig[];
  monthlyVolume: number;
  defaultHourlyRate: number;
  onUpdateOperationTime: (
    id: string,
    newTime: number,
    notes?: string,
    source?: 'cronoanalise' | 'manual'
  ) => Promise<void>;
  onExcludeOpportunity: (id: string, currentTime: number) => Promise<void>;
  initialTab?: 'open_opportunities' | 'completed_kaizens';
}

export const KaizenOpportunitiesModal: React.FC<KaizenOpportunitiesModalProps> = ({
  isOpen,
  onClose,
  operations,
  categories,
  monthlyVolume,
  defaultHourlyRate,
  onUpdateOperationTime,
  onExcludeOpportunity,
  initialTab = 'open_opportunities'
}) => {
  const [activeTab, setActiveTab] = useState<'open_opportunities' | 'completed_kaizens'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filtros específicos da aba de Kaizens Concluídos (Tempos Reduzidos)
  const [completedSearchTerm, setCompletedSearchTerm] = useState('');
  const [completedCategory, setCompletedCategory] = useState<string>('all');
  const [completedSort, setCompletedSort] = useState<'recent' | 'savings' | 'saved_time'>('recent');

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  // Estado para registro inline de novo Kaizen
  const [recordingOpId, setRecordingOpId] = useState<string | null>(null);
  const [newTimeInput, setNewTimeInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mapeamento de categorias
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.key] = cat;
      return acc;
    }, {} as Record<string, ComponentCategoryConfig>);
  }, [categories]);

  // 1. Oportunidades em Aberto: Operações com aumento de tempo (status === 'loss' ou delta > 0.001)
  const openOpportunities = useMemo(() => {
    return operations.filter(op => op.status === 'loss' || op.deltaMinutes > 0.001);
  }, [operations]);

  // 2. Kaizens Concluídos: Operações que tiveram redução a partir de medições anteriores
  const completedKaizens = useMemo(() => {
    const list: Array<{
      op: KaizenOperationItem;
      previousPeakTime: number;
      reducedTime: number;
      savedMinutes: number;
      monthlySavings: number;
      monthlyHoursSaved: number;
      notes: string;
      date: string;
    }> = [];

    operations.forEach(op => {
      if (op.history && op.history.length > 1) {
        // Encontra histórico com redução
        for (let i = 1; i < op.history.length; i++) {
          const prevEntry = op.history[i - 1];
          const currEntry = op.history[i];
          if (currEntry.time < prevEntry.time) {
            const savedMin = prevEntry.time - currEntry.time;
            const hours = (savedMin * op.effectiveVolume) / 60;
            const savings = hours * op.hourlyRate;
            list.push({
              op,
              previousPeakTime: prevEntry.time,
              reducedTime: currEntry.time,
              savedMinutes: savedMin,
              monthlySavings: savings,
              monthlyHoursSaved: hours,
              notes: currEntry.notes || 'Kaizen: eliminação de micro-desperdício',
              date: currEntry.date || ''
            });
          }
        }
      }
    });

    return list;
  }, [operations]);

  // Filtro e Ordenação dos Kaizens Concluídos (Priorizando medições mais recentes de Setembro)
  const filteredCompletedKaizens = useMemo(() => {
    return completedKaizens
      .filter(item => {
        const matchSearch = item.op.name.toLowerCase().includes(completedSearchTerm.toLowerCase()) ||
          item.notes.toLowerCase().includes(completedSearchTerm.toLowerCase());
        const matchCat = completedCategory === 'all' || item.op.category === completedCategory;
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        if (completedSort === 'recent') {
          const dateA = a.date || '1970-01-01';
          const dateB = b.date || '1970-01-01';
          if (dateB !== dateA) {
            return dateB.localeCompare(dateA);
          }
          return b.monthlySavings - a.monthlySavings;
        } else if (completedSort === 'savings') {
          return b.monthlySavings - a.monthlySavings;
        } else {
          return b.savedMinutes - a.savedMinutes;
        }
      });
  }, [completedKaizens, completedSearchTerm, completedCategory, completedSort]);

  // Totais agregados das oportunidades em aberto
  const totalOpenLossAmount = useMemo(() => {
    return openOpportunities.reduce((acc, op) => acc + Math.abs(op.monthlyFinancialImpact), 0);
  }, [openOpportunities]);

  const totalOpenLossHours = useMemo(() => {
    return openOpportunities.reduce((acc, op) => acc + Math.abs(op.monthlyHoursImpacted), 0);
  }, [openOpportunities]);

  // Total de ganhos já gerados por Kaizens concluídos
  const totalKaizenAchievedSavings = useMemo(() => {
    return completedKaizens.reduce((acc, item) => acc + item.monthlySavings, 0);
  }, [completedKaizens]);

  // Filtragem da lista ativa
  const filteredOpenOpportunities = useMemo(() => {
    return openOpportunities.filter(op => {
      const matchSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'all' || op.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [openOpportunities, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  // Iniciar registro de Kaizen para uma operação
  const handleStartRecording = (op: KaizenOperationItem) => {
    setRecordingOpId(op.id);
    // Sugere o tempo padrão anterior como meta inicial de redução
    setNewTimeInput(op.baselineTime.toFixed(2));
    setNotesInput('Kaizen Lean: eliminação de desperdício e padronização do método');
  };

  // Salvar o novo tempo reduzido (conquistando o ganho do Kaizen)
  const handleSaveKaizen = async (op: KaizenOperationItem) => {
    const parsedTime = parseFloat(newTimeInput.replace(',', '.'));
    if (isNaN(parsedTime) || parsedTime <= 0) {
      alert('Por favor, informe um tempo válido em minutos (maior que zero).');
      return;
    }

    if (parsedTime >= op.currentTime) {
      const confirmSave = confirm(
        `O novo tempo (${parsedTime.toFixed(2)} min) não é menor que o tempo atual (${op.currentTime.toFixed(2)} min). Deseja salvar mesmo assim?`
      );
      if (!confirmSave) return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateOperationTime(
        op.id,
        parsedTime,
        notesInput.trim() || 'Kaizen: redução de tempo de ciclo',
        'cronoanalise'
      );
      setRecordingOpId(null);
      setNewTimeInput('');
      setNotesInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir a oportunidade (aceitar tempo maior sem registrar ganho Kaizen)
  const handleExclude = async (op: KaizenOperationItem) => {
    const confirmExclude = confirm(
      `Deseja realmente desconsiderar/excluir a Oportunidade Kaizen de "${op.name}"?\n\n` +
      `O tempo atual de ${op.currentTime.toFixed(2)} min será aceito como a nova referência definitiva. ` +
      `Esta oportunidade será removida do painel e NÃO contabilizará ganhos futuros desse aumento.`
    );

    if (!confirmExclude) return;

    setIsSubmitting(true);
    try {
      await onExcludeOpportunity(op.id, op.currentTime);
      if (recordingOpId === op.id) {
        setRecordingOpId(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl shadow-rose-950/50 overflow-hidden flex flex-col">
        
        {/* Header com Efeito Neon Vermelho e Identidade Kaizen */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-500/20 bg-gradient-to-r from-rose-950/70 via-slate-950/90 to-slate-950/90">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border transition-all ${
              openOpportunities.length > 0
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            }`}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Painel de Oportunidades & Ganhos Kaizen
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    🔴 {openOpportunities.length} {openOpportunities.length === 1 ? 'Oportunidade (Aumento)' : 'Oportunidades (Aumentos)'}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    🟢 {completedKaizens.length} Ganhos Conquistados (Reduções)
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Auditoria de operações que tiveram aumento de tempo e consolidação dos ganhos reais por tempos reduzidos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 KPIs Resumo no Topo do Modal (interativos para alternar abas) */}
        <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <button
            type="button"
            onClick={() => setActiveTab('open_opportunities')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'open_opportunities'
                ? 'bg-rose-950/40 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/50'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Desvios em Aberto
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-black font-mono text-rose-400">
                  {openOpportunities.length}
                </span>
                <span className="text-xs text-rose-300 font-semibold">aumentos registrados</span>
              </div>
              <span className="text-[10px] text-rose-400/80 font-mono block mt-0.5">
                Clique para auditar
              </span>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </button>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Tempo Total Excedente
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-black font-mono text-rose-400">
                  +{totalOpenLossHours.toFixed(1).replace('.', ',')}
                </span>
                <span className="text-xs text-rose-300 font-semibold">horas/mês</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                Desvio total acumulado nos pontos com aumento
              </span>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('completed_kaizens')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'completed_kaizens'
                ? 'bg-emerald-950/40 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Melhorias Kaizen Concluídas
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-black font-mono text-emerald-400">
                  {completedKaizens.length}
                </span>
                <span className="text-xs text-emerald-300 font-semibold">tempos reduzidos</span>
              </div>
              <span className="text-[10px] text-emerald-400/90 font-mono block mt-0.5">
                Clique para ver os tempos que baixaram
              </span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </button>

        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('open_opportunities')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'open_opportunities'
                ? 'border-rose-500 text-rose-300 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <div className="flex items-center gap-1.5">
              <span>Oportunidades em Aberto</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                {openOpportunities.length} aumentos
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed_kaizens')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'completed_kaizens'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div className="flex items-center gap-1.5">
              <span>Ganhos Kaizen Conquistados</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                {completedKaizens.length} reduções
              </span>
            </div>
          </button>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: OPORTUNIDADES EM ABERTO */}
          {activeTab === 'open_opportunities' && (
            <div className="space-y-4">
              
              {/* Filtros e Busca */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar operação com desvio..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="all">Todos os Blocos ({openOpportunities.length})</option>
                    {categories.map(cat => (
                      <option key={cat.key} value={cat.key}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de Cards de Oportunidades */}
              {filteredOpenOpportunities.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Nenhum desvio ou aumento de tempo em aberto!</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Todas as operações estão dentro ou abaixo dos tempos padrão. Qualquer novo aumento registrado no chão de fábrica aparecerá automaticamente aqui como Oportunidade Kaizen.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOpenOpportunities.map(op => {
                    const cat = categoryMap[op.category];
                    const isRecording = recordingOpId === op.id;
                    const deltaSeconds = Math.round(op.deltaMinutes * 60);

                    // Prévia do ganho caso esteja editando
                    const parsedPreview = parseFloat(newTimeInput.replace(',', '.'));
                    const previewGainMinutes = !isNaN(parsedPreview) && parsedPreview > 0 ? op.currentTime - parsedPreview : 0;
                    const previewGainHours = (previewGainMinutes * op.effectiveVolume) / 60;
                    const previewGainSavings = previewGainHours * op.hourlyRate;

                    return (
                      <div
                        key={op.id}
                        className="p-4 rounded-xl bg-slate-950/70 border border-rose-500/30 hover:border-rose-500/60 transition-all space-y-3"
                      >
                        {/* Linha 1: Nome, Setor e Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat?.colorHex || '#f43f5e' }}
                            />
                            <h4 className="text-sm font-bold text-white tracking-tight">
                              {op.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                              {cat?.title || op.category}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30 shrink-0 w-fit">
                            +{op.deltaMinutes.toFixed(2)} min (+{deltaSeconds}s / bag)
                          </span>
                        </div>

                        {/* Linha 2: Dados comparativos (Padrão anterior vs Tempo Aumentado) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-xs">
                          <div className="p-2 rounded-lg bg-slate-900/80">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Tempo Anterior</span>
                            <span className="text-xs font-mono font-bold text-slate-300">
                              {op.baselineTime.toFixed(2)} min ({Math.round(op.baselineTime * 60)}s)
                            </span>
                          </div>

                          <div className="p-2 rounded-lg bg-slate-900/80 border border-rose-500/20">
                            <span className="text-[10px] uppercase font-bold text-rose-400 block">Tempo Aumentado</span>
                            <span className="text-xs font-mono font-bold text-rose-300">
                              {op.currentTime.toFixed(2)} min ({Math.round(op.currentTime * 60)}s)
                            </span>
                          </div>

                          <div className="p-2 rounded-lg bg-slate-900/80">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Tempo Excedente</span>
                            <span className="text-xs font-mono font-bold text-rose-400">
                              +{Math.abs(op.monthlyHoursImpacted).toFixed(1).replace('.', ',')} h/mês
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              +{Math.round(Math.abs(op.deltaMinutes) * 60)}s / bag
                            </span>
                          </div>

                          <div className="p-2 rounded-lg bg-slate-900/80">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Aumento Percentual</span>
                            <span className="text-xs font-mono font-bold text-rose-400 block">
                              +{op.percentChange.toFixed(1).replace('.', ',')}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              Volume: {op.effectiveVolume.toLocaleString('pt-BR')} bags/mês
                            </span>
                          </div>
                        </div>

                        {/* Ações da Oportunidade */}
                        {!isRecording ? (
                          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>Aplique Kaizen para reduzir o tempo ou exclua se o tempo for definitivo.</span>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                              <button
                                type="button"
                                onClick={() => handleExclude(op)}
                                disabled={isSubmitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                title="Aceitar o tempo atual como padrão definitivo sem contabilizar ganho Kaizen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir Oportunidade</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartRecording(op)}
                                disabled={isSubmitting}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Registrar Kaizen (Novo Tempo)</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Formulário Inline de Registro de Kaizen */
                          <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-3 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                Nova Medição Kaizen para: {op.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setRecordingOpId(null)}
                                className="text-slate-400 hover:text-white text-xs cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                  Novo Tempo Medido (minutos/bag)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={newTimeInput}
                                    onChange={e => setNewTimeInput(e.target.value)}
                                    placeholder="Ex: 1.10"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                                    autoFocus
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">
                                    min
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                  Ação Kaizen / Justificativa
                                </label>
                                <input
                                  type="text"
                                  value={notesInput}
                                  onChange={e => setNotesInput(e.target.value)}
                                  placeholder="Ex: Eliminação de dobra dupla e guia magnética"
                                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>

                            {/* Prévia do Ganho Kaizen em Tempo Real */}
                            {previewGainMinutes > 0 && (
                              <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono text-emerald-300">
                                <span>
                                  🌱 Ganho Conquistado: -{previewGainMinutes.toFixed(2)} min/bag (-{Math.round(previewGainMinutes * 60)}s)
                                </span>
                                <span className="font-bold flex items-center gap-1.5 flex-wrap">
                                  <span>+R$ {previewGainSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
                                  <span className="text-[10px] text-emerald-400/80 font-normal">
                                    ({op.effectiveVolume.toLocaleString('pt-BR')} bags × {previewGainHours.toFixed(1)}h)
                                  </span>
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setRecordingOpId(null)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSaveKaizen(op)}
                                disabled={isSubmitting}
                                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isSubmitting ? 'Salvando...' : 'Salvar Ganho Kaizen'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: KAIZENS CONCLUÍDOS & GANHOS CONQUISTADOS */}
          {activeTab === 'completed_kaizens' && (
            <div className="space-y-4">
              
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Todas as operações com tempos reduzidos por novas medições (Kaizen). As medições mais recentes de Setembro aparecem ordenadas no topo.
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-400 shrink-0">
                  Total: +R$ {totalKaizenAchievedSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                </span>
              </div>

              {/* Filtros e Busca de Kaizens Concluídos */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={completedSearchTerm}
                    onChange={e => setCompletedSearchTerm(e.target.value)}
                    placeholder="Buscar ganho / operação..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={completedCategory}
                      onChange={e => setCompletedCategory(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Todos os Setores ({completedKaizens.length})</option>
                      {categories.map(cat => (
                        <option key={cat.key} value={cat.key}>
                          {cat.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={completedSort}
                    onChange={e => setCompletedSort(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-300 focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
                  >
                    <option value="recent">Mais Recentes Primeiro (Setembro/2026)</option>
                    <option value="savings">Maior Economia (R$/mês)</option>
                    <option value="saved_time">Maior Redução de Tempo</option>
                  </select>
                </div>
              </div>

              {filteredCompletedKaizens.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Nenhum ganho Kaizen encontrado</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {completedSearchTerm || completedCategory !== 'all'
                      ? 'Nenhum resultado corresponde aos filtros aplicados.'
                      : 'Assim que novas medições reduzirem o tempo de operações, o ganho de produtividade será catalogado aqui.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                    <span>Exibindo {filteredCompletedKaizens.length} de {completedKaizens.length} reduções catalogadas</span>
                    <span>Ordenado por: {completedSort === 'recent' ? 'Data mais recente' : completedSort === 'savings' ? 'Maior ganho R$' : 'Tempo reduzido'}</span>
                  </div>

                  {filteredCompletedKaizens.map((item, idx) => {
                    const cat = categoryMap[item.op.category];
                    const isRecent = item.date && item.date >= '2026-09-21';
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl bg-slate-950/60 border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isRecent ? 'border-cyan-500/40 bg-gradient-to-r from-slate-950/90 via-cyan-950/15 to-slate-950/90' : 'border-slate-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat?.colorHex || '#10b981' }}
                            />
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              {item.op.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                              {cat?.title || item.op.category}
                            </span>
                            {item.date && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                                {item.date}
                              </span>
                            )}
                            {isRecent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold font-mono flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                Medição Recente
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {item.notes}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Redução de Ciclo</span>
                            <span className="text-slate-300">
                              {item.previousPeakTime.toFixed(2)} min → <strong className="text-emerald-400">{item.reducedTime.toFixed(2)} min</strong> (-{Math.round(item.savedMinutes * 60)}s)
                            </span>
                            <span className="text-[10px] text-cyan-400/90 block mt-0.5">
                              +{item.monthlyHoursSaved.toFixed(1).replace('.', ',')}h/mês poupadas
                            </span>
                          </div>

                          <div className="text-right pl-3 border-l border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Ganho Mensal</span>
                            <span className="text-sm font-black text-emerald-400">
                              +R$ {item.monthlySavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {item.op.effectiveVolume.toLocaleString('pt-BR')} bags × R$ {item.op.hourlyRate}/h
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Aumentos de tempo geram oportunidades Kaizen sem subtrair dos ganhos oficiais da fábrica.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>

      </div>
    </div>
  );
};
