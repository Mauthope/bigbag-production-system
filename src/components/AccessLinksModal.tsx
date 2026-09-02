'use client';

import React, { useState, useEffect } from 'react';
import { useProduction } from '@/context/ProductionContext';
import {
  X,
  Link as LinkIcon,
  Copy,
  Check,
  Calculator,
  ShieldCheck,
  ShieldAlert,
  Users,
  Sparkles,
  ExternalLink,
  Lock,
  Unlock,
  Sliders,
  TrendingUp,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface AccessLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessLinksModal: React.FC<AccessLinksModalProps> = ({ isOpen, onClose }) => {
  const { accessMode, setAccessMode, showToast } = useProduction();
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<'calc' | 'full' | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname === '/' ? '' : window.location.pathname;
      setBaseUrl(origin + (pathname.startsWith('/indicators') || pathname.startsWith('/settings') ? '' : pathname));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const operatorUrl = `${baseUrl || 'https://bagtime.app'}/calc`;
  const fullUrl = `${baseUrl || 'https://bagtime.app'}/?mode=full`;

  const handleCopy = async (type: 'calc' | 'full', url: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers / iframe
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(type);
      showToast(
        type === 'calc'
          ? 'Link de Operador (Apenas Calculadora) copiado com sucesso!'
          : 'Link de Acesso Completo (Engenharia) copiado com sucesso!',
        'success'
      );
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (err) {
      showToast('Erro ao copiar link. Selecione e copie manualmente.', 'error');
    }
  };

  const handleSwitchMode = (mode: 'full' | 'calculator_only') => {
    setAccessMode(mode);
    showToast(
      mode === 'calculator_only'
        ? 'Modo Operador Ativado: Acesso restrito apenas ao 1º menu (Calculadora).'
        : 'Modo Completo Ativado: Todos os menus e indicadores liberados!',
      'info'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 text-cyan-400">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Links de Acesso Distintos
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold">
                  Controle de Menus
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Compartilhe links específicos para cada perfil de usuário no chão de fábrica ou engenharia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
          
          {/* Status Bar */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Modo de Acesso Atual neste Navegador:</span>
              {accessMode === 'calculator_only' ? (
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold flex items-center gap-1.5 font-mono">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Operador (Apenas Calculadora)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold flex items-center gap-1.5 font-mono">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  Acesso Completo (Engenharia)
                </span>
              )}
            </div>

            <button
              onClick={() => handleSwitchMode(accessMode === 'calculator_only' ? 'full' : 'calculator_only')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              {accessMode === 'calculator_only' ? 'Alternar para Modo Completo' : 'Simular Modo Operador'}
            </button>
          </div>

          {/* LINK 1: MODO OPERADOR (APENAS 1º MENU) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            accessMode === 'calculator_only'
              ? 'bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/30'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">
                      Link 1: Operador de Fábrica (Apenas Calculadora)
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold">
                      1º Menu Exclusivo
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Acesso exclusivo ao <strong>1º menu (Calculadora de Tempo)</strong>. Oculta dados de custos em R$, cronoanálise e parâmetros técnicos.
                  </p>
                </div>
              </div>
            </div>

            {/* URL Display & Action */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 truncate select-all">
                  {operatorUrl}
                </div>
                <button
                  onClick={() => handleCopy('calc', operatorUrl)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
                  title="Copiar link para enviar aos operadores"
                >
                  {copiedLink === 'calc' ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
                  <span>{copiedLink === 'calc' ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              {/* Menu items preview badge */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 flex-wrap">
                <span className="text-slate-500">Menus Visíveis:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-medium flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> 1. Calculadora de Tempo
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 line-through flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> 2. Parâmetros
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 line-through flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> 3. Ganhos R$
                </span>
              </div>
            </div>
          </div>

          {/* LINK 2: MODO COMPLETO (TODOS OS MENUS) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            accessMode === 'full'
              ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/30'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">
                      Link 2: Engenharia & Gestão (Acesso Completo)
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono font-bold">
                      Todos os Menus
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Acesso irrestrito a todo o projeto: <strong>Calculadora</strong>, <strong>Cronoanálise Lean & Parâmetros</strong> e <strong>Painel Financeiro & ROI</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* URL Display & Action */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 truncate select-all">
                  {fullUrl}
                </div>
                <button
                  onClick={() => handleCopy('full', fullUrl)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
                  title="Copiar link para engenharia e gestores"
                >
                  {copiedLink === 'full' ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
                  <span>{copiedLink === 'full' ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              {/* Menu items preview badge */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 flex-wrap">
                <span className="text-slate-500">Menus Visíveis:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-medium flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> 1. Calculadora
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 font-medium flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> 2. Parâmetros
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> 3. Ganhos R$
                </span>
              </div>
            </div>
          </div>

          {/* Explanatory Guide */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              Como funciona o direcionamento?
            </div>
            <p className="leading-relaxed">
              Ao abrir o <strong>Link 1</strong> (<code className="text-cyan-300 font-mono">?mode=calc</code>), o sistema armazena a preferência de operador naquele dispositivo. Caso alguém tente navegar manualmente para os menus restritos (<code className="text-slate-400 font-mono">/indicators</code> ou <code className="text-slate-400 font-mono">/settings</code>), o sistema bloqueia a visualização.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            BagTime &bull; Sistema de Produção & Engenharia
          </span>
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
