import { Component, input } from '@angular/core';

@Component({
  selector: 'app-check-icon',
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
      <path class="check-path" d="M5 13l4 4L19 7"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .check-path {
      stroke-dasharray: 30;
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 0.4s ease-in-out;
    }

    :host:hover .check-path {
      stroke-dashoffset: 30;
    }
  `]
})
export class CheckIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
