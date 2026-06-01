import { Component, input } from '@angular/core';

@Component({
  selector: 'app-clock-icon',
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
      <g class="clock-body">
        <circle cx="12" cy="12" r="10"/>
      </g>
      <g class="clock-hands">
        <path d="M12 6v6l4 2"/>
      </g>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .clock-hands {
      transition: transform 1s ease-in-out;
      transform-origin: 12px 12px;
    }

    :host:hover .clock-hands {
      transform: rotate(360deg);
    }
  `]
})
export class ClockIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
