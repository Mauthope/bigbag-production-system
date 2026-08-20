'use client';

import React, { useState, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { OperationItem } from '@/types/production';
import { TimeStudyModal } from '@/components/TimeStudyModal';
import { TimeEvolutionModal } from '@/components/TimeEvolutionModal';
import { ExportImportModal } from '@/components/ExportImportModal';
import { CategoryManagerModal } from '@/components/CategoryManagerModal';
import { Sparkline } from '@/components/Sparkline';
import {
  Sliders,
  Search,
  Plus,
  Trash2,
  Save,
  Download,
  Activity,
  Gauge,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  TrendingDown,
  LineChart as LineChartIcon,
  Pencil,
  Check,
  X,
  Boxes,
  ClipboardCheck,
  AlertCircle,
  Users
} from 'lucide-react';

export default function SettingsPage() {
  const {
    categories,
    categoriesConfig,
    operations,
    timeStudies,
    updateOperationTime,
    updateOperation,
    addCustomOperation,
    deleteOperation,
    showToast
  } = useProduction();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTimes, setEditingTimes] = useState<Record<string, number>>({});
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedOpForTimeStudy, setSelectedOpForTimeStudy] = useState<OperationItem | null>(null);
  const [selectedOpForHistory, setSelectedOpForHistory] = useState<OperationItem | null>(null);

  // Inline Rename State
  const [editingOpNameId, setEditingOpNameId] = useState<string | null>(null);
  const [tempOpName, setTempOpName] = useState<string>('');

  const handleStartRename = (op: OperationItem) => {
    setEditingOpNameId(op.id);
    setTempOpName(op.name);
  };

  const handleSaveRename = (id: string) => {
    if (tempOpName.trim()) {
      updateOperation(id, { name: tempOpName.trim() });
    }
    setEditingOpNameId(null);
  };

  // Add Operation Form State
  const [isAddingOp, setIsAddingOp] = useState(false);
  const [newOpCategory, setNewOpCategory] = useState<string>('alca');
  const [newOpName, setNewOpName] = useState('');
  const [newOpTime, setNewOpTime] = useState<number>(0.5);

  const filteredOperations = useMemo(() => {
    return operations.filter(op => {
      const matchesCategory = selectedCategory === 'all' || op.category === selectedCategory;
      const matchesSearch =
        op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [operations, selectedCategory, searchTerm]);

  const handleTimeChange = (id: string, value: number) => {
    setEditingTimes(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveTime = async (id: string) => {
    if (editingTimes[id] !== undefined) {
      await updateOperationTime(id, editingTimes[id], 'Ajuste manual direto na tabela', 'manual');
      setEditingTimes(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleCreateNewOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) {
      showToast('Informe o nome da operação.', 'error');
      return;
    }

    await addCustomOperation({
      name: newOpName.trim(),
      time: Number(newOpTime),
      isDefault: false,
      category: newOpCategory || (categories[0]?.key || 'alca')
    });

    setNewOpName('');
    setNewOpTime(0.5);
    setIsAddingOp(false);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Tempos, Parâmetros & Cronoanálise
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/40">
              Cronoanálise & Curva Kaizen
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Mapeie micro-etapas, realize cronoanálises com precisão estatística e acompanhe a <strong>evolução histórica do tempo (estilo mercado financeiro)</strong> para comprovar melhorias e ganhos de eficiência.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            title="Adicionar, renomear, colorir ou excluir blocos e componentes"
          >
            <Boxes className="w-4 h-4 text-cyan-400" />
            <span>Gerenciar Blocos ({categories.length})</span>
          </button>

          <button
            onClick={() => setIsAddingOp(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Operação</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Backup / LocalStorage</span>
          </button>
        </div>
      </div>

      {/* Notice Banner: Diretriz de Cronoanálise Inicial & Padrão de Amostragem */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-cyan-950/30 border border-amber-500/30 shadow-xl shadow-amber-950/10 animate-in fade-in">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Diretriz de Cronoanálise Inicial (Padrão da Equipe)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  10 Amostras
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Por definição da equipe, para uma primeira análise, considerar <strong>apenas 10 amostras</strong> de cada atividade/micro-ação. As cronometragens devem ser realizadas <strong>sempre com o mesmo operador dentro de cada célula</strong>, contemplando <strong>pelo menos um operador de cada célula</strong> para a mesma atividade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 flex-wrap sm:flex-nowrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-medium text-slate-300 shrink-0">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>1 operador / célula</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-medium text-slate-300 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>10 tomadas / atividade</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Operation Drawer */}
      {isAddingOp && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Cadastrar Nova Operação Customizada
            </h3>
            <button
              onClick={() => setIsAddingOp(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateNewOperation} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Componente / Bloco
              </label>
              <select
                value={newOpCategory}
                onChange={e => setNewOpCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {categories.map(cat => (
                  <option key={cat.key} value={cat.key}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Operação
              </label>
              <input
                type="text"
                required
                value={newOpName}
                onChange={e => setNewOpName(e.target.value)}
                placeholder="Ex: Costura dupla de reforço 80cm"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tempo Padrão (minutos)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newOpTime}
                  onChange={e => setNewOpTime(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar operação por nome..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todos ({operations.length})
          </button>
          {categories.map(cat => {
            const count = operations.filter(o => o.category === cat.key).length;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'border text-white shadow-sm font-bold'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                style={{
                  backgroundColor: isSelected ? `${cat.colorHex}25` : undefined,
                  borderColor: isSelected ? cat.colorHex : undefined,
                  color: isSelected ? cat.colorHex : undefined
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.colorHex }} />
                <span>{cat.title}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Operations Table with Time Study and Sparkline Evolution Columns */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Componente</th>
                <th className="py-3.5 px-4">Nome da Operação</th>
                <th className="py-3.5 px-4 text-center">Tipo</th>
                <th className="py-3.5 px-4 text-center">Cronoanálise Lean</th>
                <th className="py-3.5 px-4 text-center">Evolução do Tempo (Kaizen)</th>
                <th className="py-3.5 px-4 text-right">Tempo Padrão (Minutos)</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredOperations.map(op => {
                const config = categoriesConfig[op.category] || {
                  key: op.category,
                  title: op.category,
                  colorHex: '#06b6d4'
                };
                const isModified = editingTimes[op.id] !== undefined && editingTimes[op.id] !== op.time;
                const currentTimeVal = editingTimes[op.id] !== undefined ? editingTimes[op.id] : op.time;
                const study = timeStudies.find(s => s.operationId === op.id);

                return (
                  <tr key={op.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* Component */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: config.colorHex }}
                        />
                        <span className="font-semibold text-slate-300">
                          {config.title}
                        </span>
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      {editingOpNameId === op.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={tempOpName}
                            onChange={e => setTempOpName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveRename(op.id);
                              if (e.key === 'Escape') setEditingOpNameId(null);
                            }}
                            autoFocus
                            className="px-2 py-1 rounded bg-slate-950 border border-cyan-500 text-white text-xs font-medium focus:outline-none w-full max-w-xs"
                          />
                          <button
                            onClick={() => handleSaveRename(op.id)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            title="Salvar nome"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingOpNameId(null)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/name">
                          <div className="font-medium text-white">{op.name}</div>
                          <button
                            onClick={() => handleStartRename(op)}
                            className="opacity-0 group-hover/name:opacity-100 p-1 text-slate-500 hover:text-cyan-300 transition-opacity"
                            title="Renomear operação"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">{op.id}</span>
                    </td>

                    {/* Default or Custom Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => updateOperation(op.id, { isDefault: !op.isDefault })}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer hover:scale-105 ${
                          op.isDefault
                            ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50 hover:bg-cyan-900/60'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                        title="Clique para alternar entre Padrão (marcado por padrão na calculadora) e Opcional"
                      >
                        {op.isDefault ? '✓ Padrão' : 'Opcional'}
                      </button>
                    </td>

                    {/* Time Study Status & Trigger */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedOpForTimeStudy(op)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                          study
                            ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60 shadow-sm'
                            : 'bg-slate-950/70 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
                        }`}
                        title="Abrir Cronômetro e Mapeamento de Micro-etapas Lean"
                      >
                        <Activity className={`w-3.5 h-3.5 ${study ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                        <span>
                          {study && study.microOperations
                            ? `Estudo (${study.microOperations.length} micro-etapas)`
                            : 'Mapear / Cronometrar'}
                        </span>
                      </button>
                    </td>

                    {/* Sparkline Stock-Market Trend Mini-Chart Column */}
                    <td className="py-3 px-4 text-center">
                      <Sparkline
                        history={op.history}
                        currentTime={op.time}
                        onClick={() => setSelectedOpForHistory(op)}
                      />
                    </td>

                    {/* Standard Time Input */}
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={currentTimeVal}
                          onChange={e => handleTimeChange(op.id, parseFloat(e.target.value) || 0)}
                          className={`w-24 px-2.5 py-1 rounded-lg text-right font-bold text-xs focus:outline-none transition-colors ${
                            isModified
                              ? 'bg-amber-950/40 border border-amber-500 text-amber-300'
                              : 'bg-slate-950 border border-slate-800 text-white focus:border-cyan-500'
                          }`}
                        />
                        <span className="text-slate-500 text-xs">min</span>

                        {isModified && (
                          <button
                            onClick={() => handleSaveTime(op.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            title="Salvar alteração manual"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja excluir a operação "${op.name}" do catálogo?`)) {
                              deleteOperation(op.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="Excluir operação do catálogo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Study Modal */}
      <TimeStudyModal
        operation={selectedOpForTimeStudy}
        isOpen={Boolean(selectedOpForTimeStudy)}
        onClose={() => setSelectedOpForTimeStudy(null)}
      />

      {/* Historical Time Evolution Modal (Curva Kaizen) */}
      <TimeEvolutionModal
        operation={selectedOpForHistory}
        isOpen={Boolean(selectedOpForHistory)}
        onClose={() => setSelectedOpForHistory(null)}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Category / Block Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

    </div>
  );
}
