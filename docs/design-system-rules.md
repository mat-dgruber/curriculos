# 🎨 MonFinTrack - Diretrizes Oficiais de Design, UI & UX
## Conceito: Organic Elegance

Este documento define e padroniza as diretrizes visuais e de experiência do usuário (UX/UI) para o ecossistema **MonFinTrack**. Ele serve como a "Fonte Única de Verdade" para qualquer modificação, criação ou auditoria de interfaces no sistema, garantindo que o design permaneça premium, coeso, moderno e memorável.

---

## 1. Princípios Fundamentais do Design System

O design do MonFinTrack é governado pela filosofia **"Organic Elegance"** (Elegância Orgânica). O objetivo é romper com o estereótipo de "planilhas de finanças cinzas" ou painéis corporativos frios, introduzindo uma interface viva, imersiva, texturizada e que evoca tranquilidade, confiança e sofisticação de um banco de investimentos privado de alto padrão.

### Regras de Ouro
1. **Evite o Clichê Moderno:** Não use layouts 50/50 ("Standard Hero Split") previsíveis, nem Bento Grids sem necessidade real de organização de dados complexos. Busque assimetria intencional e hierarquia clara.
2. **Textura e Camadas (Depth):** Interfaces estáticas e perfeitamente flat são consideradas falhas. Use gradientes sutis, efeitos de vidro ("Glassmorphism"), sombras com múltiplas camadas e texturas de ruído ("grain") para criar profundidade física.
3. **Geometria com Escolhas Claras:** Evite o "meio-termo sem graça" (bordas de 4px a 8px). Vá aos extremos: cantos extremamente arredondados (24px a 32px) para componentes orgânicos e amigáveis, ou cantos vivos (0px a 2px) para tabelas de alta densidade técnica.
4. **Purple Ban (Proibição do Roxo):** É terminantemente proibido o uso de roxo, violeta, índigo ou magenta como cores principais ou de destaque do sistema, a menos que solicitado de forma explícita pelo usuário. O roxo é o maior clichê de interfaces geradas por IA.

---

## 2. Paleta de Cores e Temas do Sistema

O MonFinTrack opera com um sistema dinâmico de quatro paletas cromáticas distintas, adaptando-se emocionalmente às preferências e necessidades de acessibilidade do usuário.

```
60% → Cor de Fundo / Principal (Base limpa e relaxante)
30% → Cor de Superfície / Secundária (Delineamento de cartões e blocos)
10% → Cor de Destaque / Accent (CTAs, alertas e focos de ação)
```

### A. Tema Padrão (O "Azul Fintech" Confiável)
*Focado em evocar credibilidade, solidez, estabilidade e segurança bancária clássica.*

*   **Fundo (`--surface-ground`):** `#f8fafc` (Cinza claro suave e frio)
*   **Superfície (`--surface-card`):** `#ffffff` (Branco puro)
*   **Bordas (`--surface-border`):** `#e5e7eb` (Cinza neutro claro)
*   **Texto Principal (`--text-color`):** `#1f2937` (Grafite escuro para evitar a dureza do preto puro)
*   **Texto Secundário (`--text-color-secondary`):** `#6b7280`
*   **Ação Principal (`--primary-color`):** `#3b82f6` (Azul brilhante profissional)

### B. Tema Escuro (Tech, Imersão & IA)
*Focado no público tecnológico, ideal para uso noturno. Evoca inovação e sofisticação digital.*

*   **Fundo (`--surface-ground`):** `#0f172a` (Azul noite profundo)
*   **Superfície (`--surface-card`):** `#1e293b` (Azul escuro acetinado)
*   **Bordas (`--surface-border`):** `#334155` (Azul acinzentado sutil)
*   **Texto Principal (`--text-color`):** `#f8fafc` (Branco gelo)
*   **Destaque Primário (`--primary-color`):** `#60a5fa` (Azul claro elétrico)
*   **Ação Ativa / Accent (`--accent-color`):** `#f97316` (Laranja Cyber energizante)
*   **Secundária Ativa (`--nav-active-text`):** `#5eead4` (Teal translúcido luminoso)

### C. Tema Capycro (Orgânico & Wellness Financeiro)
*Ideal para acalmar a ansiedade de gestão de dívidas. Transmite paz mental, equilíbrio e estabilidade orgânica.*

