import { Component, input } from '@angular/core';

@Component({
  selector: 'app-bell-icon',
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
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    :host:hover svg {
      animation: bellSwing 0.6s ease-in-out;
      transform-origin: 50% 10%;
    }

    @keyframes bellSwing {
      0%, 100% { transform: rotate(0); }
      15% { transform: rotate(12deg); }
      30% { transform: rotate(-10deg); }
      45% { transform: rotate(6deg); }
      60% { transform: rotate(-4deg); }
      75% { transform: rotate(2deg); }
    }
  `]
})
export class BellIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
