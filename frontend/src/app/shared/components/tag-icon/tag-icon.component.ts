import { Component, input } from '@angular/core';

@Component({
  selector: 'app-tag-icon',
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
      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    :host:hover svg {
      animation: tagSwing 0.4s ease-in-out;
      transform-origin: 7px 3px;
    }

    @keyframes tagSwing {
      0%, 100% { transform: rotate(0); }
      33% { transform: rotate(-8deg); }
      66% { transform: rotate(5deg); }
    }
  `]
})
export class TagIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
