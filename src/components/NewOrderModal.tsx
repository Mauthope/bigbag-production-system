'use client';

import React, { useState } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { X, ClipboardPlus, Clock, Boxes, User, Layers, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose }) => {
  const { calculatorTotalMinutes, selectedOperationIds, addOrder, showToast } = useProduction();

  const [opNumber, setOpNumber] = useState(`OP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [client, setClient] = useState('');
  const [modelDescription, setModelDescription] = useState('Big Bag 1.500kg - Standard 4 Painéis');
  const [targetQuantity, setTargetQuantity] = useState<number>(100);
  const [operatorName, setOperatorName] = useState('');
  const [shift, setShift] = useState('Turno A');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const totalPlannedMinutes = calculatorTotalMinutes * targetQuantity;
  const totalPlannedHours = (totalPlannedMinutes / 60).toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!opNumber.trim()) {
      showToast('Informe o número da Ordem de Produção (OP).', 'error');
      return;
    }

    if (!client.trim()) {
      showToast('Informe o nome do cliente.', 'error');
      return;
    }

    if (targetQuantity <= 0) {
      showToast('A quantidade de bags deve ser maior que zero.', 'error');
      return;
    }

    if (selectedOperationIds.length === 0) {
      showToast('Selecione ao menos uma operação na calculadora.', 'error');
      return;
    }

    await addOrder({
      opNumber: opNumber.trim().toUpperCase(),
      client: client.trim(),
      modelDescription: modelDescription.trim(),
      targetQuantity: Number(targetQuantity),
      producedQuantity: 0,
      selectedOperationIds: [...selectedOperationIds],
      standardTimePerBag: calculatorTotalMinutes,
      totalStandardTime: totalPlannedMinutes,
      operatorName: operatorName.trim() || undefined,
      shift,
      status: 'planejada',
      notes: notes.trim() || undefined
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch {}

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 text-cyan-400">
              <ClipboardPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cadastrar Ordem de Produção (OP)</h2>
              <p className="text-xs text-slate-400">Vincule as operações selecionadas a uma nova OP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs text-slate-300 font-medium">Tempo Calculado / Bag:</span>
                <div className="text-sm font-bold text-cyan-300 font-mono">
                  {calculatorTotalMinutes.toFixed(2).replace('.', ',')} min
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-300 font-medium">Tempo Total Previsto:</span>
              <div className="text-sm font-bold text-emerald-300 font-mono">
                {totalPlannedMinutes.toFixed(1).replace('.', ',')} min ({totalPlannedHours}h)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* OP Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Número da OP *
              </label>
              <input
                type="text"
                required
                value={opNumber}
                onChange={e => setOpNumber(e.target.value)}
                placeholder="Ex: OP-2026-004"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-medium"
              />
            </div>

            {/* Client */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cliente / Destino *
              </label>
              <input
                type="text"
                required
                value={client}
                onChange={e => setClient(e.target.value)}
                placeholder="Ex: AgroTech / Cooperativa"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

          </div>

          {/* Model Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Modelo / Especificação do Big Bag *
            </label>
            <input
              type="text"
              required
              value={modelDescription}
              onChange={e => setModelDescription(e.target.value)}
              placeholder="Ex: Big Bag 1.500kg com Válvula Cônica e 2 Vedantes"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Target Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Qtd. Planejada (Bags) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetQuantity}
                onChange={e => setTargetQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-medium"
              />
            </div>

            {/* Shift */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Turno
              </label>
              <select
                value={shift}
                onChange={e => setShift(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Turno A">Turno A (Manhã)</option>
                <option value="Turno B">Turno B (Tarde)</option>
                <option value="Turno C">Turno C (Noite)</option>
              </select>
            </div>

            {/* Operator */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Operador / Linha
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                placeholder="Ex: Carlos / Linha 1"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observações da Produção
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instruções especiais de costura, reforço, etc."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Salvar e Iniciar OP
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
