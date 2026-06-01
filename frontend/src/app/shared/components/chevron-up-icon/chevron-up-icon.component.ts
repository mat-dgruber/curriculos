import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chevron-up-icon',
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
      <g class="chevron">
        <path d="M19 15l-7-7-7 7"/>
      </g>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .chevron {
      transition: transform 0.3s ease-in-out;
    }

    :host:hover .chevron {
      transform: translateY(-3px);
    }
  `]
})
export class ChevronUpIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
