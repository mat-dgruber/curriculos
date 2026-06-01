import { Component, input } from '@angular/core';

@Component({
  selector: 'app-map-pin-icon',
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
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle class="pin-dot" cx="12" cy="10" r="3"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .pin-dot {
      transition: opacity 0.6s ease-in-out;
    }

    :host:hover .pin-dot {
      animation: pinPulse 0.6s ease-in-out infinite;
    }

    @keyframes pinPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class MapPinIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
