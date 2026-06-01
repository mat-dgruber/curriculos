import { Component, input } from '@angular/core';

@Component({
  selector: 'app-trending-up-icon',
  standalone: true,
  host: { style: 'display: inline-flex; align-items: center; justify-content: center;' },
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
      <path class="trend-line" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  `,
  styles: [
    `
      :host {
        cursor: pointer;
      }

      .trend-line {
        transition: transform 0.3s ease-in-out;
      }

      :host:hover .trend-line {
        transform: translateY(-2px);
      }
    `,
  ],
})
export class TrendingUpIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
