---
name: Theme-Adaptive Canvas Charts in Angular
description: Best practices for making Chart.js and Canvas-based charts responsive to active themes in Angular using computed signals
type: feedback
---

# Theme-Adaptive Canvas Charts in Angular

Canvas-based rendering libraries like Chart.js do not natively adapt to CSS-driven theme changes (such as light/dark mode) once painted. To ensure charts are perfectly readable, high-contrast, and aesthetically matched to every custom theme, use dynamic Angular computed signals.

## Guidelines

1. **Inject ThemeService:** Inject the global `ThemeService` into the chart component.
2. **Compute Chart Data & Options:** Define `chartData` and `chartOptions` as `computed()` signals that read `this.themeService.currentTheme()`.
3. **Map Theme Properties:** Within the computed signals, dynamically assign grid colors, tick font colors, tooltip backgrounds, and borders based on the active theme (e.g., `'light'`, `'dark'`, `'capycro'`, or `'high-contrast'`).
4. **Dynamic Canvas Gradients:** If using vertical gradients, write a gradient color-stop assignment callback inside `backgroundColor` that queries the current theme signal reatively.

**Why:** Using computed signals causes Chart.js to automatically re-evaluate and repaint eaxes, tooltips, gridlines, and bars the exact millisecond a user switches themes, eliminating stale colors or contrast breaking.

## Code Pattern Example

```typescript
chartOptions = computed<ChartConfiguration<'bar'>['options']>(() => {
  const theme = this.themeService.currentTheme();
  let ticksColor = '#94a3b8';
  let gridColor = 'rgba(31, 41, 55, 0.5)';
  
  if (theme === 'light') {
    ticksColor = '#475569';
    gridColor = 'rgba(0, 0, 0, 0.06)';
  } else if (theme === 'capycro') {
    ticksColor = '#3f6212';
    gridColor = 'rgba(0, 0, 0, 0.05)';
  }
  
  return {
    responsive: true,
    scales: {
      x: { ticks: { color: ticksColor } },
      y: { grid: { color: gridColor }, ticks: { color: ticksColor } }
    }
  };
});
```