*   **Fundo (`--surface-ground`):** `#faf9f6` (Bege Pergaminho acolhedor)
*   **Superfície (`--surface-card`):** `#fdfdfd` (Bege suave quase branco)
*   **Bordas (`--surface-border`):** `#f0ead2` (Almond claro sutil)
*   **Texto Principal (`--text-color`):** `#3e3a35` (Grafite mineral aquecido)
*   **Texto Secundário (`--text-color-secondary`):** `#7a6b5d` (Marrom acinzentado)
*   **Ação Principal (`--primary-color`):** `#5d8a8c` (Azul-Petróleo relaxante)
*   **CTAs / Accent (`--accent-color`):** `#d8704c` (Laranja Queimado Dourado)
*   **Sucesso / Alertas Positivos (`--success-color`):** `#5a9261` (Verde Sálvia natural)

### D. Tema de Alto Contraste (Acessibilidade WCAG AAA)
*Garante conformidade máxima com diretrizes de legibilidade para usuários com baixa visão.*

*   **Fundo (`--surface-ground`):** `#000000` (Preto puro)
*   **Superfície (`--surface-card`):** `#111111` (Cinza ultra escuro)
*   **Bordas (`--surface-border`):** `#ffffff` (Contorno branco puro obrigatório de 2px)
*   **Texto Principal / Primário (`--primary-color`):** `#ffff00` (Amarelo puro de alta visibilidade)
*   **Destaques Adicionais (`--accent-color`):** `#00ffff` (Ciano puro)

---

## 3. Tipografia e Proporção Visual

O MonFinTrack adota uma estratégia de emparelhamento tipográfico editorial que mescla elegância clássica com legibilidade técnica.

```
Escala Tipográfica (Dense UI): 1.125 a 1.20 (Relação compacta e altamente legível)
Escala Editorial / Landing Pages: 1.333 a 1.50 (Contraste dramático de títulos)
```

### Fontes Recomendadas
*   **Títulos e Destaques Visuais (H1, H2):** Família Serifada Clássica (`"Playfair Display"` ou `"Manrope"`). Traz peso, seriedade patrimonial e sofisticação de consultoria private.
*   **Textos de Interface e Dados Técnicos (Tabelas, Inputs, Body):** Família Sans-Serif Geométrica (`"Inter"` ou `"Plus Jakarta Sans"`). Garante neutralidade, precisão matemática e excelente leitura de números.

### Tamanhos e Hierarquia (8-Point Typography)
*   **H1 (Título Hero):** `3.5rem` (56px) | `line-height: 1.1` | `letter-spacing: -0.03em` | Bold
*   **H2 (Cabeçalho de Seção):** `2rem` (32px) | `line-height: 1.2` | `letter-spacing: -0.02em` | Medium/Semibold
*   **H3 (Título de Cartão):** `1.25rem` (20px) | `line-height: 1.4` | Medium
*   **Corpo de Texto (Body):** `1rem` (16px) | `line-height: 1.6` | Regular | Largura máxima ideal de 45 a 75 caracteres para evitar fadiga ocular.
*   **Textos Menores / Legendas:** `0.875rem` (14px) ou `0.75rem` (12px) | `line-height: 1.4`

---

## 4. Grelha de Espaçamento e Margens (8-Point Grid)

Toda a distribuição espacial do MonFinTrack (paddings, margins, gaps) é baseada no sistema multiplicador de **8 pixels**. Isso garante ritmo e harmonia consistentes.

```
4px (Micro-ajustes de ícones/badges)
8px (Espaço apertado, ex: label para input)
16px (Espaço padrão de fluxo, gaps e botões)
24px / 32px (Paddings internos de cartões e containers grandes)
48px / 64px (Margens de blocos e cabeçalhos de páginas)
```

### Aplicação Prática (Padrões Tailwind)
*   **Padding Interno de Cartões (`.organic-card`):** `p-8` (32px) no desktop, reduzindo para `p-4` (16px) no mobile.
*   **Distanciamento de Cabeçalho (`.page-header`):** `mb-8` (32px) a `mb-12` (48px) de distância do grid de conteúdo.
*   **Gaps de Formulários:** `gap-4` (16px) ou `gap-6` (24px) para separar pares de label/input.
*   **Touch Targets (Acessibilidade):** Botões e elementos interativos devem possuir área de clique mínima de **44px × 44px** (Tailwind `h-11` ou superior) para evitar erros de toque em dispositivos móveis.

