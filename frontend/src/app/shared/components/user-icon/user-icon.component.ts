import { Component, input } from '@angular/core';

@Component({
  selector: 'app-user-icon',
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
      <g class="user-avatar">
        <path d="M8 7a4 4 0 108 0 4 4 0 00-8 0"/>
        <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      </g>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .user-avatar {
      transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      transform-origin: center;
    }

    :host:hover .user-avatar {
      transform: scale(1.1) translateY(-1px);
    }
  `]
})
export class UserIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
