# 🎨 MonFinTrack / JobHunter - Diretrizes Oficiais de Design, UI & UX
## Conceito: Organic Elegance

Este documento define e padroniza as diretrizes visuais e de experiência do usuário (UX/UI) para o ecossistema **MonFinTrack** e **JobHunter**. Ele serve como a "Fonte Única de Verdade" para qualquer modificação, criação ou auditoria de interfaces no sistema, garantindo que o design permaneça premium, coeso, moderno e memorável.

---

## 1. Princípios Fundamentais do Design System

O design do ecossistema é governado pela filosofia **"Organic Elegance"** (Elegância Orgânica). O objetivo é romper com o estereótipo de "planilhas de finanças cinzas" ou painéis corporativos frios, introduzindo uma interface viva, imersiva, texturizada e que evoca tranquilidade, confiança e sofisticação de um banco de investimentos privado de alto padrão.

### Regras de Ouro
1. **Evite o Clichê Moderno:** Não use layouts 50/50 ("Standard Hero Split") previsíveis, nem Bento Grids sem necessidade real de organização de dados complexos. Busque assimetria intencional e hierarquia clara.
2. **Textura e Camadas (Depth):** Interfaces estáticas e perfeitamente flat são consideradas falhas. Use gradientes sutis, efeitos de vidro ("Glassmorphism"), sombras com múltiplas camadas e texturas de ruído ("grain") para criar profundidade física.
3. **Geometria com Escolhas Claras:** Evite o "meio-termo sem graça" (bordas de 4px a 8px). Vá aos extremos: cantos extremamente arredondados (24px a 32px) para componentes orgânicos e amigáveis, ou cantos vivos (0px a 2px) para tabelas de alta densidade técnica.
4. **Purple Ban (Proibição do Roxo):** É terminantemente proibido o uso de roxo, violeta, índigo ou magenta como cores principais ou de destaque do sistema, a menos que solicitado de forma explícita pelo usuário. O roxo é o maior clichê de interfaces geradas por IA.

---

## 2. Paleta de Cores e Temas do Sistema

O sistema opera com um sistema dinâmico de quatro paletas cromáticas distintas, adaptando-se emocionalmente às preferências e necessidades de acessibilidade do usuário.

```
60% → Cor de Fundo / Principal (Base limpa e relaxante)
30% → Cor de Superfície / Secundária (Delineamento de cartões e blocos)
10% → Cor de Destaque / Accent (CTAs, alertas e focos de ação)
```

### A. Tema Padrão / Claro (O "Azul Fintech" Confiável)
*Focado em evocar credibilidade, solidez, estabilidade e segurança bancária clássica.*

*   **Fundo (`--bg-main`):** `#faf9f6` (Bege Pergaminho acolhedor)
*   **Superfície (`--bg-surface`):** `#ffffff` (Branco puro)
*   **Bordas (`--bg-border`):** `#e2e8f0` (Cinza neutro claro)
*   **Texto Principal (`--text-primary`):** `#1e293b` (Grafite escuro)
*   **Texto Secundário (`--text-secondary`):** `#475569`
*   **Ação Principal (`--primary-color`):** `#2563eb` (Azul brilhante profissional)

### B. Tema Escuro (Tech, Imersão & IA)
*Focado no público tecnológico, ideal para uso noturno. Evoca inovação e sofisticação digital.*

*   **Fundo (`--bg-main`):** `#0a0f1e` (Azul noite profundo)
*   **Superfície (`--bg-surface`):** `#111827` (Azul escuro acetinado)
*   **Bordas (`--bg-border`):** `#1f2937` (Azul acinzentado sutil)
*   **Texto Principal (`--text-primary`):** `#e2e8f0` (Branco gelo)
*   **Destaque Primário (`--primary-color`):** `#60a5fa` (Azul claro elétrico)
*   **Ação Ativa / Accent (`--accent-color`):** `#f97316` (Laranja Cyber energizante)

### C. Tema Capycro (Orgânico & Wellness Financeiro)
*Ideal para acalmar a ansiedade de gestão de vagas e currículos. Transmite paz mental, equilíbrio e estabilidade orgânica.*

*   **Fundo (`--bg-main`):** `#faf9f6` (Bege Pergaminho acolhedor)
*   **Superfície (`--bg-surface`):** `#fdfdfd` (Bege suave quase branco)
*   **Bordas (`--bg-border`):** `#f0ead2` (Almond claro sutil)
*   **Texto Principal (`--text-primary`):** `#3e3a35` (Grafite mineral aquecido)
*   **Texto Secundário (`--text-secondary`):** `#7a6b5d` (Marrom acinzentado)
*   **Ação Principal (`--primary-color`):** `#5d8a8c` (Azul-Petróleo relaxante)
*   **CTAs / Accent (`--accent-color`):** `#d8704c` (Laranja Queimado Dourado)
*   **Sucesso / Alertas Positivos (`--success-color`):** `#5a9261` (Verde Sálvia natural)

### D. Tema de Alto Contraste (Acessibilidade WCAG AAA)
*Garante conformidade máxima com diretrizes de legibilidade para usuários com baixa visão.*

