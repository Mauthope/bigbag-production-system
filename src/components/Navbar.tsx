'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calculator,
  ClipboardList,
  BarChart3,
  Sliders,
  Database,
  Download,
  Boxes,
  Menu,
  X
} from 'lucide-react';
import { useProduction } from '@/context/ProductionContext';
import { ExportImportModal } from './ExportImportModal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { orders } = useProduction();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const inProgressCount = orders.filter(o => o.status === 'em_producao').length;

  const navItems = [
    {
      label: 'Calculadora',
      href: '/',
      icon: <Calculator className="w-4 h-4" />
    },
    {
      label: 'Ordens de Produção (OP)',
      href: '/orders',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: inProgressCount > 0 ? `${inProgressCount} ativas` : undefined
    },
    {
      label: 'Dashboard de Eficiência',
      href: '/dashboard',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      label: 'Tempos & Parâmetros',
      href: '/settings',
      icon: <Sliders className="w-4 h-4" />
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Boxes className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 tracking-tight text-lg">
                    BigBag Pro
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                    Next.js
                  </span>
                </div>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Sistema de Tempos & Eficiência
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800/90 text-cyan-300 shadow-sm border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Actions & Storage Status */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700/60 hover:border-slate-600 transition-colors"
                title="Backup e Migração de Dados"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Backup / Migração</span>
              </button>

              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 cursor-pointer"
                title="Armazenado no LocalStorage. Estruturado e pronto para conexão com Supabase."
                onClick={() => setIsExportModalOpen(true)}
              >
                <Database className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>LocalStorage (Supabase Ready)</span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-2 pb-4 space-y-1">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsExportModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Backup e Migração (JSON/CSV)</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </>
  );
};