---

## 5. Geometria, Arredondamento e Contornos

A assinatura física do MonFinTrack baseia-se em curvas orgânicas exuberantes e contornos extremamente delicados.

### Diretrizes de Bordas (Border Radius)
*   **Cantos Orgânicos de Destaque (`--border-radius-organic` / `.organic-card`):** `1.5rem` (24px). Aplicado a cartões de recursos principais, painéis suspensos e modais.
*   **Cantos de Destaque Máximo (`.technical-card` / `.organic-teal-card`):** `2rem` (32px). Utilizado para banners, contêineres globais e cards de topo.
*   **Cantos de Controle Interativo (Buttons, Inputs, Selects):** `pill` (`9999px`) ou `0.75rem` (12px). Evita que os controles internos herdem a curvatura excessiva dos painéis externos, mantendo a ergonomia visual.

### Espessura de Contornos (Borders)
*   **Espessura Padrão:** Sempre `1px` com cores semitransparentes baseadas na cor da superfície ou do texto (ex: `rgba(var(--surface-card-rgb), 0.8)`).
*   **Borda Interna Fina:** Em componentes de vidro ("Glassmorphism"), aplique uma borda sutil de `rgba(255, 255, 255, 0.08)` no topo e nas laterais para emular a refração real da luz sobre a borda do vidro.

---

## 6. Efeitos Visuais, Profundidade e Atmosfera

Para atingir a sensação premium tridimensional e evitar a monotonia visual, o sistema incorpora os seguintes efeitos de iluminação e profundidade:

```
                  [ CAMADA 3: INTERATIVO ] (Botões, Modais ativos)
                     → Sombra: Elegant Shadow + Deslocamento Físico (-4px)
  ┌───────────────────────────────────────────────────────────┐
  │               [ CAMADA 2: COMPONENTES ] (Organic Cards)   │
  │                  → Backdrop Blur (16px) + Borda Fina      │
  │  ┌─────────────────────────────────────────────────────┐  │
  │  │            [ CAMADA 1: TEXTURA E AMBIENTE ]          │  │  │
  │  │               → Ruído Fino (Noise 1%)               │  │  │
  │  │               → Ambient Blobs (Iluminação Indireta) │  │  │
  └──┴─────────────────────────────────────────────────────┴──┴──┘
```

### A. Glassmorphism v2 (Efeito Vidro Premium)
Aplicado em painéis de destaque para sobrepor o conteúdo mantendo a sensação de fluidez e integração com o fundo.
```scss
.glass-v2 {
  background: rgba(var(--surface-card-rgb), 0.28) !important;
  backdrop-filter: blur(12px) saturate(1.4) !important;
  -webkit-backdrop-filter: blur(20px) saturate(1.4) !important;
  border: 1px solid rgba(var(--surface-card-rgb), 0.5) !important;
  box-shadow: 
    0 10px 40px -10px rgba(0, 0, 0, 0.1),
    0 5px 15px -5px rgba(0, 0, 0, 0.05) !important;
}
```

### B. Ambient Blobs (Luminosidade Indireta)
Pontos de iluminação orgânica difusa inseridos ao fundo da interface para quebrar a solidez da cor base.
*   **Blob Teal (`.blob-teal`):** `rgba(93, 138, 140, 0.15)`
*   **Blob Orange (`.blob-orange`):** `rgba(216, 112, 76, 0.15)`
*   **Blob Gold (`.blob-gold`):** `rgba(240, 160, 64, 0.10)`
*   **Regra:** Devem possuir desfoque radial mínimo de **80px** a **120px** e ter a propriedade `pointer-events: none` ativa para não interceptar interações do usuário.

### C. Textura de Ruído Orgânico (Grain Texture)
Uma camada invisível de ruído analógico muito suave é aplicada no topo do background principal (`noise.gif` com 1% de opacidade). Isso adiciona uma sensação de acabamento de papel de alta gramatura ou material real premium.

