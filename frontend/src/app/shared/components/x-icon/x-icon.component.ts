import { Component, input } from '@angular/core';

@Component({
  selector: 'app-x-icon',
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
      <line class="x-line-1" x1="18" y1="6" x2="6" y2="18"/>
      <line class="x-line-2" x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .x-line-1, .x-line-2 {
      transition: transform 0.2s ease-out;
      transform-origin: 50% 50%;
    }

    :host:hover .x-line-1 {
      transform: rotate(15deg) scale(1.1);
    }

    :host:hover .x-line-2 {
      transform: rotate(-15deg) scale(1.1);
    }
  `]
})
export class XIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
