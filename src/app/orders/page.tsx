'use client';

import React, { useState, useMemo } from 'react';
import { useProduction } from '@/context/ProductionContext';
import { ProductionOrder, OrderStatus } from '@/types/production';
import { RecordTimeModal } from '@/components/RecordTimeModal';
import { NewOrderModal } from '@/components/NewOrderModal';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Trash2,
  Gauge,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  const { orders, deleteOrder, showToast } = useProduction();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderForTime, setSelectedOrderForTime] = useState<ProductionOrder | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        order.opNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.modelDescription.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleDelete = async (id: string, opNum: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a OP ${opNum}?`)) {
      await deleteOrder(id);
    }
  };

  const statusBadges: Record<OrderStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    planejada: {
      label: 'Planejada',
      bg: 'bg-slate-800/80',
      text: 'text-slate-300 border-slate-700',
      icon: <Clock className="w-3 h-3 text-slate-400" />
    },
    em_producao: {
      label: 'Em Produção',
      bg: 'bg-amber-950/50',
      text: 'text-amber-300 border-amber-800/50',
      icon: <PlayCircle className="w-3 h-3 text-amber-400 animate-pulse" />
    },
    concluida: {
      label: 'Concluída',
      bg: 'bg-emerald-950/50',
      text: 'text-emerald-300 border-emerald-800/50',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />
    },
    cancelada: {
      label: 'Cancelada',
      bg: 'bg-rose-950/50',
      text: 'text-rose-300 border-rose-800/50',
      icon: <AlertTriangle className="w-3 h-3 text-rose-400" />
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Ordens de Produção (OP)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {orders.length} total
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre OPs, registre tempos reais executados e acompanhe a eficiência por lote.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Calculadora Kanban</span>
          </Link>

          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova OP</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por OP, cliente ou modelo..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'em_producao', label: 'Em Produção' },
            { key: 'concluida', label: 'Concluídas' },
            { key: 'planejada', label: 'Planejadas' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                statusFilter === filter.key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

      </div>

      {/* Orders Table / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center gap-3">
          <ClipboardList className="w-12 h-12 text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">Nenhuma Ordem de Produção encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchTerm || statusFilter !== 'all'
              ? 'Tente alterar os filtros de busca para visualizar outras OPs.'
              : 'Cadastre sua primeira OP através da Calculadora ou pelo botão "Nova OP".'}
          </p>
          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
          >
            Cadastrar Nova OP
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Número da OP</th>
                  <th className="py-3.5 px-4">Cliente & Modelo</th>
                  <th className="py-3.5 px-4 text-center">Progresso (Bags)</th>
                  <th className="py-3.5 px-4 text-right">Tempo Padrão / Bag</th>
                  <th className="py-3.5 px-4 text-right">Previsto vs Real</th>
                  <th className="py-3.5 px-4 text-center">Eficiência</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredOrders.map(order => {
                  const progressPct = Math.min(100, Math.round((order.producedQuantity / order.targetQuantity) * 100));
                  const stdTotal = order.standardTimePerBag * order.producedQuantity;
                  const actualTotal = order.actualTimeTotal || 0;
                  
                  const efficiency = actualTotal > 0
                    ? (stdTotal / actualTotal) * 100
                    : 100;

                  const badge = statusBadges[order.status];

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* OP Number & Date */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                          {order.opNumber}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')} &bull; {order.shift || 'Geral'}
                        </span>
                      </td>

                      {/* Client & Bag Model */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-white truncate" title={order.client}>
                          {order.client}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate" title={order.modelDescription}>
                          {order.modelDescription}
                        </div>
                        {order.operatorName && (
                          <span className="text-[10px] text-slate-500">
                            Op: {order.operatorName}
                          </span>
                        )}
                      </td>

                      {/* Progress Bags */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono font-semibold text-slate-200">
                          {order.producedQuantity} / {order.targetQuantity}
                        </div>
                        <div className="w-24 bg-slate-950 rounded-full h-1.5 mx-auto mt-1 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              progressPct >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          {progressPct}%
                        </span>
                      </td>

                      {/* Standard Time per Bag */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className="font-semibold text-slate-200">
                          {order.standardTimePerBag.toFixed(2).replace('.', ',')} min
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {order.selectedOperationIds.length} operações
                        </span>
                      </td>

                      {/* Planned vs Realized Total */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="text-slate-300">
                          <span className="text-slate-500 text-[10px] mr-1">Prev:</span>
                          <strong>{stdTotal.toFixed(1).replace('.', ',')}m</strong>
                        </div>
                        <div className={actualTotal > 0 ? (actualTotal <= stdTotal ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}>
                          <span className="text-slate-500 text-[10px] mr-1">Real:</span>
                          <strong>{actualTotal > 0 ? `${actualTotal.toFixed(1).replace('.', ',')}m` : '--'}</strong>
                        </div>
                      </td>

                      {/* Efficiency Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {actualTotal > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                              efficiency >= 100
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                : efficiency >= 85
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                                : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            }`}
                          >
                            {efficiency >= 100 ? (
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-amber-400" />
                            )}
                            {efficiency.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Sem apontamento</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrderForTime(order)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Apontar tempo real da OP"
                          >
                            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Apontar</span>
                          </button>

                          <button
                            onClick={() => handleDelete(order.id, order.opNumber)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Excluir OP"
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
      )}

      {/* Record Time Modal */}
      <RecordTimeModal
        order={selectedOrderForTime}
        isOpen={Boolean(selectedOrderForTime)}
        onClose={() => setSelectedOrderForTime(null)}
      />

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
      />

    </div>
  );
}
