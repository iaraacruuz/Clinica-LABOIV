import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService, Appointment } from '../../services/appointments.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-turnos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos-admin.html',
  styleUrls: ['./turnos-admin.scss']
})
export class TurnosAdminComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  
  // Filtros
  filterSpecialty: string = '';
  filterSpecialist: string = '';
  
  // Estados de modales
  showCancelModal: boolean = false;
  
  // Datos para modales
  selectedAppointment: Appointment | null = null;
  cancellationReason: string = '';
  
  loading: boolean = false;

  constructor(
    private appointmentsService: AppointmentsService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.loadAllAppointments();
  }

  async loadAllAppointments() {
    try {
      this.loading = true;
      this.appointments = await this.appointmentsService.getAllAppointments();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading appointments:', error);
      this.messageService.showError('Error al cargar los turnos');
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    this.filteredAppointments = this.appointments.filter(apt => {
      const specialtyMatch = !this.filterSpecialty || 
        apt.specialty_name?.toLowerCase().includes(this.filterSpecialty.toLowerCase());
      
      const specialistMatch = !this.filterSpecialist || 
        `${apt.specialist_name} ${apt.specialist_last_name}`.toLowerCase().includes(this.filterSpecialist.toLowerCase());
      
      return specialtyMatch && specialistMatch;
    });
  }

  onFilterChange() {
    this.applyFilters();
  }

  // ==================== VALIDACIONES ====================
  
  /**
   * Puede cancelar solo si está en estado Solicitado (1) o Aceptado (2)
   * Status: 1=Solicitado, 2=Aceptado, 3=Rechazado, 4=Finalizado, 5=Cancelado
   */
  canCancel(appointment: Appointment): boolean {
    return appointment.status_id === 1 || appointment.status_id === 2;
  }

  // ==================== ACCIONES ====================

  openCancelModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.cancellationReason = '';
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.selectedAppointment = null;
    this.cancellationReason = '';
  }

  async confirmCancel() {
    if (!this.selectedAppointment || !this.cancellationReason.trim()) {
      this.messageService.showWarning('Por favor, ingresá el motivo de la cancelación');
      return;
    }

    try {
      this.loading = true;
      await this.appointmentsService.cancelAppointmentAsAdmin(
        this.selectedAppointment.id!,
        this.cancellationReason,
        'admin' // adminId placeholder
      );
      await this.loadAllAppointments();
      this.closeCancelModal();
      this.messageService.showSuccess('Turno cancelado exitosamente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      this.messageService.showError('Error al cancelar el turno');
    } finally {
      this.loading = false;
    }
  }

  // ==================== UTILIDADES ====================

  getStatusText(status_id: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'Pendiente',
      2: 'Aceptado',
      3: 'Rechazado',
      4: 'Realizado',
      5: 'Cancelado',
      6: 'No se presentó'
    };
    return statusMap[status_id] || 'Desconocido';
  }

  getStatusClass(status_id: number): string {
    const classMap: { [key: number]: string } = {
      1: 'status-pending',
      2: 'status-accepted',
      3: 'status-rejected',
      4: 'status-completed',
      5: 'status-cancelled',
      6: 'status-no-show'
    };
    return classMap[status_id] || '';
  }

  formatDate(dateString: string, timeString?: string): string {
    // Si solo hay fecha (DATE), usar esa fecha directamente
    // Si hay hora también (TIME), combinarlas
    let dateToFormat: Date;
    
    if (timeString) {
      // Combinar fecha y hora
      dateToFormat = new Date(`${dateString}T${timeString}`);
    } else {
      // Solo fecha - agregar T00:00:00 para evitar problemas de zona horaria
      dateToFormat = new Date(dateString + 'T00:00:00');
    }
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    if (timeString) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return dateToFormat.toLocaleDateString('es-AR', options);
  }

  getPatientFullName(appointment: Appointment): string {
    return `${appointment.patient_name} ${appointment.patient_last_name}`;
  }

  getSpecialistFullName(appointment: Appointment): string {
    return `${appointment.specialist_name} ${appointment.specialist_last_name}`;
  }

  // Getters para las estadísticas
  get pendingCount(): number {
    return this.filteredAppointments.filter(apt => apt.status_id === 1).length;
  }

  get acceptedCount(): number {
    return this.filteredAppointments.filter(apt => apt.status_id === 2).length;
  }

  get completedCount(): number {
    return this.filteredAppointments.filter(apt => apt.status_id === 4).length;
  }
}