'use client';

import React, { useState } from 'react';
import { useProduction } from '@/context/ProductionContext';
import {
  X,
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Code,
  Trash2
} from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose }) => {
  const { exportData, importData, operations, categories, clearAllDataForProduction, showToast } = useProduction();
  const [activeTab, setActiveTab] = useState<'backup' | 'csv' | 'supabase'>('backup');
  const [importJsonText, setImportJsonText] = useState('');

  if (!isOpen) return null;

  const handleDownloadJSON = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_bigbag_parametros_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Backup JSON baixado com sucesso!', 'success');
    } catch (e) {
      showToast('Erro ao exportar JSON.', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      if (operations.length === 0) {
        showToast('Nenhuma operação cadastrada para exportar.', 'info');
        return;
      }

      const headers = [
        'Bloco_Componente',
        'Nome_Operacao',
        'Tempo_Padrao_Min',
        'Tempo_Padrao_Seg',
        'Tipo_Operacao'
      ];

      const rows = operations.map(op => {
        const cat = categories.find(c => c.key === op.category)?.title || op.category;
        return [
          `"${cat}"`,
          `"${op.name}"`,
          op.time.toFixed(2).replace('.', ','),
          (op.time * 60).toFixed(0),
          op.isDefault ? 'Padrão de Fábrica' : 'Opcional'
        ].join(';');
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `catalogo_tempos_padrao_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Catálogo de tempos exportado em CSV com sucesso!', 'success');
    } catch (e) {
      showToast('Erro ao exportar CSV.', 'error');
    }
  };

  const handleImportJSON = async () => {
    try {
      if (!importJsonText.trim()) {
        showToast('Cole o conteúdo JSON antes de importar.', 'error');
        return;
      }
      const parsed = JSON.parse(importJsonText);
      await importData(parsed);
      setImportJsonText('');
      onClose();
    } catch (e) {
      showToast('Formato JSON inválido. Verifique o arquivo.', 'error');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        await importData(parsed);
        onClose();
      } catch (err) {
        showToast('Erro ao ler arquivo JSON.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gerenciamento de Dados & Backup</h2>
              <p className="text-xs text-slate-400">Exportação, importação e migração futura para Supabase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6 pt-2 bg-slate-950/20">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            Backup JSON
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'csv'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar CSV / Excel
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'supabase'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            Migração Supabase
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Exportar Backup Completo</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Gera um arquivo JSON contendo todas as operações, tempos customizados e histórico de OPs.
                  </p>
                </div>
                <button
                  onClick={handleDownloadJSON}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold hover:from-cyan-600 hover:to-teal-600 shadow-md flex items-center gap-2 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Baixar JSON
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-white">Restaurar / Importar Backup</h3>
                <p className="text-xs text-slate-400">
                  Carregue um arquivo JSON salvo anteriormente para restaurar seus dados.
                </p>

                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer border border-slate-700 flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    Selecionar Arquivo JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-500">ou cole o texto abaixo:</span>
                </div>

                <textarea
                  value={importJsonText}
                  onChange={e => setImportJsonText(e.target.value)}
                  placeholder='Cole o conteúdo do backup JSON aqui...'
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
                />

                {importJsonText.trim() && (
                  <button
                    onClick={handleImportJSON}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    Confirmar Importação de Dados
                  </button>
                )}
              </div>

              {/* Reset Section */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-rose-950/20 border border-rose-900/40">
                  <div>
                    <span className="text-xs font-bold text-rose-300 block">
                      🧹 Limpar Banco de Dados (Modo Produção Real)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Remove todas as OPs de teste e estudos de cronoanálise, deixando o sistema 100% limpo para apontamento real.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja limpar todos os dados e iniciar o modo de Produção Real? Esta ação apagará todas as OPs de teste.')) {
                        clearAllDataForProduction();
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:text-white bg-rose-900/30 hover:bg-rose-800 border border-rose-700/50 flex items-center gap-1.5 shrink-0 self-start sm:self-auto transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar Tudo para Produção
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-white">Exportar Catálogo de Tempos para Excel / CSV</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Exporta a tabela completa de componentes, operações e tempos padrão de costura em formato compatível com Excel e Google Planilhas.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Baixar Catálogo em Planilha (.csv)
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
                <p className="font-semibold text-slate-300 mb-1">Dica de uso:</p>
                O arquivo CSV gerado usa delimitador ponto-e-vírgula (;) e codificação UTF-8 com BOM, abrindo perfeitamente no Microsoft Excel, Google Planilhas e Power BI.
              </div>
            </div>
          )}

          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Arquitetura 100% Preparada para o Supabase
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O sistema foi construído utilizando um padrão de repositório abstrato (<code className="text-emerald-300">IStorageService</code>). Atualmente roda em <strong className="text-white">LocalStorage</strong> e mudará para o Supabase instantaneamente assim que você configurar as variáveis de ambiente.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Passo a Passo de Ativação:</h4>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <li>Crie seu projeto no <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-1">Supabase <ExternalLink className="w-3 h-3" /></a></li>
                  <li>No menu <strong>SQL Editor</strong>, execute o script disponível no arquivo <code className="text-cyan-300">src/sql/schema.sql</code> deste projeto.</li>
                  <li>Crie o arquivo <code className="text-cyan-300">.env.local</code> na raiz do projeto com as chaves:
                    <pre className="mt-2 p-2 bg-slate-900 rounded border border-slate-800 text-cyan-300 font-mono text-[11px]">
{`NEXT_PUBLIC_STORAGE_TYPE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon`}
                    </pre>
                  </li>
                  <li>Pronto! O sistema migrará automaticamente do LocalStorage para a nuvem em tempo real.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
