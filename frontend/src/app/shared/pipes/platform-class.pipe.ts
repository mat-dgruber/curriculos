import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'platformClass', standalone: true })
export class PlatformClassPipe implements PipeTransform {
  transform(platform: string): string {
    switch (platform) {
      case 'linkedin':
        return 'bg-primary/10 border-primary/20 text-primary';
      case 'gupy':
        return 'bg-accent/10 border-accent/20 text-accent';
      case 'vagas':
        return 'bg-warning/10 border-warning/20 text-warning';
      default:
        return 'bg-text-muted/10 border-dark-border text-text-muted';
    }
  }
}
