import { Component, input } from '@angular/core';

@Component({
  selector: 'app-building-icon',
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
      <g class="building-group">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </g>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .building-group {
      transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      transform-origin: center bottom;
    }

    :host:hover .building-group {
      transform: scaleY(1.1) translateY(-1px);
    }
  `]
})
export class BuildingIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