### D. Sombras Elegantes (Elegant Shadow Stack)
*   **Luz e Sombra Natural:** As sombras no MonFinTrack simulam luz vinda do topo (deslocamento no eixo Y maior que no eixo X).
*   **Sombra Tema Claro (`.elegant-shadow`):** `0 10px 40px -10px rgba(0, 0, 0, 0.08)` (Suave, ampla, sem contornos escuros agressivos).
*   **Sombra Tema Escuro (`.elegant-shadow-dark`):** `0 10px 40px -10px rgba(0, 0, 0, 0.4)` (Mais densa para compensar a falta de contraste no fundo escuro).

---

## 7. Animações, Estados Ativos e Micro-interações

Interfaces estáticas são consideradas sem vida. O MonFinTrack deve responder fisicamente às interações do usuário e surgir na tela de maneira elegante.

### Transições Físicas e Easing
Toda animação de estados (`hover`, `focus`, `active`) deve utilizar curvas de aceleração naturais (Spring Physics/Bézicas) em vez de transições lineares duras.

*   **Transição Suave (`--transition-smooth`):** `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (Ideal para trocas de cor e opacidades).
*   **Transição Elástica/Spring (`--transition-spring`):** `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)` (Ideal para movimentos físicos, escala e deslocamento de cartões/botões).

### Micro-interações de Hover de Cartões
Ao passar o mouse sobre um cartão orgânico interativo, ele deve responder com elevação e profundidade aumentadas:
```scss
.organic-card:hover {
  transform: translateY(-4px) scale(1.01);
  background: rgba(var(--surface-card-rgb), 0.6) !important;
  box-shadow:
    0 16px 48px rgba(45, 90, 94, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 1) !important;
}
```

### Animações de Entrada (Scroll Reveals)
*   As seções principais do sistema devem surgir na tela utilizando animações de subida e desvanecimento cruzados (`fade-in-up`).
*   **Staggered Loading:** Itens em lista ou grades de cartões devem aparecer de forma sequencial (atrasos de 50ms entre cada item) para criar uma sensação de carregamento orquestrado e performático.

---

## 8. UX baseada em Leis de Psicologia Cognitiva

As decisões de layout do sistema são pautadas na redução de carga cognitiva e no direcionamento inteligente da atenção do usuário.

1.  **Doherty Threshold (Tempo de Resposta < 400ms):**
    *   Toda ação interativa deve prover feedback instantâneo. Se uma requisição API demorar mais de **400ms**, o botão deve entrar imediatamente em estado de carregamento (`loading spinner`) e um `skeleton screen` deve ocupar o lugar dos dados esperados.
2.  **Miller's Law (Chunking de Dados):**
    *   Painéis financeiros costumam sobrecarregar a visão do usuário. Agrupe transações e dados complexos em pedaços de no máximo **5 a 7 itens** por bloco visual.
3.  **Fitts' Law (Tamanho e Proximidade de Ações):**
    *   Os botões de confirmação principal devem ser generosos e posicionados próximos ao fluxo natural de leitura (canto inferior direito em desktops, base inferior central no mobile).
4.  **Peak-End Rule (Momentos de Sucesso):**
    *   Celebre conquistas do usuário. Atingir uma meta de economia ou quitar uma dívida deve gerar uma interação especial enriquecida (confetes sutis, mensagens empáticas personalizadas e layout vibrante).

---

## 9. Lista de Verificação de Qualidade UI/UX (Self-Audit)

Antes de aprovar qualquer tela ou componente de interface, faça as seguintes perguntas:

*   [ ] **Teste do Modelo:** Este layout se parece com um template padrão de mercado (Stripe, Vercel)? Se sim, redesenhe buscando assimetria intencional.
*   [ ] **Acessibilidade de Cores:** O contraste atende aos níveis mínimos da WCAG (mínimo de 4.5:1 para textos normais e 3:1 para textos grandes)?
*   [ ] **Tratamento de Motion:** A interface suporta a diretiva `prefers-reduced-motion` desativando animações pesadas caso o sistema do usuário solicite?
*   [ ] **Ergonomia de Toque:** Todos os inputs e botões possuem altura confortável para telas sensíveis ao toque (mínimo de 44px)?
*   [ ] **Consistência de Canto:** Os border-radii dos elementos internos são menores que os dos elementos externos para manter a proporção concêntrica?
*   [ ] **Semântica:** A estrutura HTML está usando tags corretas (`<main>`, `<section>`, `<article>`, `<header>`) contendo apenas uma tag `<h1>` principal por página?
