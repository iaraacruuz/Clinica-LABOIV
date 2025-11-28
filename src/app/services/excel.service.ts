import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

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

  /**
   * Exporta los datos de usuarios a un archivo Excel
   */
  exportUsersToExcel(users: any[]): void {
    if (!users || users.length === 0) {
      console.warn('No hay usuarios para exportar');
      return;
    }

    // Mapear datos al formato deseado
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

    // Crear hoja de trabajo
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);

    // Ajustar ancho de columnas
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

    // Generar archivo Excel
    const fileName = `Usuarios_Clinica_Online_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Formatea el rol del usuario a texto legible en español
   */
  private formatRole(role: string): string {
    const roles: Record<string, string> = {
      'admin': 'Administrador',
      'specialist': 'Especialista',
      'patient': 'Paciente'
    };
    return roles[role] || role;
  }

  /**
   * Formatea el estado del usuario
   */
  private formatStatus(user: any): string {
    if (user.role === 'specialist') {
      return user.is_approved ? 'Aprobado' : 'Pendiente de Aprobación';
    }
    return 'Activo';
  }

  /**
   * Formatea la fecha a formato DD/MM/YYYY
   */
  private formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
