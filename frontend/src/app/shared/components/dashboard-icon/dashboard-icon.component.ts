import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-icon',
  standalone: true,
  host: { 'style': 'display: inline-flex; align-items: center; justify-content: center;' },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <g class="dashboard-grid">
        <rect class="rect-1" x="3" y="3" width="7" height="9" rx="1"/>
        <rect class="rect-2" x="14" y="3" width="7" height="5" rx="1"/>
        <rect class="rect-3" x="14" y="12" width="7" height="9" rx="1"/>
        <rect class="rect-4" x="3" y="16" width="7" height="5" rx="1"/>
      </g>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .dashboard-grid rect {
      transition: transform 0.3s ease-in-out;
    }

    :host:hover .rect-1 {
      transform: translate(2px, -1px);
    }

    :host:hover .rect-2 {
      transform: translate(0, -2px);
    }

    :host:hover .rect-3 {
      transform: translate(-2px, 1px);
    }

    :host:hover .rect-4 {
      transform: translate(0, 2px);
    }
  `]
})
export class DashboardIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
