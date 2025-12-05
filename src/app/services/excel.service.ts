import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExcelUser {
  'Nombre': string;
  'Apellido': string;
  'Email': string;
  'DNI': string;
  'Edad': number | string;
  'Rol': string;
  'Estado': string;
  'Fecha de Registro': string;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor() { }

  /** Exporta la lista de usuarios del sistema a un archivo Excel */
  exportUsersToExcel(users: any[]): void {
    if (!users || users.length === 0) {
      console.warn('No hay usuarios para exportar');
      return;
    }

    const excelData: ExcelUser[] = users.map(user => ({
      'Nombre': user.name || '',
      'Apellido': user.last_name || '',
      'Email': user.email || '',
      'DNI': user.dni || 'N/A',
      'Edad': user.age || 'N/A',
      'Rol': this.formatRole(user.role),
      'Estado': this.formatStatus(user),
      'Fecha de Registro': this.formatDate(user.created_at)
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 15 }, // Nombre
      { wch: 15 }, // Apellido
      { wch: 30 }, // Email
      { wch: 12 }, // DNI
      { wch: 8 },  // Edad
      { wch: 15 }, // Rol
      { wch: 15 }, // Estado
      { wch: 20 }  // Fecha de Registro
    ];
    worksheet['!cols'] = columnWidths;

    // Crear libro de trabajo
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

    const fileName = `Usuarios_Clinica_Online_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  /** Convierte el rol del usuario a texto legible en español */
  private formatRole(role: string): string {
    const roles: Record<string, string> = {
      'admin': 'Administrador',
      'specialist': 'Especialista',
      'patient': 'Paciente'
    };
    return roles[role] || role;
  }

  /** Devuelve el estado de aprobación del usuario */
  private formatStatus(user: any): string {
    if (user.role === 'specialist') {
      return user.is_approved ? 'Aprobado' : 'Pendiente de Aprobación';
    }
    return 'Activo';
  }

  /** Formatea una fecha a formato DD/MM/YYYY */
  private formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /** Exporta los turnos de un paciente a un archivo Excel */
  exportPatientAppointmentsToExcel(patientName: string, patientLastName: string, appointments: any[]): void {
    if (!appointments || appointments.length === 0) {
      console.warn('No hay turnos para exportar');
      return;
    }

    const excelData = appointments.map(apt => ({
      'Fecha': this.formatDateShort(apt.appointment_date),
      'Hora': apt.appointment_time || 'N/A',
      'Especialidad': apt.specialty_name || 'N/A',
      'Especialista': apt.specialist_name ? `${apt.specialist_name} ${apt.specialist_last_name || ''}`.trim() : 'N/A',
      'Estado': this.formatAppointmentStatus(apt.status_id),
      'Duración (min)': apt.duration_minutes || 'N/A',
      'Comentario': apt.comment || 'Sin comentarios',
      'Calificación': apt.rating ? `${apt.rating}/5` : 'Sin calificar'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 12 }, // Fecha
      { wch: 10 }, // Hora
      { wch: 20 }, // Especialidad
      { wch: 25 }, // Especialista
      { wch: 15 }, // Estado
      { wch: 12 }, // Duración
      { wch: 30 }, // Comentario
      { wch: 12 }  // Calificación
    ];
    worksheet['!cols'] = columnWidths;

    // Crear libro de trabajo
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Turnos');

    // Generar archivo Excel
    const fileName = `Turnos_${patientName}_${patientLastName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  /** Formatea una fecha a formato corto DD/MM/YYYY */
  private formatDateShort(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  /** Convierte el ID de estado a texto legible */
  private formatAppointmentStatus(statusId: number): string {
    const statuses: Record<number, string> = {
      1: 'Solicitado',
      2: 'Aceptado',
      3: 'Rechazado',
      4: 'Finalizado',
      5: 'Cancelado'
    };
    return statuses[statusId] || 'Desconocido';
  }

  /** Exporta cualquier conjunto de datos genérico a Excel */
  exportToExcel(data: any[], fileName: string): void {
    if (!data || data.length === 0) {
      console.warn('No hay datos para exportar');
      return;
    }

    // Crear hoja de trabajo
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Crear libro de trabajo
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Generar archivo Excel
    const fullFileName = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fullFileName);
  }
}
