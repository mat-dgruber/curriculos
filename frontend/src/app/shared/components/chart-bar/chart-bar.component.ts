import { Component, input, computed, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-chart-bar',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="bg-dark-surface border border-dark-border rounded-2xl p-5 hover:border-primary/20 transition-all duration-300">
      <h3 class="text-sm font-semibold text-white mb-4">{{ title() }}</h3>
      <div class="relative" style="height: 220px;">
        <canvas
          baseChart
          type="bar"
          [data]="chartData()"
          [options]="chartOptions()"
        ></canvas>
      </div>
    </div>
  `,
})
export class ChartBarComponent {
  private readonly themeService = inject(ThemeService);

  title = input.required<string>();
  data = input.required<number[]>();
  labels = input.required<string[]>();

  chartData = computed<ChartConfiguration<'bar'>['data']>(() => ({
    labels: this.labels(),
    datasets: [
      {
        data: this.data(),
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return 'rgba(37, 99, 235, 0.7)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);

          const theme = this.themeService.currentTheme();
          if (theme === 'capycro') {
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
            gradient.addColorStop(1, 'rgba(52, 211, 153, 0.9)');
          } else if (theme === 'light') {
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
            gradient.addColorStop(1, 'rgba(56, 189, 248, 0.9)');
          } else if (theme === 'high-contrast') {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 1.0)');
          } else {
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
            gradient.addColorStop(1, 'rgba(56, 189, 248, 0.8)');
          }
          return gradient;
        },
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 48,
      },
    ],
  }));

  chartOptions = computed<ChartConfiguration<'bar'>['options']>(() => {
    const theme = this.themeService.currentTheme();

    // Choose colors based on theme
    let ticksColor = '#94a3b8';
    let gridColor = 'rgba(31, 41, 55, 0.5)';
    let tooltipBg = '#1f2937';
    let tooltipBorder = '#2563eb';
    let tooltipTitle = '#e2e8f0';
    let tooltipBody = '#94a3b8';

    if (theme === 'light') {
      ticksColor = '#475569';
      gridColor = 'rgba(0, 0, 0, 0.06)';
      tooltipBg = '#ffffff';
      tooltipBorder = '#cbd5e1';
      tooltipTitle = '#1e293b';
      tooltipBody = '#475569';
    } else if (theme === 'capycro') {
      ticksColor = '#3f6212';
      gridColor = 'rgba(0, 0, 0, 0.05)';
      tooltipBg = '#f0fdf4';
      tooltipBorder = '#10b981';
      tooltipTitle = '#166534';
      tooltipBody = '#3f6212';
    } else if (theme === 'high-contrast') {
      ticksColor = '#ffffff';
      gridColor = 'rgba(255, 255, 255, 0.2)';
      tooltipBg = '#000000';
      tooltipBorder = '#ffffff';
      tooltipTitle = '#ffffff';
      tooltipBody = '#ffffff';
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipTitle,
          bodyColor: tooltipBody,
          borderColor: tooltipBorder,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          displayColors: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: ticksColor, font: { size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: ticksColor, font: { size: 11 }, stepSize: 1 },
          border: { display: false },
        },
      },
    };
  });
}