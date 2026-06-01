import { Component, input } from '@angular/core';

@Component({
  selector: 'app-file-text-icon',
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
      <path class="file-fold" d="M14 3v4a1 1 0 0 0 1 1h4"/>
      <path class="file-body" d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/>
      <line class="file-lines" x1="9" y1="17" x2="15" y2="17"/>
      <line class="file-lines file-lines-2" x1="9" y1="13" x2="15" y2="13"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .file-fold {
      stroke-dasharray: 20;
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 0.3s ease-out;
    }

    .file-lines {
      stroke-dasharray: 20;
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 0.4s ease-out 0.1s;
    }

    :host:hover .file-fold {
      stroke-dashoffset: 20;
    }

    :host:hover .file-lines {
      stroke-dashoffset: 20;
    }
  `]
})
export class FileTextIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
