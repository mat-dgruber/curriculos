import { Component, input } from '@angular/core';

@Component({
  selector: 'app-send-icon',
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
      <g class="send-icon-group">
        <path d="M10 14l11 -11"/>
        <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"/>
      </g>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .send-icon-group {
      transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    :host:hover .send-icon-group {
      transform: translate(2px, -2px);
    }
  `]
})
export class SendIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
