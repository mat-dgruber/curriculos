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
      case 'jooble':
        return 'bg-success/10 border-success/20 text-success';
      case 'adzuna':
        return 'bg-info/10 border-info/20 text-info';
      case 'remotive':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'infojobs':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'catho':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      default:
        return 'bg-text-muted/10 border-dark-border text-text-muted';
    }
  }
}
