import { ComponentCategoryConfig, ComponentCategoryKey, OperationItem } from '../types/production';

export const DEFAULT_CATEGORIES: ComponentCategoryConfig[] = [
  {
    key: 'alca',
    title: 'Alça',
    icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    colorClass: 'alca',
    colorHex: '#06b6d4',
    description: 'Costura e fixação de alças de sustentação',
    orderIndex: 1
  },
  {
    key: 'fundo',
    title: 'Fundo',
    icon: 'M3 3h18v18H3z M3 21h18',
    colorClass: 'fundo',
    colorHex: '#10b981',
    description: 'Montagem e costura de fundo',
    orderIndex: 2
  },
  {
    key: 'topo',
    title: 'Topo',
    icon: 'm3 21 1.9-5.7a8.5 8.5 0 1 1 14.2 0L21 21Z',
    colorClass: 'topo',
    colorHex: '#8b5cf6',
    description: 'Costura do topo / saia / aba',
    orderIndex: 3
  },
  {
    key: 'travas',
    title: 'Travas',
    icon: 'M12 3v18 M3 12h18',
    colorClass: 'travas',
    colorHex: '#f59e0b',
    description: 'Travas internas (4 painéis ou circular)',
    orderIndex: 4
  },
  {
    key: 'fechamento',
    title: 'Fechamento',
    icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-15v10',
    colorClass: 'fechamento',
    colorHex: '#f43f5e',
    description: 'Fechamento do corpo do Big Bag',
    orderIndex: 5
  },
  {
    key: 'valvFundo',
    title: 'Válvula Padrão Fundo',
    icon: 'M19 14l-7 7-7-7 M12 3v18',
    colorClass: 'valv-fundo',
    colorHex: '#0d9488',
    description: 'Válvula de descarga inferior',
    orderIndex: 6
  },
  {
    key: 'valvTopo',
    title: 'Válvula Padrão Topo',
    icon: 'M5 10l7-7 7 7 M12 21V3',
    colorClass: 'valv-topo',
    colorHex: '#4f46e5',
    description: 'Válvula de carregamento superior',
    orderIndex: 7
  },
  {
    key: 'saia',
    title: 'Personalização Fechamento da Saia',
    icon: 'M12 2L2 22h20L12 2z',
    colorClass: 'saia',
    colorHex: '#d946ef',
    description: 'Opções de saia e fechamento superior',
    orderIndex: 8
  },
  {
    key: 'valvCustom',
    title: 'Personalização da Válvula',
    icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    colorClass: 'valv-custom',
    colorHex: '#0ea5e9',
    description: 'Costura e formato da válvula (cônica, lacre, etc.)',
    orderIndex: 9
  },
  {
    key: 'outras',
    title: 'Demais Operações',
    icon: 'M4 6h16M4 12h16M4 18h16',
    colorClass: 'outras',
    colorHex: '#64748b',
    description: 'Bainhas, liners e acessórios',
    orderIndex: 10
  },
  {
    key: 'preparacao',
    title: 'Preparação',
    icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    colorClass: 'preparacao',
    colorHex: '#84cc16',
    description: 'Corte, amarração, inspeção, prensa e etiquetas',
    orderIndex: 11
  }
];

export const CATEGORIES_CONFIG: Record<string, ComponentCategoryConfig> = DEFAULT_CATEGORIES.reduce(
  (acc, item) => ({ ...acc, [item.key]: item }),
  {} as Record<string, ComponentCategoryConfig>
);

