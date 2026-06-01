import { Component, input } from '@angular/core';

@Component({
  selector: 'app-external-link-icon',
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
      <g class="ext-box">
        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4"/>
      </g>
      <g class="ext-arrow">
        <path d="M14 4h6m0 0v6m0-6L10 14"/>
      </g>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .ext-arrow {
      transition: transform 0.3s ease-out;
    }

    :host:hover .ext-arrow {
      transform: translate(2px, -2px) scale(1.1);
    }
  `]
})
export class ExternalLinkIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
