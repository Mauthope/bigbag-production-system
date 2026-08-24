'use client';

import React, { useState, useEffect } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { CELL_MODELS_DEFINITIONS } from '@/data/defaultData';
import { CellProductionConfig } from '@/types/production';
import { X, Users, Clock, RotateCcw, Check, Zap, Info } from 'lucide-react';

interface CellConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CellConfigModal: React.FC<CellConfigModalProps> = ({ isOpen, onClose }) => {
  const { cellConfig, updateCellConfig, resetCellConfig, showToast } = useProduction();

  const [peopleOne, setPeopleOne] = useState<number>(cellConfig.peopleOne ?? 8.5);
  const [peopleTravado, setPeopleTravado] = useState<number>(cellConfig.peopleTravado ?? 11.0);
  const [peopleSalaLimpa, setPeopleSalaLimpa] = useState<number>(cellConfig.peopleSalaLimpa ?? 8.5);
  const [peopleMulti, setPeopleMulti] = useState<number>(cellConfig.peopleMulti ?? 8.5);
  const [peopleFertilizante, setPeopleFertilizante] = useState<number>(cellConfig.peopleFertilizante ?? 8.5);
  const [peopleFertilizanteLiner, setPeopleFertilizanteLiner] = useState<number>(cellConfig.peopleFertilizanteLiner ?? 8.5);
  const [shiftHours, setShiftHours] = useState<number>(cellConfig.shiftHours ?? 8.5);

  useEffect(() => {
    if (isOpen) {
      setPeopleOne(cellConfig.peopleOne ?? 8.5);
      setPeopleTravado(cellConfig.peopleTravado ?? 11.0);
      setPeopleSalaLimpa(cellConfig.peopleSalaLimpa ?? 8.5);
      setPeopleMulti(cellConfig.peopleMulti ?? 8.5);
      setPeopleFertilizante(cellConfig.peopleFertilizante ?? 8.5);
      setPeopleFertilizanteLiner(cellConfig.peopleFertilizanteLiner ?? 8.5);
      setShiftHours(cellConfig.shiftHours ?? 8.5);
    }
  }, [isOpen, cellConfig]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      peopleOne <= 0 ||
      peopleTravado <= 0 ||
      peopleSalaLimpa <= 0 ||
      peopleMulti <= 0 ||
      peopleFertilizante <= 0 ||
      peopleFertilizanteLiner <= 0 ||
      shiftHours <= 0
    ) {
      showToast('Todos os valores devem ser maiores que zero.', 'error');
      return;
    }
    await updateCellConfig({
      peopleOne,
      peopleTravado,
      peopleSalaLimpa,
      peopleMulti,
      peopleFertilizante,
      peopleFertilizanteLiner,
      shiftHours
    });
    onClose();
  };

  const handleReset = async () => {
    if (window.confirm('Deseja redefinir o dimensionamento da célula para os padrões de fábrica de todos os modelos?')) {
      await resetCellConfig();
      setPeopleOne(8.5);
      setPeopleTravado(11.0);
      setPeopleSalaLimpa(8.5);
      setPeopleMulti(8.5);
      setPeopleFertilizante(8.5);
      setPeopleFertilizanteLiner(8.5);
      setShiftHours(8.5);
      onClose();
    }
  };

  const modelsList = [
    {
      id: 'one',
      name: 'Modelo One',
      val: peopleOne,
      setVal: setPeopleOne,
      defaultVal: 8.5,
      desc: 'Montagem direta de Big Bags e Slings convencionais.',
      badge: 'text-cyan-400'
    },
    {
      id: 'travado',
      name: 'Modelo Travado',
      val: peopleTravado,
      setVal: setPeopleTravado,
      defaultVal: 11.0,
      desc: 'Modelos estruturados com travas internas (baffles).',
      badge: 'text-amber-400'
    },
    {
      id: 'sala_limpa',
      name: 'Modelo Sala Limpa',
      val: peopleSalaLimpa,
      setVal: setPeopleSalaLimpa,
      defaultVal: 8.5,
      desc: 'Ambiente controlado alimentício / farmacêutico.',
      badge: 'text-emerald-400'
    },
    {
      id: 'multi',
      name: 'Modelo Multi',
      val: peopleMulti,
      setVal: setPeopleMulti,
      defaultVal: 8.5,
      desc: 'Células multifuncionais e montagens compostas.',
      badge: 'text-purple-400'
    },
    {
      id: 'fertilizante',
      name: 'Modelo Fertilizante',
      val: peopleFertilizante,
      setVal: setPeopleFertilizante,
      defaultVal: 8.5,
      desc: 'Big Bags reforçados para fertilizantes e granéis pesados.',
      badge: 'text-lime-400'
    },
    {
      id: 'fertilizante_liner',
      name: 'Modelo Fertilizante c/ Liner',
      val: peopleFertilizanteLiner,
      setVal: setPeopleFertilizanteLiner,
      defaultVal: 8.5,
      desc: 'Big Bags de fertilizantes com inserção e fixação de liner.',
      badge: 'text-blue-400'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Dimensionamento da Célula de Costura
              </h2>
              <p className="text-xs text-slate-400">
                Ajuste o número de operadores por célula para cada tipo de modelo
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
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
          
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              O <strong>número de pessoas</strong> é a constante que multiplica o ritmo unitário horário <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-cyan-300">60 ÷ T</code> para determinar a <strong>Estimativa de Ritmo (ER)</strong> da célula em cada tipo de produção.
            </span>
          </div>

          {/* Grid of 6 Models */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {modelsList.map(m => (
              <div key={m.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    {m.name}
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${m.badge}`}>
                    (Padrão: {m.defaultVal.toFixed(1).replace('.', ',')})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="100"
                      value={m.val}
                      onChange={e => m.setVal(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                      required
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">
                      pess.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => m.setVal(m.defaultVal)}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
                    title={`Redefinir para ${m.defaultVal}`}
                  >
                    {m.defaultVal.toFixed(1).replace('.', ',')}
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 leading-tight">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Shift Hours Input */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Jornada de Trabalho Útil Diária</span>
              <span className="text-[11px] font-mono text-emerald-400 font-normal">(Padrão: 8,5h)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1"
                max="24"
                value={shiftHours}
                onChange={e => setShiftHours(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                horas / dia
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Usado para projetar a Produção Diária da célula: <code className="text-emerald-300">ER × {shiftHours}h</code>.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restaurar Padrão</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar Dimensionamento</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
