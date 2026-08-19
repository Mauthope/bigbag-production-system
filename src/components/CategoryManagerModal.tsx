'use client';

import React, { useState } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { ComponentCategoryConfig } from '@/types/production';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Layers,
  Palette,
  RotateCcw,
  Sparkles
} from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Ciano', hex: '#06b6d4' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Violeta', hex: '#8b5cf6' },
  { name: 'Âmbar', hex: '#f59e0b' },
  { name: 'Rosa / Carmim', hex: '#f43f5e' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Índigo', hex: '#4f46e5' },
  { name: 'Fúcsia', hex: '#d946ef' },
  { name: 'Azul Céu', hex: '#0ea5e9' },
  { name: 'Lima', hex: '#84cc16' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Ardósia / Grafite', hex: '#64748b' }
];

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    categories,
    operations,
    addCategory,
    updateCategory,
    deleteCategory,
    resetCategoriesToDefault
  } = useProduction();

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newColorHex, setNewColorHex] = useState(COLOR_PRESETS[0].hex);
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editColorHex, setEditColorHex] = useState('');
  const [editDescription, setEditDescription] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addCategory({
      title: newTitle.trim(),
      colorHex: newColorHex,
      description: newDescription.trim()
    });

    setNewTitle('');
    setNewDescription('');
    setIsCreating(false);
  };

  const startEdit = (cat: ComponentCategoryConfig) => {
    setEditingKey(cat.key);
    setEditTitle(cat.title);
    setEditColorHex(cat.colorHex);
    setEditDescription(cat.description || '');
  };

  const saveEdit = async (key: string) => {
    if (!editTitle.trim()) return;
    await updateCategory(key, {
      title: editTitle.trim(),
      colorHex: editColorHex,
      description: editDescription.trim()
    });
    setEditingKey(null);
  };

  const handleDelete = async (cat: ComponentCategoryConfig) => {
    const countOps = operations.filter(op => op.category === cat.key).length;
    const confirmMsg = countOps > 0
      ? `Atenção: O bloco "${cat.title}" contém ${countOps} operação(ões) vinculada(s).\n\nExcluir este bloco também apagará essas ${countOps} operações do catálogo.\n\nTem certeza que deseja excluir?`
      : `Tem certeza que deseja excluir o bloco "${cat.title}"?`;

    if (window.confirm(confirmMsg)) {
      await deleteCategory(cat.key);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Gerenciar Blocos & Componentes
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  {categories.length} ativos
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Personalize os blocos da Calculadora e do Catálogo (criar, renomear, colorir ou excluir).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* Create Block Action Bar / Toggle */}
          {!isCreating ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white">Criar Novo Bloco Personalizado</h3>
                <p className="text-xs text-slate-400">
                  Adicione novos componentes como Liner, Embalagem Especial, Reforços ou Etiquetagem.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Bloco</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="p-5 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Cadastrar Novo Bloco
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome do Bloco *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Liner / Ensacamento"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Descrição Curta (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Inserção, amarração e teste de liner"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  Cor de Identificação do Bloco
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      type="button"
                      key={preset.hex}
                      onClick={() => setNewColorHex(preset.hex)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        newColorHex === preset.hex
                          ? 'border-white ring-2 ring-cyan-400/40 bg-slate-800 text-white font-bold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Novo Bloco</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Active Blocks */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Blocos Ativos no Sistema ({categories.length})
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {categories.map(cat => {
                const isEditing = editingKey === cat.key;
                const countOps = operations.filter(op => op.category === cat.key).length;

                if (isEditing) {
                  return (
                    <div
                      key={cat.key}
                      className="p-4 rounded-xl bg-slate-950 border border-amber-500/50 shadow-lg space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Título do Bloco</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Descrição</label>
                          <input
                            type="text"
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Color preset picker for edit */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {COLOR_PRESETS.map(p => (
                          <button
                            type="button"
                            key={p.hex}
                            onClick={() => setEditColorHex(p.hex)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border cursor-pointer ${
                              editColorHex === p.hex
                                ? 'border-amber-400 bg-slate-800 text-white font-bold'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.hex }} />
                            <span>{p.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => setEditingKey(null)}
                          className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => saveEdit(cat.key)}
                          className="px-3.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat.key}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.colorHex }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm truncate">{cat.title}</span>
                          <span className="text-[10px] font-mono text-slate-500">({cat.key})</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {countOps} {countOps === 1 ? 'operação' : 'operações'}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{cat.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar bloco"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Excluir bloco"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={() => {
              if (window.confirm('Deseja restaurar os blocos para a lista de fábrica padrão?')) {
                resetCategoriesToDefault();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Restaurar Lista Padrão de Blocos</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
