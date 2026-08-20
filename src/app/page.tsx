'use client';

import React from 'react';
import { useProduction } from '@/context/ProductionContext';
import { KanbanColumn } from '@/components/KanbanColumn';
import { SummaryPanel } from '@/components/SummaryPanel';
import {
  RotateCcw,
  CheckSquare,
  Square,
  Sliders
} from 'lucide-react';
import Link from 'next/link';

export default function CalculatorPage() {
  const {
    categories,
    operations,
    selectedOperationIds,
    toggleOperation,
    selectAllOperations,
    clearAllOperations,
    resetToStandardOperations,
    categoryTotals,
    isLoading
  } = useProduction();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <span className="text-sm font-medium text-slate-400">Carregando parâmetros e tempos...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Calculadora Kanban de Tempo de Produção
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/40">
              {categories.length} Componentes
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Selecione as especificações do Big Bag para obter o tempo padrão total de costura em tempo real.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={resetToStandardOperations}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
            title="Marca apenas as operações padrão de cada componente"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Operação Padrão</span>
          </button>

          <button
            onClick={selectAllOperations}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Marcar Todos</span>
          </button>

          <button
            onClick={clearAllOperations}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 text-slate-400" />
            <span>Limpar Todos</span>
          </button>

          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors ml-1 cursor-pointer"
            title="Editar tempos padrão no painel de parâmetros"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Editar Tempos</span>
          </Link>
        </div>
      </div>

      {/* Main Kanban Grid */}
      <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {categories.map(config => {
          const catOperations = operations.filter(op => op.category === config.key);
          const catTotal = categoryTotals[config.key]?.totalTime || 0;

          return (
            <KanbanColumn
              key={config.key}
              config={config}
              items={catOperations}
              selectedIds={selectedOperationIds}
              totalTime={catTotal}
              onToggle={toggleOperation}
            />
          );
        })}
      </main>

      {/* Bottom Summary Bar */}
      <SummaryPanel />

    </div>
  );
}