*   **Fundo (`--bg-main`):** `#000000` (Preto puro)
*   **Superfície (`--bg-surface`):** `#111111` (Cinza ultra escuro)
*   **Bordas (`--bg-border`):** `#ffffff` (Contorno branco puro obrigatório de 2px)
*   **Texto Principal / Primário (`--primary-color`):** `#ffff00` (Amarelo puro de alta visibilidade)
*   **Destaques Adicionais (`--accent-color`):** `#00ffff` (Ciano puro)

---

## 3. Tipografia e Proporção Visual (Unificação de Fonte)

O design adota uma estratégia tipográfica geométrica de alta legibilidade, unificando todo o sistema sob uma única família de fontes moderna e sofisticada.

```
Fonte Padrão Global do Sistema: "Outfit"
```

### Por que a Fonte Outfit?
A fonte **Outfit** (do Google Fonts) combina uma estrutura geométrica moderna com cantos suaves, sendo ideal tanto para cabeçalhos marcantes quanto para dados técnicos finos, garantindo estética ultra-premium (estilo SaaS internacional) em todos os temas.

*   **Títulos e Destaques Visuais (H1, H2, H3):** Família `"Outfit"`. Pesos: `Bold (700)` ou `ExtraBold (800)`. Garante modernidade de startups de alto design.
*   **Textos de Interface e Dados Técnicos (Tabelas, Inputs, Body):** Família `"Outfit"`. Pesos: `Light (300)`, `Regular (400)` ou `Medium (500)`. Excelente leitura de números e porcentagens.

### Tamanhos e Hierarquia (8-Point Typography)
*   **H1 (Título de Página / Cabeçalho):** `text-3xl md:text-4xl` (30px a 36px) | `line-height: 1.2` | `letter-spacing: -0.02em` | Bold.
*   **H2 (Cabeçalho de Seção):** `text-xl md:text-2xl` (20px a 24px) | `line-height: 1.3` | Semibold/Bold.
*   **H3 (Título de Cartão / Widget):** `text-base md:text-lg` | Medium/Semibold.
*   **Corpo de Texto (Body):** `text-sm md:text-base` (14px a 16px) | `line-height: 1.6` | Regular.

---

## 4. Grelha de Espaçamento e Margens (8-Point Grid)

Toda a distribuição espacial do sistema (paddings, margins, gaps) é baseada no sistema multiplicador de **8 pixels**. Isso garante ritmo e harmonia consistentes.

```
4px (Micro-ajustes de ícones/badges)
8px (Espaço apertado, ex: label para input)
16px (Espaço padrão de fluxo, gaps e botões)
24px / 32px (Paddings internos de cartões e containers grandes)
48px / 64px (Margens de blocos e cabeçalhos de páginas)
```

### Aplicação Prática (Padrões Tailwind)
*   **Padding Interno de Cartões (`.organic-card`):** `p-8` (32px) no desktop, reduzindo para `p-4` (16px) no mobile.
*   **Distanciamento de Cabeçalho (`.page-header`):** `mb-6 md:mb-8` (24px a 32px) de distância do grid de conteúdo.
*   **Gaps de Formulários:** `gap-4` (16px) para separar pares de label/input.
*   **Touch Targets (Acessibilidade):** Botões e elementos interativos possuem área de clique mínima de **44px × 44px** (Tailwind `h-11` ou superior) para evitar erros de toque em dispositivos móveis.

---

## 5. Geometria, Arredondamento e Contornos

A assinatura física do design baseia-se em curvas orgânicas exuberantes para cartões e contornos de alta densidade técnica para tabelas de dados.

### Diretrizes de Bordas (Border Radius)
*   **Cantos Orgânicos de Destaque (`--border-radius-organic` / `.organic-card`):** `1.5rem` (24px). Aplicado a cartões de recursos principais, painéis suspensos e modais.
*   **Cantos de Destaque Máximo:** `2rem` (32px). Utilizado para banners e contêineres globais de topo.
*   **Cantos de Controle Interativo (Buttons, Inputs, Selects):** `pill` (`rounded-full` ou `9999px`) para botões de pílula ergonômicos e `0.75rem` (12px) para inputs, garantindo precisão matemática e conforto tátil.
*   **Cantos de Alta Densidade (Tabelas Desktop):** `rounded-sm` (2px a 4px). Usado nas tabelas de listagem para preservar o minimalismo técnico do layout.

---

## 6. Efeitos Visuais, Profundidade e Atmosfera (Glassmorphism v2)

O sistema incorpora efeitos de iluminação e profundidade translúcida para criar uma atmosfera imersiva e evitar a rigidez das interfaces comuns:

### A. Glassmorphism v2 de Alta Fidelidade (Efeito Vidro)
Aplicado em painéis de destaque para sobrepor o conteúdo mantendo a fluidez e a integração com o fundo.
*   **Calibração Translúcida:** Fundo translúcido com opacidade reduzida (`rgba(..., 0.45)` ou `--glass-bg`) e desfoque amplo de **`32px`** e saturação elevada em **`2.1`** para sidebar, topbar, bottom nav e cartões.
*   **Frosted Glass de Alta Densidade (Dropdowns):** Para menus flutuantes (`.select-dropdown`) onde o texto do fundo não pode vazar, utilizamos opacidade de **90%** com desfoque de `20px`:
    ```css
    background: color-mix(in srgb, var(--bg-surface) 90%, transparent);
    backdrop-filter: blur(20px) saturate(1.4);
    border: 1px solid var(--glass-border);
    ```
