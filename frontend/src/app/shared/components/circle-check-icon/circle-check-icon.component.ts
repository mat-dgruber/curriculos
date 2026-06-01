import { Component, input } from '@angular/core';

@Component({
  selector: 'app-circle-check-icon',
  standalone: true,
  host: { 'style': 'display: inline-flex; align-items: center; justify-content: center;' },
  template: `
    <svg
      class="check-circle-svg"
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
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/>
      <path class="check-path" d="M9 12l2 2l4 -4"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .check-circle-svg {
      transition: transform 0.2s ease-in-out;
    }

    .check-path {
      stroke-dasharray: 20;
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 0.4s ease-out;
    }

    :host:hover .check-circle-svg {
      transform: scale(1.1);
    }

    :host:hover .check-path {
      stroke-dashoffset: 20;
    }
  `]
})
export class CircleCheckIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
