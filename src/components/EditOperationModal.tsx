'use client';

import React, { useState, useEffect } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { OperationItem } from '@/types/production';
import { X, Pencil, Check, Clock, Layers, Sparkles, CheckSquare, Square } from 'lucide-react';

interface EditOperationModalProps {
  operation: OperationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditOperationModal: React.FC<EditOperationModalProps> = ({
  operation,
  isOpen,
  onClose
}) => {
  const { categories, updateOperation, showToast } = useProduction();

  const [name, setName] = useState('');
  const [time, setTime] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (operation) {
      setName(operation.name || '');
      setTime(operation.time || 0);
      setCategory(operation.category || (categories[0]?.key || 'alca'));
      setIsDefault(Boolean(operation.isDefault));
    }
  }, [operation, categories]);

  if (!isOpen || !operation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('O nome da operação não pode ficar em branco.', 'error');
      return;
    }
    if (time < 0) {
      showToast('O tempo da operação deve ser maior ou igual a zero.', 'error');
      return;
    }

    await updateOperation(operation.id, {
      name: name.trim(),
      time: Number(time),
      category: category || operation.category,
      isDefault
    });

    showToast(`Operação "${name.trim()}" atualizada com sucesso!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Editar Operação
              </h2>
              <p className="text-xs text-slate-400">
                Altere o nome, componente, tempo padrão e tipo da operação
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Operation Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Nome da Operação
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Costura de Alça 4x reforçada..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          {/* Component / Category Block */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Bloco / Componente Associado
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat.key} value={cat.key}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          {/* Standard Time in Minutes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Tempo Padrão da Operação</span>
              <span className="text-[11px] font-mono text-cyan-400">
                ({(time * 60).toFixed(0)} segundos)
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={time}
                onChange={e => setTime(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                minutos
              </span>
            </div>
          </div>

          {/* Is Default Checkbox */}
          <div className="pt-2">
            <label
              onClick={() => setIsDefault(!isDefault)}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
            >
              <div className={`p-1 rounded-lg ${isDefault ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {isDefault ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Operação Padrão de Fábrica
                </span>
                <span className="text-[11px] text-slate-400">
                  Quando ativado, esta operação vem pré-selecionada na Calculadora ao iniciar um modelo padrão.
                </span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:via-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Alterações</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
