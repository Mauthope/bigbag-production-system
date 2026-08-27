---
name: industrial-ui-design-system
description: >-
  Aplica o Design System Dark Cyber-Industrial de Alta Precisão (baseado no BagTime) para
  dashboards, calculadoras industriais, painéis Kaizen e sistemas de engenharia. Use esta skill
  sempre que o usuário solicitar criação, redesign ou estilização de interfaces modernas,
  com visual escuro, glassmorphism sutil, cards de KPI de engenharia, tipografia mono para dados,
  gráficos Recharts estilo ticker financeiro e semântica de cores industriais.
---

# 🏭 Industrial Precision UI/UX Design System (BagTime Reference)

Este guia e especificação técnica consolida a identidade visual, padrões de componentes, tipografia, paleta de cores e micro-interações desenvolvidas no **BagTime (Sistema Industrial de Tempos, Cronoanálise & ROI)**.

Utilize esta referência para reproduzir e adaptar este design em qualquer projeto React, Next.js, Vite ou Vue.

---

## 🎨 1. Filosofia Visual & Atmosfera

O estilo visual é definido como **Dark Cyber-Industrial / Precision Engineering**:
- **Ambiente Imersivo e Escuro**: Fundo ultraescuro (`#060a13`) com iluminação radial suave (mesh glow), evitando saturação excessiva e fadiga visual em ambientes de fábrica e escritório.
- **Glassmorphism Técnico**: Painéis translúcidos (`bg-slate-900/90` com `backdrop-blur-md`), micro-bordas nítidas de 1px (`border-slate-800`, `border-cyan-500/25`) e profundidade em camadas.
- **Dados como Protagonistas**: Números de medições, finanças e tempos sempre em fonte monoespacada com alto contraste e unidades explícitas (`/mês`, `min/bag`, `h`).
- **Semântica Industrial Rigorosa**: Verde para economias reais conquistadas, Ciano para mão-de-obra e capacidade, Vermelho/Rosa para alertas de melhoria Kaizen (sem debitar ganhos), Âmbar para ciclos e margens.

---

## 🌈 2. Paleta de Cores & Design Tokens

### Backgrounds & Superfícies
```css
/* Background Principal da Aplicação */
--bg-app: #060a13;

/* Containers & Modais */
--bg-surface-card: rgba(15, 23, 42, 0.90);     /* slate-900/90 */
--bg-surface-elevated: rgba(2, 6, 23, 0.95);    /* slate-950/95 */
--bg-surface-input: #020617;                   /* slate-950 */

/* Bordas Sutis */
--border-subtle: #1e293b;                       /* slate-800 */
--border-subtle-translucent: rgba(30, 41, 59, 0.6);
```

### Iluminação Ambiente (Mesh Gradient para `body` ou `main`)
```css
body {
  background-color: #060a13;
  background-image: 
    radial-gradient(at 5% 5%, rgba(6, 182, 212, 0.08) 0px, transparent 40%),
    radial-gradient(at 95% 95%, rgba(139, 92, 246, 0.08) 0px, transparent 40%),
    radial-gradient(at 50% 50%, rgba(16, 185, 129, 0.03) 0px, transparent 60%);
  background-attachment: fixed;
}
```

### Semântica Industrial
| Cor | Hex | Classe Tailwind | Significado Industrial |
| :--- | :--- | :--- | :--- |
| **Ciano Elétrico** | `#06b6d4` | `cyan-400` / `cyan-300` | Mão-de-obra, horas-homem, operadores, destaques de navegação e consolidações |
| **Esmeralda Kaizen** | `#10b981` | `emerald-400` / `emerald-500` | Ganhos reais de tempo, economias monetárias (ROI), status ativo, processos otimizados |
| **Carmim / Rosa Alerta** | `#f43f5e` | `rose-400` / `rose-500` | Aumentos de tempo, desvios operacionais, oportunidades de melhoria Kaizen |
| **Âmbar Técnico** | `#f59e0b` | `amber-400` / `amber-300` | Tempos de ciclo, margem de erro técnica (-5%), alertas preventivos |
| **Violeta Neon** | `#8b5cf6` | `purple-400` / `indigo-400` | Diagnósticos globais, índice de produtividade Kaizen, categorias estruturais |
| **Ardósia Neutra** | `#94a3b8` | `slate-400` / `slate-300` | Rótulos, descrições secundárias, divisores e medições estáveis |

---

## 🔤 3. Tipografia & Hierarquia de Informação

### Fontes Recomendadas
- **Display / Títulos / Interface**: `Outfit` ou `Inter` (sans-serif moderno, geométrico e legível).
- **Métricas / Códigos / Valores**: `ui-monospace`, `JetBrains Mono` ou `font-mono` nativo do Tailwind.

### Hierarquia de Rótulos
- **Rótulo Superior de KPI (Micro-header)**:
  `text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400`
- **Hero Value (Número Principal)**:
  `text-2xl sm:text-3xl font-black font-mono tracking-tight text-white` (ou colorido com `text-emerald-400`, `text-cyan-400`, etc.)
