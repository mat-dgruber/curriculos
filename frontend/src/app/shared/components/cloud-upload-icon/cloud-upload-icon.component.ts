import { Component, input } from '@angular/core';

@Component({
  selector: 'app-cloud-upload-icon',
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
      <g class="upload-arrow">
        <path d="M12 3v12"/>
        <path d="m17 8-5-5-5 5"/>
      </g>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .upload-arrow {
      transition: transform 0.4s ease-in-out;
    }

    :host:hover .upload-arrow {
      transform: translateY(-4px);
    }
  `]
})
export class CloudUploadIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
