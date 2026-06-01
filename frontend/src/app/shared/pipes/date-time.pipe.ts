import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateTime', standalone: true })
export class DateTimePipe implements PipeTransform {
  transform(value: string | null, format: 'short' | 'long' | 'relative' = 'short'): string {
    if (!value) return '';

    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMin = Math.floor(diffMs / (1000 * 60));

    if (format === 'relative') {
      if (diffMin < 0) return 'atrasado';
      if (diffMin < 60) return `em ${diffMin} min`;
      if (diffHours < 24) return `em ${diffHours}h`;
      if (diffDays === 0) return `hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      if (diffDays === 1) return `amanhã às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      if (diffDays < 7) return `em ${diffDays} dias`;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    if (format === 'long') {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // format === 'short'
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