- **Unidade Integrada**:
  `text-xs font-bold text-slate-400`
- **Linha de Auditoria / Sub-métrica**:
  `text-[11px] font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-800/60`

---

## 🧩 4. Catálogo de Componentes Essenciais

### A. Navbar com Brand Gradiente & Badge de Status
```tsx
<header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-lg shadow-black/20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    
    {/* Brand Logo com Gradiente e Efeito Glow */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
          <Timer className="w-5 h-5 text-cyan-400" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold tracking-tight text-xl text-white">
          Sistema<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Pro</span>
        </span>
        <span className="text-[10px] text-slate-400 leading-none">Engenharia & Performance</span>
      </div>
    </div>

    {/* Badge de Status / Crédito */}
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-slate-400">Ambiente:</span>
      <strong className="text-cyan-300 font-semibold">Produção Ativa</strong>
    </div>

  </div>
</header>
```

---

### B. Cards de KPI Industriais (Grid 4 Colunas)
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
  
  {/* Card KPI: Ganhos / ROI */}
  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
    <div className="flex items-center justify-between gap-2">
      <div>
        <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
          Ganhos Financeiros
        </span>
        <span className="text-[10px] text-amber-400 font-semibold">
          (Ajustado c/ -5% margem técnica)
        </span>
      </div>
      <div className="p-2 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
        <ArrowUpRight className="w-5 h-5" />
      </div>
    </div>

    <div className="mt-3">
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-bold text-slate-400">R$</span>
        <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
          12.450,00
        </span>
        <span className="text-xs font-bold text-slate-400">/mês</span>
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-800/60">
        <span>Bruto: R$ 13.105,26</span>
        <span className="text-amber-400 font-semibold">-5%: -R$ 655,26</span>
      </div>
    </div>

    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
      <span className="text-slate-400">Projeção Anual:</span>
      <span className="font-mono font-bold text-emerald-400">R$ 149.400,00 / ano</span>
    </div>
  </div>

  {/* Card KPI: Horas / Mão-de-obra */}
  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
    <div className="flex items-center justify-between gap-2">
      <div>
        <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
          Horas de Trabalho Poupadas
        </span>
        <span className="text-[10px] text-cyan-400/80 font-medium">Líquido de fábrica</span>
      </div>
      <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
        <Clock className="w-5 h-5" />
      </div>
    </div>

    <div className="mt-3">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-cyan-400">
          436,8
        </span>
        <span className="text-xs font-bold text-cyan-300">horas / mês</span>
      </div>
      <span className="text-[10px] text-slate-400 font-mono block mt-1">
        Capacidade liberada para novos volumes
      </span>
    </div>

    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
      <span className="text-slate-400">Equivalente:</span>
      <span className="text-cyan-300 font-mono font-bold">~2,5 operadores</span>
    </div>
  </div>

  {/* Card KPI: Alerta Kaizen (Oportunidades de Redução de Desvios) */}
  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
    <div className="flex items-center justify-between gap-2">
      <div>
        <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
          Oportunidades Kaizen
        </span>
        <span className="text-[10px] text-slate-400 font-semibold">Aumentos Identificados</span>
      </div>
      <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
        <AlertTriangle className="w-5 h-5" />
      </div>
    </div>

    <div className="mt-3">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-400">
          2
        </span>
        <span className="text-xs font-bold text-rose-300">operações c/ aumento</span>
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-800/60">
        <span>Desvio: +24,5 h</span>
        <span className="text-rose-400 font-semibold">~ R$ 698,25</span>
      </div>
    </div>

    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
      <span className="text-slate-400">Status Kaizen:</span>
      <span className="text-[10px] text-slate-400 italic">Não deduzido dos ganhos</span>
    </div>
  </div>

</div>
```

---

### C. Alternador Segmentado (Segmented Control / View Switcher)
```tsx
<div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 shadow-inner">
  <button
    type="button"
    onClick={() => setMode('summary')}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      mode === 'summary'
        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-950/40'
        : 'text-slate-400 hover:text-slate-200'
    }`}
  >
    Histórico Mês a Mês
  </button>
  <button
    type="button"
    onClick={() => setMode('breakdown')}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      mode === 'breakdown'
        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-950/40'
        : 'text-slate-400 hover:text-slate-200'
    }`}
  >
    Detalhamento Operacional
  </button>
</div>
```

---

### D. Inputs Numéricos Industriais de Alta Precisão
```tsx
<div className="flex items-center gap-2.5 bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
  <Boxes className="w-4 h-4 text-cyan-400 shrink-0" />
  <div>
    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
      Volume Mensal Produzido
    </span>
    <div className="flex items-center gap-1.5 mt-0.5">
      <input
        type="number"
        value={volume}
        onChange={e => setVolume(Number(e.target.value))}
        className="w-28 bg-transparent text-sm font-black font-mono text-cyan-300 focus:outline-none"
      />
      <span className="text-xs font-bold text-slate-500 font-mono">un/mês</span>
    </div>
  </div>
