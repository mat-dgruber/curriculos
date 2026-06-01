import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      class="animate-pulse rounded-md bg-dark-border/60"
      [style.width]="width()"
      [style.height]="height()"
      [class]="roundedClass()"
    ></div>
  `
})
export class SkeletonComponent {
  width = input<string>('100%');
  height = input<string>('20px');
  rounded = input<'sm' | 'md' | 'lg' | 'full'>('md');

  roundedClass(): string {
    switch (this.rounded()) {
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'full': return 'rounded-full';
      default: return 'rounded-md';
    }
  }
}
