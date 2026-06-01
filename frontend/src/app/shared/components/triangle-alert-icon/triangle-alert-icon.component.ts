import { Component, input } from '@angular/core';

@Component({
  selector: 'app-triangle-alert-icon',
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
      <g class="triangle">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      </g>
      <g class="exclamation">
        <line class="exclamation-line" x1="12" y1="9" x2="12" y2="13"/>
        <circle class="exclamation-dot" cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
      </g>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .triangle {
      transition: transform 0.25s ease-out;
    }

    .exclamation-line {
      transition: transform 0.3s ease-out;
      transform-origin: 12px 11px;
    }

    .exclamation-dot {
      transition: transform 0.25s ease-out, opacity 0.25s ease-out;
      transform-origin: 12px 17px;
    }

    :host:hover .triangle {
      transform: translateY(-1.5px);
    }

    :host:hover .exclamation-line {
      transform: scaleY(1.35);
    }

    :host:hover .exclamation-dot {
      transform: scale(1.4);
      opacity: 0.6;
    }
  `]
})
export class TriangleAlertIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
