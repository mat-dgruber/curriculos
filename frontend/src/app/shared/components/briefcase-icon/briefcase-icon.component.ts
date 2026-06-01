import { Component, input } from '@angular/core';

@Component({
  selector: 'app-briefcase-icon',
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
      <!-- handle -->
      <g class="briefcase-handle">
        <path d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </g>
      <!-- body -->
      <g class="briefcase-body">
        <path d="M4 8a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2v-8a2 2 0 00-2-2H4z"/>
        <path d="M10 14h.01"/>
        <path d="M14 14h.01"/>
      </g>
      <!-- flap line -->
      <line class="briefcase-flap" x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .briefcase-handle {
      transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      transform-origin: center bottom;
    }

    .briefcase-flap {
      transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      transform-origin: center;
    }

    :host:hover .briefcase-handle {
      transform: translateY(-2px);
    }

    :host:hover .briefcase-flap {
      transform: translateY(-1px);
    }
  `]
})
export class BriefcaseIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
