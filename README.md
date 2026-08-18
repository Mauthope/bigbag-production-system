# 🏭 BigBag Pro - Sistema de Tempos de Produção & Eficiência

Sistema moderno construído em **Next.js (App Router)**, **TypeScript** e **Tailwind CSS** para cálculo dinâmico de tempos de costura de Big Bags industriais, gestão de Ordens de Produção (OP) e Dashboard Analítico de Eficiência por componente e por OP.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Storage](https://img.shields.io/badge/Database-LocalStorage%20%2B%20Supabase%20Ready-emerald?style=for-the-badge&logo=supabase)

---

## 🚀 Funcionalidades Principais

### 1. 🎛️ Calculadora Kanban Dinâmica (`/`)
- **11 Categorias de Componentes** completas:
  - *Alça, Fundo, Topo, Travas, Fechamento, Válvula Fundo, Válvula Topo, Personalização da Saia, Personalização da Válvula, Demais Operações, Preparação*.
- **Controles Rápidos**: Operação Padrão, Marcar Todos, Limpar Todos.
- **Painel Flutuante**: Cálculo em tempo real do tempo total em minutos (`min`) e formato legível (`min` e `s`).
- **Ações Rápidas**: Copiar resumo técnico formatado e criar OP diretamente a partir da configuração montada.

### 2. ⏱️ Painel de Atualização de Tempos & Parâmetros (`/settings`)
- Inputs editáveis para alterar o tempo padrão de qualquer uma das operações de costura.
- Possibilidade de adicionar novas operações customizadas por componente.
- Botão de restauração para valores de fábrica originais.
- Filtros por componente e busca rápida por nome de operação.

### 3. 📋 Módulo de Ordens de Produção - OP (`/orders`)
- Cadastro de OPs com número, cliente, especificação do bag, quantidade planejada e turno/operador.
- **Apontamento de Produção**:
  - Registro de tempo real total executado ou discriminado por componente.
  - Cálculo instantâneo da **Eficiência Operacional (%)** e **Desvio de Tempo**.
- Barra de progresso visual de unidades produzidas e status (`Planejada`, `Em Produção`, `Concluída`).

### 4. 📊 Dashboard Analítico & Mapeamento de Gargalos (`/dashboard`)
- **KPIs Principais**: Eficiência Global, Horas Previstas vs. Reais, Volume de Bags, Status das OPs.
- **Gráficos Interativos (Recharts)**:
  - *Eficiência por OP (%)* com linha de meta de 100% e cores dinâmicas.
  - *Comparativo Previsto vs. Realizado por OP* em minutos.
  - *Distribuição de Tempo por Componente* (Gráfico de Rosca/Pizza).
  - *Mapeamento de Gargalos por Componente* (identificando quais etapas de costura estão demandando mais tempo que o previsto).

### 5. 💾 Persistência em LocalStorage + Pronto para Supabase
- Executa imediatamente no navegador usando `LocalStorage` (persistente e sem necessidade de servidor).
- Suporte a **Exportação/Importação de Backups em JSON** e **Exportação de Relatórios de OPs em CSV/Excel**.
- **Arquitetura Desacoplada**: Script SQL pronto em `src/sql/schema.sql` para migração instantânea para o Supabase assim que adquirir a licença.

---

## 🛠️ Como Executar Localmente

1. **Instalar dependências**:
```bash
npm install
```

2. **Rodar em modo de desenvolvimento**:
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

3. **Build de Produção**:
```bash
npm run build
npm start
```

---

## ☁️ Ativação do Supabase (Quando Adquirir a Licença)

1. Crie um projeto no [Supabase](https://supabase.com).
2. No menu **SQL Editor**, execute o script presente no arquivo `src/sql/schema.sql`.
3. Crie o arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_STORAGE_TYPE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```
4. O sistema alternará automaticamente para o Supabase.

---

## 📄 Licença
Distribuído sob a licença MIT.
