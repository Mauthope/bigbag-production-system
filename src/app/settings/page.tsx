'use client';

import React, { useState, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { ComponentCategoryKey, OperationItem } from '@/types/production';
import { TimeStudyModal } from '@/components/TimeStudyModal';
import { ExportImportModal } from '@/components/ExportImportModal';
import {
  Sliders,
  Search,
  Plus,
  RotateCcw,
  Trash2,
  Save,
  Download,
  Activity,
  Gauge,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const {
    operations,
    categoriesConfig,
    timeStudies,
    updateOperationTime,
    addCustomOperation,
    deleteOperation,
    resetOperationsToDefault,
    showToast
  } = useProduction();

  const [selectedCategory, setSelectedCategory] = useState<ComponentCategoryKey | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTimes, setEditingTimes] = useState<Record<string, number>>({});
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedOpForTimeStudy, setSelectedOpForTimeStudy] = useState<OperationItem | null>(null);

  // Add Operation Form State
  const [isAddingOp, setIsAddingOp] = useState(false);
  const [newOpCategory, setNewOpCategory] = useState<ComponentCategoryKey>('alca');
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
      await updateOperationTime(id, editingTimes[id]);
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
      category: newOpCategory
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
              Estudo de Tempos Lean
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Edite tempos diretamente ou realize um <strong>Estudo de Tempos e Cronoanálise</strong> detalhada com precisão estatística (N&apos; = [(z&middot;s)/(e&middot;x̄)]&sup2;).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAddingOp(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Operação</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Backup / Supabase</span>
          </button>

          <button
            onClick={resetOperationsToDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-900/40 text-xs font-medium transition-colors"
            title="Restaura todos os tempos para a tabela de fábrica original"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Fábrica</span>
          </button>
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
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateNewOperation} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Componente / Categoria
              </label>
              <select
                value={newOpCategory}
                onChange={e => setNewOpCategory(e.target.value as ComponentCategoryKey)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {Object.keys(categoriesConfig).map(catKey => (
                  <option key={catKey} value={catKey}>
                    {categoriesConfig[catKey as ComponentCategoryKey].title}
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
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shrink-0 transition-colors"
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
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todos ({operations.length})
          </button>
          {Object.keys(categoriesConfig).map(catKey => {
            const key = catKey as ComponentCategoryKey;
            const config = categoriesConfig[key];
            const count = operations.filter(o => o.category === key).length;
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'border text-white shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                style={{
                  backgroundColor: isSelected ? `${config.colorHex}25` : undefined,
                  borderColor: isSelected ? config.colorHex : undefined,
                  color: isSelected ? config.colorHex : undefined
                }}
              >
                <span>{config.title}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Operations Table with Time Study Button */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Componente</th>
                <th className="py-3.5 px-4">Nome da Operação</th>
                <th className="py-3.5 px-4 text-center">Tipo</th>
                <th className="py-3.5 px-4 text-center">Cronoanálise Lean</th>
                <th className="py-3.5 px-4 text-right">Tempo Padrão (Minutos)</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredOperations.map(op => {
                const config = categoriesConfig[op.category];
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
                      <div className="font-medium text-white">{op.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{op.id}</span>
                    </td>

                    {/* Default or Custom */}
                    <td className="py-3 px-4 text-center">
                      {op.isDefault ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                          Padrão
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Opcional
                        </span>
                      )}
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
                        title="Abrir Cronômetro e Estudo de Tempos Lean"
                      >
                        <Activity className={`w-3.5 h-3.5 ${study ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
                        <span>
                          {study && study.microOperations
                            ? `Estudo (${study.microOperations.length} micro-etapas)`
                            : 'Mapear / Cronometrar'}
                        </span>
                      </button>
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
                        {!op.isDefault && (
                          <button
                            onClick={() => deleteOperation(op.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Excluir operação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

    </div>
  );
}
