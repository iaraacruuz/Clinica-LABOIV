import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  /** Formatea una fecha a diferentes formatos legibles en español */
  transform(value: string | Date | null | undefined, format: 'short' | 'long' | 'time' = 'short'): string {
    if (!value) return 'N/A';

    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) return 'Fecha inválida';

    switch (format) {
      case 'short':
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      case 'long':
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      case 'time':
        return date.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return date.toLocaleDateString('es-ES');
    }
  }
}
