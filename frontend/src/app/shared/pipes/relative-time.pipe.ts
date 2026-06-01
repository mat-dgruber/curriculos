import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null): string {
    if (!value) return '';
    const now = new Date();
    const date = new Date(value);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'agora mesmo';
    if (diffMin < 60) return `${diffMin} minuto${diffMin > 1 ? 's' : ''} atrás`;
    if (diffHour < 24) return `${diffHour} hora${diffHour > 1 ? 's' : ''} atrás`;
    if (diffDay < 30) return `${diffDay} dia${diffDay > 1 ? 's' : ''} atrás`;
    return date.toLocaleDateString('pt-BR');
  }
}
