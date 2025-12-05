import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appointmentStatus',
  standalone: true
})
export class AppointmentStatusPipe implements PipeTransform {
  /** Convierte el ID de estado de turno a texto legible en español */
  transform(statusId: number | null | undefined): string {
    if (statusId === null || statusId === undefined) return 'Desconocido';

    const statuses: { [key: number]: string } = {
      1: 'Solicitado',
      2: 'Aceptado',
      3: 'Rechazado',
      4: 'Finalizado',
      5: 'Cancelado'
    };

    return statuses[statusId] || 'Desconocido';
  }
}
