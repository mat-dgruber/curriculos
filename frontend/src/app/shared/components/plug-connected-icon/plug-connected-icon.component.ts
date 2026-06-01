import { Component, input } from '@angular/core';

@Component({
  selector: 'app-plug-connected-icon',
  standalone: true,
  host: {
    'style': 'display: inline-flex; align-items: center; justify-content: center;'
  },
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
      class="plug-connected-icon"
    >
      <!-- invisible hit area -->
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>

      <!-- upper part: semicircle + antenna -->
      <g class="plug-upper-part">
        <path d="M17 12l-5 -5l1.5 -1.5a3.536 3.536 0 1 1 5 5l-1.5 1.5z"/>
        <path d="M18.5 5.5l2.5 -2.5"/>
      </g>

      <!-- lower part: semicircle + antenna -->
      <g class="plug-lower-part">
        <path d="M7 12l5 5l-1.5 1.5a3.536 3.536 0 1 1 -5 -5l1.5 -1.5z"/>
        <path d="M3 21l2.5 -2.5"/>
      </g>

      <!-- legs (pins) -->
      <path class="plug-leg plug-leg-1" d="M10 11l-2 2"/>
      <path class="plug-leg plug-leg-2" d="M13 14l-2 2"/>
    </svg>
  `,
  styles: [`
    :host {
      cursor: pointer;
    }

    .plug-upper-part,
    .plug-lower-part {
      transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .plug-leg {
      transition: opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    /* hover: upper part moves up-left */
    :host:hover .plug-upper-part {
      transform: translate(-2px, -2px);
    }

    /* hover: lower part moves down-right */
    :host:hover .plug-lower-part {
      transform: translate(2px, 2px);
    }

    /* hover: legs disappear */
    :host:hover .plug-leg {
      opacity: 0;
    }
  `]
})
export class PlugConnectedIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}