export const DEFAULT_OPERATIONS: OperationItem[] = [
  // ALÇA
  {
    id: 'alca-op-padrao',
    name: 'Alça (Operação Padrão)',
    time: 2.50,
    isDefault: true,
    category: 'alca',
    history: []
  },
  { id: 'alca-sem-pers', name: 'Sem personalização', time: 0.00, isDefault: false, category: 'alca' },
  { id: 'alca-laminado', name: 'Laminado', time: 0.50, isDefault: false, category: 'alca' },
  { id: 'alca-patch-lam', name: 'Patch+ Lam', time: 0.50, isDefault: false, category: 'alca' },
  { id: 'alca-externo', name: 'Externo', time: 0.50, isDefault: false, category: 'alca' },
  { id: 'alca-feltro', name: 'Feltro', time: 1.00, isDefault: false, category: 'alca' },
  { id: 'alca-de-30-40', name: 'De 30 a 40', time: 1.00, isDefault: false, category: 'alca' },
  { id: 'alca-maior-40', name: 'Maior que 40', time: 1.00, isDefault: false, category: 'alca' },
  { id: 'alca-pe-galinha', name: 'Pé Galinha', time: 0.50, isDefault: false, category: 'alca' },
  { id: 'alca-dupla', name: 'Alça Dupla', time: 0.00, isDefault: false, category: 'alca' },
  { id: 'alca-estiva', name: 'Estiva', time: 2.50, isDefault: false, category: 'alca' },
  { id: 'alca-canto-70', name: 'Canto até 70', time: 0.50, isDefault: false, category: 'alca' },
  { id: 'alca-canto-maior-70', name: 'Canto maior 70', time: 1.00, isDefault: false, category: 'alca' },
  { id: 'alca-travado-30', name: 'Travado até 30', time: 0.00, isDefault: false, category: 'alca' },
  { id: 'alca-altura-17', name: 'Altura maior que 1,7m', time: 0.50, isDefault: false, category: 'alca' },
  { id: 'alca-altura-07', name: 'Altura menor que 0,7m', time: 0.50, isDefault: false, category: 'alca' },

  // FUNDO
  {
    id: 'fundo-op-padrao',
    name: 'Fundo (Operação padrão)',
    time: 1.75,
    isDefault: true,
    category: 'fundo',
    history: []
  },
  { id: 'fundo-sem-pers', name: 'Sem personalização', time: 0.00, isDefault: false, category: 'fundo' },
  { id: 'fundo-laminado', name: 'Laminado', time: 0.35, isDefault: false, category: 'fundo' },
  { id: 'fundo-dobra-dupla', name: 'Dobra dupla', time: 0.00, isDefault: false, category: 'fundo' },
  { id: 'fundo-forrado', name: 'Forrado', time: 0.25, isDefault: false, category: 'fundo' },
  { id: 'fundo-feltro', name: 'Feltro', time: 1.75, isDefault: false, category: 'fundo' },
  { id: 'fundo-1-vedante', name: '1 Vedante', time: 1.00, isDefault: false, category: 'fundo' },
  { id: 'fundo-2-vedante', name: '2 Vedante', time: 1.50, isDefault: false, category: 'fundo' },
  { id: 'fundo-ate-100', name: 'Até 1,00m', time: 0.00, isDefault: false, category: 'fundo' },
  { id: 'fundo-maior-100', name: 'Maior que 1,00m', time: 0.25, isDefault: false, category: 'fundo' },
  { id: 'fundo-4-paineis-105', name: '4 painéis até 1,05m', time: 0.25, isDefault: false, category: 'fundo' },
  { id: 'fundo-4-paineis-maior-105', name: '4 painéis maior que 1,05m', time: 0.25, isDefault: false, category: 'fundo' },
  { id: 'fundo-altura-17', name: 'Altura maior que 1,7m', time: 0.25, isDefault: false, category: 'fundo' },
  { id: 'fundo-liner-abas', name: 'Com liner com abas', time: 8.00, isDefault: false, category: 'fundo' },

  // TOPO
  { id: 'topo-op-padrao', name: 'Topo (Operação padrão)', time: 1.75, isDefault: true, category: 'topo' },
  { id: 'topo-sem-pers', name: 'Sem personalização', time: 0.00, isDefault: false, category: 'topo' },
  { id: 'topo-laminado', name: 'Laminado', time: 0.35, isDefault: false, category: 'topo' },
  { id: 'topo-dobra-dupla', name: 'Dobra dupla', time: 0.00, isDefault: false, category: 'topo' },
  { id: 'topo-forrado', name: 'Forrado', time: 0.25, isDefault: false, category: 'topo' },
  { id: 'topo-feltro', name: 'Feltro', time: 1.75, isDefault: false, category: 'topo' },
  { id: 'topo-1-vedante', name: '1 Vedante', time: 1.00, isDefault: false, category: 'topo' },
  { id: 'topo-2-vedante', name: '2 Vedante', time: 1.50, isDefault: false, category: 'topo' },
  { id: 'topo-ate-100', name: 'Até 1,00m', time: 0.00, isDefault: false, category: 'topo' },
  { id: 'topo-maior-100', name: 'Maior que 1,00m', time: 0.25, isDefault: false, category: 'topo' },
  { id: 'topo-4-paineis-105', name: '4 Painéis até 1,05m', time: 0.25, isDefault: false, category: 'topo' },
  { id: 'topo-4-paineis-maior-105', name: '4 Paineis maior que 1,05m', time: 0.25, isDefault: false, category: 'topo' },
  { id: 'topo-altura-17', name: 'Altura maior que 1,7m', time: 0.35, isDefault: false, category: 'topo' },
  { id: 'topo-envelope', name: 'Envelope', time: 0.35, isDefault: false, category: 'topo' },
  { id: 'topo-saia', name: 'Saia', time: -0.50, isDefault: false, category: 'topo' },
  { id: 'topo-liner-abas', name: 'Com liner e com abas', time: 8.00, isDefault: false, category: 'topo' },

  // TRAVAS
  { id: 'travas-op-padrao', name: 'Travas (Operação padrão) - 4P ou circular', time: 3.50, isDefault: true, category: 'travas' },
  { id: 'travas-sem-pers', name: 'Sem personalização', time: 0.00, isDefault: false, category: 'travas' },
  { id: 'travas-rede-4p', name: 'Rede (4 Painéis)', time: 0.00, isDefault: false, category: 'travas' },
  { id: 'travas-laminado-4p', name: 'Laminado (4 Painéis)', time: 0.00, isDefault: false, category: 'travas' },
  { id: 'travas-cadarco-4p', name: 'Cadarço ou cordão (4 P)', time: 0.00, isDefault: false, category: 'travas' },
  { id: 'travas-1-vedante-4p', name: '1 Vedante (4 Painéis)', time: 3.00, isDefault: false, category: 'travas' },
  { id: 'travas-altura-17-4p', name: 'Altura maior que 1,7 (4P)', time: 0.70, isDefault: false, category: 'travas' },
  { id: 'travas-rede-circ', name: 'Rede (Circular)', time: 0.50, isDefault: false, category: 'travas' },
  { id: 'travas-laminado-circ', name: 'Laminado (Circular)', time: 0.50, isDefault: false, category: 'travas' },
  { id: 'travas-cadarco-circ', name: 'Cadarço ou cordão (Circular)', time: 0.00, isDefault: false, category: 'travas' },
  { id: 'travas-1-vedante-circ', name: '1 Vedante (Circular)', time: 0.00, isDefault: false, category: 'travas' },
  { id: 'travas-altura-17-circ', name: 'Altura Maior que 1,7m (C)', time: 0.70, isDefault: false, category: 'travas' },

  // FECHAMENTO
  { id: 'fechamento-ate-17-4p', name: 'Até 1,7 m (4P)', time: 1.50, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-laminado-4p', name: 'Laminado (4P)', time: 0.25, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-2-vedante-4p', name: '2 Vedante (4P)', time: 1.00, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-altura-17-4p', name: 'Altura maior que 1,7m (4P)', time: 0.25, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-ate-17-8p', name: 'Até 1,7m (8P)', time: 2.25, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-laminado-8p', name: 'Laminado (8P)', time: 0.25, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-2-vedante-8p', name: '2 Vedante (8P)', time: 0.00, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-altura-17-8p', name: 'Altura Maior 1,7m (8P)', time: 0.25, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-6-travas-8p', name: '6 Travas (8P)', time: 2.25, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-ate-17-corpo-u', name: 'Até 1,7M (Corpo U)', time: 2.00, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-laminado-corpo-u', name: 'Laminado (Corpo U)', time: 0.35, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-forrado-corpo-u', name: 'Forrado (Corpo U)', time: 2.00, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-2-vedante-corpo-u', name: '2 Vedante (Corpo U)', time: 1.00, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-altura-17-corpo-u', name: 'Altura maior 1,7m (Corpo U)', time: 0.25, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-forro', name: 'Fechamento forro', time: 0.50, isDefault: false, category: 'fechamento' },
  { id: 'fechamento-forro-dobra', name: 'Fechamento forro dobra', time: 0.65, isDefault: false, category: 'fechamento' },

  // VÁLVULA PADRÃO FUNDO
  { id: 'valvfundo-op-padrao', name: 'Fundo (Operação Padrão)', time: 0.50, isDefault: true, category: 'valvFundo' },
  { id: 'valvfundo-sem-pers', name: 'Sem personalização', time: 0.00, isDefault: false, category: 'valvFundo' },
  { id: 'valvfundo-menor-25', name: 'Menor que 25cm', time: 0.25, isDefault: false, category: 'valvFundo' },
  { id: 'valvfundo-maior-45', name: 'Maior que 45cm', time: 0.15, isDefault: false, category: 'valvFundo' },
  { id: 'valvfundo-encapado', name: 'Encapado', time: 0.50, isDefault: false, category: 'valvFundo' },
  { id: 'valvfundo-vedante', name: 'Vedante', time: 0.20, isDefault: false, category: 'valvFundo' },
  { id: 'valvfundo-feltro', name: 'Feltro', time: 0.50, isDefault: false, category: 'valvFundo' },
  { id: 'valvfundo-convencional', name: 'Convencional', time: 0.00, isDefault: false, category: 'valvFundo' },
  { id: 'valvfundo-corpo-u', name: 'Corpo U', time: 1.00, isDefault: false, category: 'valvFundo' },
  { id: 'valvfundo-forro-leve', name: 'Forro Leve', time: 0.25, isDefault: false, category: 'valvFundo' },
  { id: 'valvfundo-forro-pesado', name: 'Forro Pesado', time: 0.15, isDefault: false, category: 'valvFundo' },
  { id: 'valvfundo-petala', name: 'Petala', time: 0.50, isDefault: false, category: 'valvFundo' },

  // VÁLVULA PADRÃO TOPO
  { id: 'valvtopo-op-padrao', name: 'Topo (Operação Padrão)', time: 0.50, isDefault: true, category: 'valvTopo' },
  { id: 'valvtopo-sem-pers', name: 'Sem personalização', time: 0.00, isDefault: false, category: 'valvTopo' },
  { id: 'valvtopo-menor-25', name: 'Menor que 25cm', time: 0.25, isDefault: false, category: 'valvTopo' },
  { id: 'valvtopo-maior-45', name: 'Maior que 45cm', time: 0.15, isDefault: false, category: 'valvTopo' },
  { id: 'valvtopo-encapado', name: 'Encapado', time: 0.50, isDefault: false, category: 'valvTopo' },
  { id: 'valvtopo-vedante', name: 'Vedante', time: 0.20, isDefault: false, category: 'valvTopo' },
  { id: 'valvtopo-feltro', name: 'Feltro', time: 0.50, isDefault: false, category: 'valvTopo' },
  { id: 'valvtopo-convencional', name: 'Convencional', time: 0.00, isDefault: false, category: 'valvTopo' },
  { id: 'valvtopo-corpo-u', name: 'Corpo U', time: 1.00, isDefault: false, category: 'valvTopo' },
  { id: 'valvtopo-forro-leve', name: 'Forro leve', time: 0.25, isDefault: false, category: 'valvTopo' },
  { id: 'valvtopo-forro-pesado', name: 'Forro pesado', time: 0.15, isDefault: false, category: 'valvTopo' },
  { id: 'valvtopo-petala', name: 'Petala', time: 0.50, isDefault: false, category: 'valvTopo' },

  // PERSONALIZAÇÃO DA SAIA
  { id: 'saia-op-padrao', name: 'Fechamento da saia (Tempo Padrão)', time: 0.50, isDefault: true, category: 'saia' },
  { id: 'saia-sem-pers', name: 'Sem personalização', time: 0.00, isDefault: false, category: 'saia' },
  { id: 'saia-sem-pers-adicional', name: 'Com personalização', time: 0.15, isDefault: false, category: 'saia' },

  // PERSONALIZAÇÃO DA VÁLVULA
  { id: 'valvcustom-op-padrao', name: 'Fechamento de válvula (Laminado Plano)', time: 0.35, isDefault: true, category: 'valvCustom' },
  { id: 'valvcustom-sem-pers', name: 'Sem personalização', time: 0.00, isDefault: false, category: 'valvCustom' },
  { id: 'valvcustom-dobra-dupla', name: 'Dobra Dupla', time: 0.15, isDefault: false, category: 'valvCustom' },
  { id: 'valvcustom-conica', name: 'Cônica', time: 0.50, isDefault: false, category: 'valvCustom' },
  { id: 'valvcustom-lacre', name: 'Lacre', time: 0.10, isDefault: false, category: 'valvCustom' },
  { id: 'valvcustom-convencional', name: 'Convencional', time: 0.00, isDefault: false, category: 'valvCustom' },

  // DEMAIS OPERAÇÕES
  { id: 'outras-corpo-u', name: 'Corpo U', time: 2.00, isDefault: false, category: 'outras' },
  { id: 'outras-bainha-valv-sup', name: 'Bainha Válvula Superior', time: 0.35, isDefault: false, category: 'outras' },
  { id: 'outras-bainha-valv-sup-dupla', name: 'Bainha válvula Sup Dupla', time: 0.50, isDefault: false, category: 'outras' },
  { id: 'outras-bainha-valv-inf', name: 'Bainha da Valv Inferior', time: 0.35, isDefault: false, category: 'outras' },
  { id: 'outras-bainha-valv-inf-dupla', name: 'Bainha Valv Inf Dupla', time: 0.50, isDefault: false, category: 'outras' },
  { id: 'outras-costura-liner-enchimento', name: 'Costura liner na valv de enchimento', time: 1.00, isDefault: false, category: 'outras' },
  { id: 'outras-costura-liner-descarga', name: 'Costura de Liner na Valv de descarga', time: 1.00, isDefault: false, category: 'outras' },
  { id: 'outras-cadarco-valv-1', name: 'Cadarço na Valv tub c/ 1 cadarco', time: 0.20, isDefault: false, category: 'outras' },
  { id: 'outras-cadarco-valv-2', name: 'Cadarço na Valv tub c/ 2 cadarco', time: 0.30, isDefault: false, category: 'outras' },
  { id: 'outras-cadarco-valv-lacre', name: 'Cadarço na Valv tub c/ lacre', time: 0.40, isDefault: false, category: 'outras' },
  { id: 'outras-cadarco-flap-maior', name: 'Cadarço no Flap (Maior que 25 cm de diam)', time: 0.50, isDefault: false, category: 'outras' },
  { id: 'outras-cadarco-flap-menor', name: 'Cadarço no Flap (Menor que 25 cm de diam)', time: 0.70, isDefault: false, category: 'outras' },
  { id: 'outras-topo-laminado-dobrado', name: 'Topo Laminado dobrado 25 e 45 cm de diam', time: 0.50, isDefault: false, category: 'outras' },
  { id: 'outras-fundo-laminado-dobrado', name: 'Fundo lam dobrado 25 a 45 cm Diam', time: 0.50, isDefault: false, category: 'outras' },

  // PREPARAÇÃO
  { id: 'preparacao-casear-alcas', name: 'Casear alças', time: 0.12, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-reforco-vao', name: 'Reforço de Vão', time: 0.13, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-alca-estiva', name: 'Alça Estiva', time: 0.60, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-alcas-argoas', name: 'Alças Argoas', time: 0.80, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-cadarco-alca', name: 'Cadarço na Alça (Argola Maggi)', time: 0.70, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-presilhas-painel', name: 'Presilhas no painel (Owens)', time: 1.05, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-presilha-valvula', name: 'Presilha na válvula', time: 0.92, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-bainha-dupla', name: 'Bainha Dupla', time: 0.54, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-forro-feltro', name: 'Preparação de forro com feltro', time: 3.10, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-meia-alca', name: 'Meia alça no painel', time: 0.37, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-liner-colado', name: 'Liner colado', time: 0.65, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-amarrar-liner', name: 'Amarrar Liner', time: 0.40, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-amarracao', name: 'Amarração', time: 0.50, isDefault: true, category: 'preparacao' },
  { id: 'preparacao-inspecao', name: 'Inspeção', time: 1.00, isDefault: true, category: 'preparacao' },
  { id: 'preparacao-dobra-movimentacao', name: 'Dobra e Movimentação', time: 1.00, isDefault: true, category: 'preparacao' },
  { id: 'preparacao-prensa', name: 'Prensa', time: 1.00, isDefault: true, category: 'preparacao' },
  { id: 'preparacao-velcro-automatica', name: 'Velcro máquina automática', time: 0.35, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-lamina-braskem', name: 'Lâmina maq. Automática braskem', time: 0.27, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-lamina-videolar', name: 'Lamina maq automática videolar', time: 0.69, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-presilha-automatica', name: 'Presilha máq automática', time: 0.48, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-montagem-acessorios', name: 'Montagem acessórios', time: 0.47, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-bolacha-cadarco', name: 'Bolacha e cadarço no fundo', time: 0.40, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-porta-rafia', name: 'Porta dcto de Ráfia', time: 1.00, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-montagem-porta', name: 'Montagem de porta de dcto de (pe + Rafia)', time: 0.20, isDefault: false, category: 'preparacao' },
  { id: 'preparacao-etiqueta-regata', name: 'Etiqueta regata (unidade)', time: 0.02, isDefault: true, category: 'preparacao' },
  { id: 'preparacao-etiquetas', name: 'Etiquetas (unidade)', time: 0.01, isDefault: true, category: 'preparacao' },
  { id: 'preparacao-costura-patch', name: 'Costura do patch (Desfiamento - 4 Um)', time: 1.60, isDefault: false, category: 'preparacao' }
];


