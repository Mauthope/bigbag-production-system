-- ==============================================================================
-- SISTEMA DE GESTÃO DE PRODUÇÃO DE BIG BAGS - SCHEMA SUPABASE / POSTGRESQL
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase quando ativar a licença.

-- 1. Tabela de Operações e Tempos Padrão
CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    time NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT false,
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Ordens de Produção (OP)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Índices para Alto Desempenho e Consultas no Dashboard
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_client ON production_orders(client);
CREATE INDEX IF NOT EXISTS idx_production_orders_created_at ON production_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operations_category ON operations(category);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público/autenticado (Ajuste conforme necessidade)
CREATE POLICY "Permitir leitura para todos" ON operations FOR SELECT USING (true);
CREATE POLICY "Permitir modificação para todos" ON operations FOR ALL USING (true);

CREATE POLICY "Permitir leitura para todos" ON production_orders FOR SELECT USING (true);
CREATE POLICY "Permitir modificação para todos" ON production_orders FOR ALL USING (true);
