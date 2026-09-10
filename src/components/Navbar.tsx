'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calculator,
  Sliders,
  Database,
  Download,
  Timer,
  Menu,
  X,
  TrendingUp,
  Link2,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { useProduction } from '@/context/ProductionContext';
import { ExportImportModal } from './ExportImportModal';
import { AccessLinksModal } from './AccessLinksModal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const {
    isCalculatorOnly,
    connectionStatus,
    isSupabaseOnline,
    hasPendingSync,
    checkConnection,
    syncLocalToCloud
  } = useProduction();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isOperatorFromUrl = typeof window !== 'undefined' && (
    window.location.search.includes('mode=operador') ||
    window.location.search.includes('mode=calc') ||
    window.location.search.includes('mode=operator') ||
    window.location.search.includes('mode=fabrica')
  );

  const isOperatorMode = isCalculatorOnly || isOperatorFromUrl || pathname === '/calc';

  const navItems = [
    {
      label: 'Calculadora de Tempo',
      shortLabel: 'Calculadora',
      href: '/',
      icon: <Calculator className="w-4 h-4" />
    },
    {
      label: 'Tempos & Parâmetros',
      shortLabel: 'Parâmetros',
      href: '/settings',
      icon: <Sliders className="w-4 h-4" />
    },
    {
      label: 'Ganhos & Impacto R$',
      shortLabel: 'Ganhos R$',
      href: '/indicators',
      icon: <TrendingUp className="w-4 h-4" />
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            
            {/* Brand Logo & Author Credit */}
            <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
              <Link href={isOperatorMode ? '/calc' : '/'} className="flex items-center gap-2.5 sm:gap-3 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:text-emerald-300 transition-colors" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold tracking-tight text-lg sm:text-xl text-white">
                      Bag<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Time</span>
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 hidden 2xl:inline leading-none font-medium">
                    Sistema de Tempos & Eficiência
                  </span>
                </div>
              </Link>

              {/* Author Credit Badge */}
              <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">Criado por</span>
                <strong className="text-cyan-300 font-semibold tracking-wide">Mauricio Grigol</strong>
              </div>
            </div>

            {/* Operator Mode Indicator (Center) */}
            {isOperatorMode ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Setor Desenvolvimento</span>
                </div>

                {connectionStatus === 'online' ? (
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-800/30 font-mono"
                    title="Nuvem Supabase Online: Apontamentos sincronizados em tempo real."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Nuvem Online</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => syncLocalToCloud()}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-950/50 text-amber-300 border border-amber-800/50 font-mono cursor-pointer hover:bg-amber-900/40 transition-colors"
                    title="Modo Offline: Dados salvos com segurança no navegador (LocalStorage). Clique para tentar reconectar à nuvem."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Offline (Salvo Local)</span>
                  </button>
                )}
              </div>
            ) : (
              /* Desktop Navigation Links (Only in Full Mode) */
              <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0">
                {navItems.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-900 text-cyan-300 shadow-md border border-cyan-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      {item.icon}
                      <span className="hidden xl:inline whitespace-nowrap">{item.label}</span>
                      <span className="xl:hidden whitespace-nowrap">{item.shortLabel}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Storage, Access Links & Backup Actions (Only in Full Mode) */}
            {!isOperatorMode && (
              <div className="hidden xl:flex items-center gap-2 shrink-0">
                {/* Access Links Button */}
                <button
                  onClick={() => setIsAccessModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-500/40"
                  title="Compartilhar ou alternar links de acesso (Operador vs Engenharia)"
                >
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Links de Acesso</span>
                </button>

                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700/60 hover:border-slate-600 transition-colors cursor-pointer"
                  title="Backup e Migração de Dados"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Backup</span>
                </button>

                {/* Cloud & Offline Live Status Badge */}
                {connectionStatus === 'online' ? (
                  <button
                    type="button"
                    onClick={() => checkConnection()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-950/70 transition-all cursor-pointer shadow-sm group"
                    title="Nuvem Supabase Online: Banco conectado e sincronizado em tempo real. Clique para verificar status."
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse group-hover:scale-125 transition-transform" />
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono">Nuvem Online</span>
                  </button>
                ) : connectionStatus === 'syncing' ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/50 text-cyan-300 border border-cyan-800/50 shadow-sm font-mono"
                    title="Sincronizando dados com a nuvem..."
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span>Sincronizando...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => syncLocalToCloud()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-950/50 text-amber-300 border border-amber-800/60 hover:bg-amber-900/50 transition-all cursor-pointer shadow-sm group"
                    title="Modo Offline: Sem conexão com a nuvem. Seus dados estão salvos com segurança no LocalStorage do navegador. Clique para tentar reconectar e subir os dados."
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono">Offline (Salvo Local)</span>
                    {hasPendingSync && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 font-mono font-bold">
                        Subir Nuvem
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Mobile Menu Button (Only in Full Mode) */}
            {!isOperatorMode && (
              <div className="flex md:hidden items-center gap-2">
                <button
                  onClick={() => setIsAccessModalOpen(true)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400"
                  title="Links de Acesso"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Dropdown (Only in Full Mode) */}
        {!isOperatorMode && isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-2 pb-4 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400">Desenvolvido por</span>
              <strong className="text-cyan-300">Mauricio Grigol</strong>
            </div>

            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-slate-900 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
              {/* Mobile Connection Status Indicator */}
              {connectionStatus === 'online' ? (
                <div className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nuvem Supabase Online</span>
                </div>
              ) : connectionStatus === 'syncing' ? (
                <div className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold bg-cyan-950/50 border border-cyan-800/50 text-cyan-300 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span>Sincronizando com a Nuvem...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    syncLocalToCloud();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold bg-amber-950/50 border border-amber-800/60 text-amber-300 font-mono cursor-pointer hover:bg-amber-900/50"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Offline (Salvo Local) - Sincronizar</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAccessModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold bg-cyan-950/60 border border-cyan-700/50 text-cyan-300"
              >
                <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Links de Acesso (Gerenciar)</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsExportModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Backup e Exportação (JSON/CSV)</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Access Links Modal */}
      <AccessLinksModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </>
  );
};
