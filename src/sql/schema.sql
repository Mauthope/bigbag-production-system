-- ==============================================================================
-- BAGTIME - SISTEMA INDUSTRIAL DE TEMPOS, CRONOANÁLISE & RETORNO FINANCEIRO
-- SCHEMA OFICIAL SUPABASE / POSTGRESQL (DADOS 100% LIMPOS PARA PRODUÇÃO)
-- ==============================================================================
-- Instruções:
-- 1. Acesse o seu Dashboard no Supabase (https://supabase.com/dashboard)
-- 2. Vá em 'SQL Editor' -> 'New query'
-- 3. Cole todo o conteúdo deste arquivo e clique em 'Run' (Ctrl+Enter)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA DE CATEGORIAS / BLOCOS OPERACIONAIS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    key TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    icon TEXT,
    color_class TEXT,
    color_hex TEXT NOT NULL DEFAULT '#06b6d4',
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. TABELA DE OPERAÇÕES PADRÃO E CRONOMETRAGENS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    time NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    previous_time NUMERIC(6, 2),
    initial_time NUMERIC(6, 2),
    custom_volume INTEGER,
    is_default BOOLEAN NOT NULL DEFAULT false,
    category TEXT NOT NULL,
    description TEXT,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. TABELA DE CONFIGURAÇÃO DE CÉLULAS & HEADCOUNT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cell_config (
    id TEXT PRIMARY KEY DEFAULT 'default_cell_config',
    people_one NUMERIC(4, 1) NOT NULL DEFAULT 8.5,
    people_travado NUMERIC(4, 1) NOT NULL DEFAULT 11.0,
    people_sala_limpa NUMERIC(4, 1) NOT NULL DEFAULT 8.5,
    people_multi NUMERIC(4, 1) NOT NULL DEFAULT 8.5,
    people_fertilizante NUMERIC(4, 1) NOT NULL DEFAULT 8.5,
    people_fertilizante_liner NUMERIC(4, 1) NOT NULL DEFAULT 8.5,
    shift_hours NUMERIC(4, 1) NOT NULL DEFAULT 8.5,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. TABELA DE PARÂMETROS FINANCEIROS & HISTÓRICO MENSAL
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_config (
    id TEXT PRIMARY KEY DEFAULT 'default_financial_config',
    active_month_key TEXT NOT NULL DEFAULT '2026-08',
    monthly_volume INTEGER NOT NULL DEFAULT 20000,
    default_hourly_rate NUMERIC(8, 2) NOT NULL DEFAULT 28.50,
    sector_hourly_rates JSONB DEFAULT '{}'::jsonb,
    comparison_baseline_mode TEXT DEFAULT 'previous',
    error_margin_percent NUMERIC(4, 1) DEFAULT 5.0,
    monthly_history JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. TABELA DE CRONOANÁLISE LEAN & ESTUDOS DE TEMPOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_studies (
    id TEXT PRIMARY KEY,
    operation_id TEXT NOT NULL,
    operation_name TEXT NOT NULL,
    category TEXT NOT NULL,
    operator_name TEXT,
    analyst_name TEXT,
    date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    micro_operations JSONB NOT NULL DEFAULT '[]'::jsonb,
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. TABELA DE ORDENS DE PRODUÇÃO (OPs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_orders (
    id TEXT PRIMARY KEY,
    op_number TEXT NOT NULL UNIQUE,
    client TEXT NOT NULL,
    model_description TEXT NOT NULL,
    target_quantity INTEGER NOT NULL DEFAULT 1,
    produced_quantity INTEGER NOT NULL DEFAULT 0,
    selected_operation_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    standard_time_per_bag NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    total_standard_time NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_time_total NUMERIC(10, 2),
    component_times JSONB DEFAULT '{}'::jsonb,
    operator_name TEXT,
    shift TEXT,
    status TEXT NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada', 'em_producao', 'concluida', 'cancelada')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 7. ÍNDICES DE PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_operations_category ON operations(category);
CREATE INDEX IF NOT EXISTS idx_time_studies_operation ON time_studies(operation_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_created ON production_orders(created_at DESC);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ------------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura total de categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Permitir modificação de categories" ON categories FOR ALL USING (true);

CREATE POLICY "Permitir leitura total de operations" ON operations FOR SELECT USING (true);
CREATE POLICY "Permitir modificação de operations" ON operations FOR ALL USING (true);

CREATE POLICY "Permitir leitura total de cell_config" ON cell_config FOR SELECT USING (true);
CREATE POLICY "Permitir modificação de cell_config" ON cell_config FOR ALL USING (true);

CREATE POLICY "Permitir leitura total de financial_config" ON financial_config FOR SELECT USING (true);
CREATE POLICY "Permitir modificação de financial_config" ON financial_config FOR ALL USING (true);

CREATE POLICY "Permitir leitura total de time_studies" ON time_studies FOR SELECT USING (true);
CREATE POLICY "Permitir modificação de time_studies" ON time_studies FOR ALL USING (true);

CREATE POLICY "Permitir leitura total de production_orders" ON production_orders FOR SELECT USING (true);
CREATE POLICY "Permitir modificação de production_orders" ON production_orders FOR ALL USING (true);


-- ==============================================================================
-- 9. CARGA INICIAL LIMPA (SEEDS DE PRODUÇÃO OFICIAIS)
-- ==============================================================================

-- A. Categorias Padrão
INSERT INTO categories (key, title, icon, color_class, color_hex, description, order_index) VALUES
('alca', 'Alça', 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', 'alca', '#06b6d4', 'Costura e fixação de alças de sustentação', 1),
('fundo', 'Fundo', 'M3 3h18v18H3z M3 21h18', 'fundo', '#10b981', 'Montagem e costura de fundo', 2),
('topo', 'Topo', 'm3 21 1.9-5.7a8.5 8.5 0 1 1 14.2 0L21 21Z', 'topo', '#8b5cf6', 'Costura do topo / saia / aba', 3),
('travas', 'Travas', 'M12 3v18 M3 12h18', 'travas', '#f59e0b', 'Travas internas (4 painéis ou circular)', 4),
('fechamento', 'Fechamento', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-15v10', 'fechamento', '#f43f5e', 'Fechamento do corpo do Big Bag', 5),
('valvFundo', 'Válvula Padrão Fundo', 'M19 14l-7 7-7-7 M12 3v18', 'valv-fundo', '#0d9488', 'Válvula de descarga inferior', 6),
('valvTopo', 'Válvula Padrão Topo', 'M5 10l7-7 7 7 M12 21V3', 'valv-topo', '#f97316', 'Válvula de enchimento superior', 7),
('colocacaoLiner', 'Colocação de Liner', 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'liner', '#6366f1', 'Inserção e fixação de liner tubular/garrafa', 8),
('enfardamento', 'Enfardamento', 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', 'enfardamento', '#ec4899', 'Prensa, amarração e enfardamento final', 9),
('outras', 'Demais Operações', 'M4 6h16M4 12h16M4 18h16', 'outras', '#64748b', 'Bainhas, liners e acessórios', 10),
('preparacao', 'Preparação', 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', 'preparacao', '#84cc16', 'Corte, amarração, inspeção, prensa e etiquetas', 11)
ON CONFLICT (key) DO NOTHING;

-- B. Operações Padrão Oficiais
INSERT INTO operations (id, name, time, is_default, category) VALUES
-- ALÇA
('alca-op-padrao', 'Alça (Operação Padrão)', 2.50, true, 'alca'),
('alca-sem-pers', 'Sem personalização', 0.00, false, 'alca'),
('alca-laminado', 'Laminado', 0.50, false, 'alca'),
('alca-patch-lam', 'Patch+ Lam', 0.50, false, 'alca'),
('alca-externo', 'Externo', 0.50, false, 'alca'),
('alca-feltro', 'Feltro', 1.00, false, 'alca'),
('alca-de-30-40', 'De 30 a 40', 1.00, false, 'alca'),
('alca-maior-40', 'Maior que 40', 1.00, false, 'alca'),
('alca-pe-galinha', 'Pé Galinha', 0.50, false, 'alca'),
('alca-dupla', 'Alça Dupla', 0.00, false, 'alca'),
('alca-estiva', 'Estiva', 2.50, false, 'alca'),
('alca-canto-70', 'Canto até 70', 0.50, false, 'alca'),
('alca-canto-maior-70', 'Canto maior 70', 1.00, false, 'alca'),
('alca-travado-30', 'Travado até 30', 0.00, false, 'alca'),
('alca-altura-17', 'Altura maior que 1,7m', 0.50, false, 'alca'),
('alca-altura-07', 'Altura menor que 0,7m', 0.50, false, 'alca'),

-- FUNDO
('fundo-op-padrao', 'Fundo (Operação padrão)', 1.75, true, 'fundo'),
('fundo-sem-pers', 'Sem personalização', 0.00, false, 'fundo'),
('fundo-laminado', 'Laminado', 0.35, false, 'fundo'),
('fundo-dobra-dupla', 'Dobra dupla', 0.00, false, 'fundo'),
('fundo-forrado', 'Forrado', 0.25, false, 'fundo'),
('fundo-feltro', 'Feltro', 1.75, false, 'fundo'),
('fundo-1-vedante', '1 Vedante', 1.00, false, 'fundo'),
('fundo-2-vedante', '2 Vedante', 1.50, false, 'fundo'),
('fundo-ate-100', 'Até 1,00m', 0.00, false, 'fundo'),
('fundo-maior-100', 'Maior que 1,00m', 0.25, false, 'fundo'),
('fundo-4-paineis-105', '4 painéis até 1,05m', 0.25, false, 'fundo'),
('fundo-4-paineis-maior-105', '4 painéis maior que 1,05m', 0.25, false, 'fundo'),
('fundo-altura-17', 'Altura maior que 1,7m', 0.25, false, 'fundo'),
('fundo-liner-abas', 'Com liner com abas', 8.00, false, 'fundo'),

-- TOPO
('topo-op-padrao', 'Topo (Operação padrão)', 1.75, true, 'topo'),
('topo-sem-pers', 'Sem personalização', 0.00, false, 'topo'),
('topo-laminado', 'Laminado', 0.35, false, 'topo'),
('topo-dobra-dupla', 'Dobra dupla', 0.00, false, 'topo'),
('topo-forrado', 'Forrado', 0.25, false, 'topo'),
('topo-feltro', 'Feltro', 1.75, false, 'topo'),
('topo-1-vedante', '1 Vedante', 1.00, false, 'topo'),
('topo-2-vedante', '2 Vedante', 1.50, false, 'topo'),
('topo-ate-100', 'Até 1,00m', 0.00, false, 'topo'),
('topo-maior-100', 'Maior que 1,00m', 0.25, false, 'topo'),
('topo-4-paineis-105', '4 Painéis até 1,05m', 0.25, false, 'topo'),
('topo-4-paineis-maior-105', '4 Paineis maior que 1,05m', 0.25, false, 'topo'),
('topo-altura-17', 'Altura maior que 1,7m', 0.35, false, 'topo'),
('topo-envelope', 'Envelope', 0.35, false, 'topo'),
('topo-saia', 'Saia', -0.50, false, 'topo'),
('topo-liner-abas', 'Com liner e com abas', 8.00, false, 'topo'),

-- TRAVAS
('travas-op-padrao', 'Travas (Operação Padrão)', 0.00, true, 'travas'),
('travas-sem-travas', 'Sem travas', 0.00, false, 'travas'),
('travas-circular-17', 'Circular até 1,7m', 1.50, false, 'travas'),
('travas-circular-maior-17', 'Circular maior 1,7m', 1.80, false, 'travas'),
('travas-4-paineis-17', '4 painéis até 1,7m', 2.00, false, 'travas'),
('travas-4-paineis-maior-17', '4 painéis maior que 1,7m', 2.50, false, 'travas'),

-- FECHAMENTO
('fechamento-op-padrao', 'Fechamento (Operação Padrão)', 1.75, true, 'fechamento'),
('fechamento-sem-pers', 'Sem personalização', 0.00, false, 'fechamento'),
('fechamento-laminado', 'Laminado', 0.35, false, 'fechamento'),
('fechamento-forrado', 'Forrado', 0.25, false, 'fechamento'),
('fechamento-feltro', 'Feltro', 1.75, false, 'fechamento'),
('fechamento-1-vedante', '1 Vedante', 1.00, false, 'fechamento'),
('fechamento-2-vedante', '2 Vedante', 1.50, false, 'fechamento'),
('fechamento-12-17', 'De 1,2 a 1,7m', 0.00, false, 'fechamento'),
('fechamento-17-20', 'De 1,7 a 2,0m', 0.25, false, 'fechamento'),
('fechamento-maior-20', 'Maior que 2,0m', 0.50, false, 'fechamento'),
('fechamento-menor-12', 'Menor que 1,2m', -0.25, false, 'fechamento'),
('fechamento-4-paineis', '4 Painéis', 0.50, false, 'fechamento'),
('fechamento-dupla-costura', 'Dupla costura', 0.50, false, 'fechamento'),

-- VÁLVULA PADRÃO FUNDO
('valv-fundo-op-padrao', 'Válvula Padrão Fundo (Operação)', 0.00, true, 'valvFundo'),
('valv-fundo-sem', 'Sem válvula', 0.00, false, 'valvFundo'),
('valv-fundo-com', 'Com válvula', 0.80, false, 'valvFundo'),
('valv-fundo-flutuante', 'Fundo Flutuante', 1.00, false, 'valvFundo'),
('valv-fundo-afastador', 'Afastador de Válvula', 0.50, false, 'valvFundo'),

-- VÁLVULA PADRÃO TOPO
('valv-topo-op-padrao', 'Válvula Padrão Topo (Operação)', 0.00, true, 'valvTopo'),
('valv-topo-sem', 'Sem válvula', 0.00, false, 'valvTopo'),
('valv-topo-com', 'Com válvula', 0.80, false, 'valvTopo'),

-- COLOCAÇÃO DE LINER
('liner-op-padrao', 'Colocação de Liner (Operação)', 0.00, true, 'colocacaoLiner'),
('liner-sem', 'Sem liner', 0.00, false, 'colocacaoLiner'),
('liner-com', 'Com liner', 1.00, false, 'colocacaoLiner'),
('liner-garrafa', 'Liner garrafa', 1.50, false, 'colocacaoLiner'),
('liner-costurado', 'Liner costurado', 2.00, false, 'colocacaoLiner'),
('liner-colado', 'Liner colado', 1.50, false, 'colocacaoLiner'),

-- ENFARDAMENTO
('enfardamento-op-padrao', 'Enfardamento (Operação Padrão)', 0.50, true, 'enfardamento'),
('enfardamento-sem', 'Sem enfardamento', 0.00, false, 'enfardamento'),
('enfardamento-padrao', 'Enfardamento Padrão', 0.50, false, 'enfardamento'),

-- DEMAIS OPERAÇÕES
('outras-op-padrao', 'Demais Operações (Operação)', 0.00, true, 'outras'),
('outras-porta-etiqueta', 'Porta Etiqueta', 0.25, false, 'outras'),
('outras-etiqueta-impressa', 'Etiqueta Impressa', 0.25, false, 'outras'),
('outras-cordinha', 'Cordinha', 0.25, false, 'outras'),
('outras-velcro', 'Velcro', 0.50, false, 'outras'),
('outras-zíper', 'Zíper', 1.00, false, 'outras'),

-- PREPARAÇÃO
('preparacao-corte-corpo', 'Corte de Corpo', 0.50, false, 'preparacao'),
('preparacao-corte-alcas', 'Corte de Alças', 0.30, false, 'preparacao'),
('preparacao-corte-fundo', 'Corte de Fundo', 0.20, false, 'preparacao'),
('preparacao-inspecao-qualidade', 'Inspeção de Qualidade', 0.40, false, 'preparacao'),
('preparacao-etiquetagem-rastreio', 'Etiquetagem & Rastreio', 0.20, false, 'preparacao')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    time = EXCLUDED.time,
    is_default = EXCLUDED.is_default,
    category = EXCLUDED.category;

-- C. Configuração Padrão de Células
INSERT INTO cell_config (id, people_one, people_travado, people_sala_limpa, people_multi, people_fertilizante, people_fertilizante_liner, shift_hours)
VALUES ('default_cell_config', 8.5, 11.0, 8.5, 8.5, 8.5, 8.5, 8.5)
ON CONFLICT (id) DO NOTHING;

-- D. Configuração Financeira Inicial Limpa (Mês Atual Aberto e Zerado)
INSERT INTO financial_config (id, active_month_key, monthly_volume, default_hourly_rate, sector_hourly_rates, error_margin_percent, monthly_history)
VALUES (
    'default_financial_config',
    '2026-08',
    20000,
    28.50,
    '{}'::jsonb,
    5.0,
    jsonb_build_object(
        '2026-08', jsonb_build_object(
            'monthKey', '2026-08',
            'monthLabel', 'Agosto/2026',
            'volume', 20000,
            'defaultHourlyRate', 28.50,
            'grossSavings', 0,
            'totalSavings', 0,
            'totalLosses', 0,
            'netSavings', 0,
            'hoursSaved', 0,
            'hoursLost', 0,
            'netHours', 0,
            'isClosed', false
        )
    )
)
ON CONFLICT (id) DO NOTHING;
