import { Component, input, computed } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

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
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
          gradient.addColorStop(1, 'rgba(56, 189, 248, 0.8)');
          return gradient;
        },
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 48,
      },
    ],
  }));

  chartOptions = computed<ChartConfiguration<'bar'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#2563eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(31, 41, 55, 0.5)' },
        ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 1 },
        border: { display: false },
      },
    },
  }));
}
