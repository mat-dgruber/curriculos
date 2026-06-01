---
name: Nested Card Clicks in Angular
description: Handling nested button clicks inside routerLink anchor cards in Angular to prevent unexpected navigation.
type: feedback
---

Quando colocamos botões de ação rápida (como favoritar, excluir ou salvar) dentro de um card que é um link de navegação (`<a>` com `[routerLink]`), o clique no botão pode acabar acionando a navegação padrão do card.

Para impedir esse comportamento de forma robusta e garantir uma experiência de usuário impecável, siga a regra de desenvolvimento combinada:

1. **`event.stopPropagation()`**: Evita que o evento de clique "suba" na árvore do DOM e chegue até a tag `<a>`.
2. **`event.preventDefault()`**: Impede que a ação padrão do link âncora pai seja processada pelo navegador (essencial para barrar o `routerLink`).
3. **`type="button"`**: Sempre adicione essa propriedade explicitamente na tag `<button>` no HTML para evitar que herde comportamentos ou tente submeter formulários.

**Why:**
Evita navegações indesejadas que quebram a fluidez da experiência do usuário, como abrir os detalhes de uma vaga ao clicar apenas no botão de favoritar.

**How to apply:**
No controller do componente:
```typescript
toggleFavorite(job: Job, event: Event): void {
  event.stopPropagation();
  event.preventDefault();
  
  // Lógica da ação rápida...
}
```

No template HTML:
```html
<button
  type="button"
  (click)="toggleFavorite(job, $event)"
  class="..."
>
  <svg>...</svg>
</button>
```