*   **Isolamento de Alto Contraste:** O desfoque e as transparências são desativados com `backdrop-filter: none !important` exclusivamente no tema `.high-contrast` para garantir conformidade máxima de contraste WCAG AAA.

### B. Ambient Blobs (Luminosidade Indireta)
Pontos de iluminação orgânica difusa inseridos ao fundo da interface para quebrar a solidez do background:
*   **Blob Teal (`.blob-teal`):** `rgba(93, 138, 140, 0.15)`
*   **Blob Orange (`.blob-orange`):** `rgba(216, 112, 76, 0.15)`
*   **Blob Gold (`.blob-gold`):** `rgba(240, 160, 64, 0.10)`
*   **Regra:** Desfoque radial mínimo de **80px** a **120px** e propriedade `pointer-events: none` ativa para não interceptar interações do usuário.

---

## 7. Componentes de Interface Padronizados

### A. Botões Primários Sólidos Elásticos
Abandonamos o gradiente fixo de cores em botões para evitar fadiga visual e conflito nos temas Capycro e Alto Contraste.
*   **Formato:** Estilo Pílula (`rounded-full` / `9999px`).
*   **Fundo:** Cor sólida dinâmica `--primary-color`.
*   **Interações Físicas:** Transição elástica de mola (`var(--transition-spring)`). No hover, o botão sofre deslocamento e escala (`translateY(-2px) scale(1.02)`) com sombra colorida e brilho sutil (`filter: brightness(1.1)`).

### B. Badges e Chips Dinâmicos Translúcidos (Outline-filled)
Não use blocos de cor sólida forte com textos brancos em badges, pois reduzem drasticamente o contraste no tema claro.
*   **Fórmula Premium:** Fundo translúcido com opacidade de 10% a 15% (`bg-primary/15`, `bg-success/15`) + cor de texto semântica sólida correspondente (`text-primary`, `text-success`) + borda fina semitransparente de contorno (`border-primary/20`):
    *   **Nova (Destaque Principal):** `bg-primary/15 text-primary border-primary/20`
    *   **Visualizada (Destaque Secundário):** `bg-accent/15 text-accent border-accent/20`
    *   **Enviado / Ativo (Sucesso):** `bg-success/15 text-success border-success/20`
    *   **Pendente / Pausado (Alerta):** `bg-warning/15 text-warning border-warning/20`
    *   **Falhou (Erro):** `bg-error/15 text-error border-error/20`
    *   **Arquivado (Neutro):** `bg-dark-border/40 text-text-muted border-dark-border/50`
*   **Vantagem:** Total legibilidade e contraste perfeito em todos os 4 temas (incluindo hovers de cartões), adaptando-se automaticamente aos tons correspondentes.

### C. Acessibilidade Automática de Texto (Remapeamento)
Evite o uso de classes de opacidade de texto do Tailwind como `text-white/80` em áreas de texto cruciais (como descrição de vagas e notas).
*   **Override do styles.css:** O sistema remapeia automaticamente as classes de opacidade branca (`text-white/90`, `text-white/80`, `text-white/70`) para a cor de texto primário dinâmica do tema ativo (`var(--text-primary)`) nos temas claros, mantendo contraste excelente e impedindo textos "invisíveis" de mesma cor do fundo.

---

## 8. Animações, Estados Ativos e Micro-interações

### Transições Físicas e Easing
Toda animação de estados (`hover`, `focus`, `active`) utiliza curvas de aceleração naturais (Spring Physics/Bézicas) em vez de transições lineares duras.

*   **Transição Suave (`--transition-smooth`):** `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (Ideal para trocas de cor e opacidades).
*   **Transição Elástica/Spring (`--transition-spring`):** `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)` (Ideal para movimentos físicos, escala e deslocamento de cartões/botões).

### Micro-interações de Hover de Cartões
Ao passar o mouse sobre um cartão orgânico interativo, ele deve responder com elevação e profundidade aumentadas:
```css
.organic-card:hover {
  transform: translateY(-4px) scale(1.01);
  background: rgba(var(--surface-card-rgb), 0.6) !important;
  box-shadow:
    0 16px 48px rgba(45, 90, 94, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 1) !important;
}
```

### Animações de Entrada (Scroll Reveals)
*   As seções e títulos principais do sistema devem surgir na tela utilizando animações de subida e desvanecimento cruzados (`animate-fade-in-up`).
*   **Staggered Loading:** Itens em lista, cartões de esqueleto (*skeleton loaders*) ou grades devem aparecer de forma sequencial (atrasos de 50ms entre cada item usando classes dinâmicas `stagger-1` até `stagger-6`) para criar uma sensação de carregamento orquestrado e performático.
