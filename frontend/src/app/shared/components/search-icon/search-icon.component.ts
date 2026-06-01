import { Component, input } from '@angular/core';

@Component({
  selector: 'app-search-icon',
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
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    :host:hover svg {
      animation: searchWiggle 0.6s ease-in-out;
    }

    @keyframes searchWiggle {
      0%, 100% { transform: rotate(0); }
      25% { transform: rotate(-5deg); }
      75% { transform: rotate(5deg); }
    }
  `]
})
export class SearchIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
