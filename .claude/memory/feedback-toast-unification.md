---
name: Toast system unification
description: Unified dual toast systems into single signal-based ToastService with CSS variables and z-index management
type: feedback
---

Toast system modernizado: unificado `ToastService` (signal-based, auto-dismiss, top-right, glass-v2, slide-in) + `ToastComponent`. Removido `ToastContainerComponent` legado.

**Why:** Existiam dois sistemas de toast conflitantes causando inconsistência. Novo serviço usa Angular signals (`.set()`/`.update()`), `computed()`, `DestroyRef` + `takeUntilDestroyed` para cleanup automático.

**How to apply:**
1. Use `ToastService` from `@/shared/services/toast.service` — métodos: `success()`, `error()`, `info()`, `warning()`, `clear()`
2. Componente `<app-toast />` já montado em `app.html` (top-right via CSS vars)
3. CSS vars definidas em `styles.css`: `--z-toast: 100`, `--z-dropdown: 50` — dropdowns usam `var(--z-dropdown)` no `.select-dropdown`
4. Botões migrados para `--primary-color`, `--error-color`, etc. em `button.component.ts`
5. Barrel exports: `icons/index.ts` (24 ícones), `shared/components/index.ts` atualizado
6. 13 arquivos migrados ao novo import path (`../services/toast.service`): 10 features + error.interceptor + 3 testes