</div>
```

---

### E. Tabela Industrial de Alta Densidade
```tsx
<div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
  <div className="overflow-x-auto custom-scrollbar">
    <table className="w-full text-left border-collapse text-xs">
      <thead>
        <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <th className="p-3.5">Operação / Posto de Trabalho</th>
          <th className="p-3.5 text-center">Referência (Baseline)</th>
          <th className="p-3.5 text-center">Medição Atual</th>
          <th className="p-3.5 text-center">Variação (Δ)</th>
          <th className="p-3.5 text-right">Impacto Financeiro</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/60 font-mono">
        
        {/* Linha com Ganho de Tempo */}
        <tr className="hover:bg-slate-800/40 transition-colors">
          <td className="p-3.5 font-sans font-medium text-slate-200">
            Costura de Alça Reforçada
          </td>
          <td className="p-3.5 text-center text-slate-400">1,50 min</td>
          <td className="p-3.5 text-center font-bold text-white">1,00 min</td>
          <td className="p-3.5 text-center">
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold text-[11px]">
              -30s (-33,3%)
            </span>
          </td>
          <td className="p-3.5 text-right font-black text-emerald-400">
            + R$ 2.375,00
          </td>
        </tr>

        {/* Linha com Alerta Kaizen (Aumento) */}
        <tr className="hover:bg-slate-800/40 transition-colors">
          <td className="p-3.5 font-sans font-medium text-slate-200">
            Fixação de Válvula Fundo
          </td>
          <td className="p-3.5 text-center text-slate-400">0,80 min</td>
          <td className="p-3.5 text-center font-bold text-white">0,95 min</td>
          <td className="p-3.5 text-center">
            <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold text-[11px]">
              +9s (+18,8%)
            </span>
          </td>
          <td className="p-3.5 text-right font-bold text-rose-400">
            ~ R$ 712,50
            <span className="text-[9px] text-slate-400 block font-normal">Alerta Kaizen</span>
          </td>
        </tr>

      </tbody>
    </table>
  </div>
</div>
```

---

### F. Gráficos Recharts: Curva Contínua de Área (Ticker Style)
```tsx
<ResponsiveContainer width="100%" height={320}>
  <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
    <defs>
      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
    <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} tickLine={false} />
    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
    <Tooltip
      contentStyle={{
        backgroundColor: '#020617',
        borderColor: '#334155',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        fontSize: '12px'
      }}
    />
    <Area
      type="monotone"
      dataKey="value"
      stroke="#10b981"
      strokeWidth={3}
      fillOpacity={1}
      fill="url(#areaGradient)"
    />
  </AreaChart>
</ResponsiveContainer>
```

---

### G. Gráficos Recharts: Barras com Cantos Arredondados
```tsx
<ResponsiveContainer width="100%" height={320}>
  <BarChart data={barData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px' }} />
    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
    <Bar dataKey="Ganhos" fill="#10b981" radius={[4, 4, 0, 0]} name="Diminuições (Ganhos)" />
    <Bar dataKey="Aumentos" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Aumentos (Alerta Kaizen)" />
    <Bar dataKey="Totalizador" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Ganhos Consolidados" />
  </BarChart>
</ResponsiveContainer>
```

---

### H. Modal Glassmorphism com Backdrop Blur
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
  <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
    
    {/* Cabeçalho */}
    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-base text-white">Iniciar Novo Mês</h3>
          <p className="text-xs text-slate-400">Configuração de volume e ciclo de fábrica</p>
        </div>
      </div>
      <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Corpo */}
    <div className="p-6 space-y-4">
      {/* Banner Informativo */}
      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
        <span className="text-base leading-none">🌱</span>
        <p className="text-[11px] leading-relaxed text-slate-300">
          <strong className="text-emerald-300">Balanço 100% Zerado:</strong> A última medição registrada de cada operação se tornará a nova referência inicial.
        </p>
      </div>
    </div>

    {/* Rodapé de Ações */}
    <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
      >
        Cancelar
      </button>
      <button
        onClick={handleConfirm}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-bold hover:brightness-110 shadow-lg shadow-cyan-950/30 cursor-pointer"
      >
        <Check className="w-4 h-4" />
        <span>Confirmar & Salvar</span>
      </button>
    </div>

  </div>
</div>
```

---

## 🛠️ 5. Como Utilizar Esta Skill em Outros Projetos

### Método 1: No Antigravity (Automático via Workspace)
Para que qualquer agente reconheça este padrão visual automaticamente em um novo projeto:
1. Crie a pasta `.agents/skills/industrial-ui-design-system/` no seu novo repositório;
2. Salve este arquivo com o nome `SKILL.md`;
3. No chat do Antigravity, basta pedir: *"Crie o dashboard da nossa aplicação seguindo a skill industrial-ui-design-system"*.

### Método 2: Global no seu Ambiente Antigravity
1. Copie este arquivo para `~/.gemini/antigravity/skills/industrial-ui-design-system/SKILL.md`;
2. Ele ficará disponível para todos os seus projetos locais de forma permanente.

### Dependências Recomendadas (`package.json`)
```json
{
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^1.16.0",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.5.0"
  }
}
```
