import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService, Appointment } from '../../services/appointments.service';
import { AuthService } from '../../services/auth';
import { MessageService } from '../../services/message.service';
import { MedicalHistoryService, MedicalHistoryRecord, AdditionalField } from '../../services/medical-history.service';

@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-turnos-especialista.html',
  styleUrls: ['./mis-turnos-especialista.scss']
})
export class MisTurnosEspecialistaComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  
  // Filtro global
  searchText: string = '';
  
  showCancelModal: boolean = false;
  showRejectModal: boolean = false;
  showAcceptModal: boolean = false;
  showCompleteModal: boolean = false;
  showReviewModal: boolean = false;
  showMedicalHistoryModal: boolean = false;
  
  selectedAppointment: Appointment | null = null;
  cancellationReason: string = '';
  rejectionReason: string = '';
  completionReview: string = '';
  
  medicalHistory: {
    height: number | null;
    weight: number | null;
    temperature: number | null;
    pressure: string;
    diagnosis: string;
    observations: string;
    additionalField1Key: string;
    additionalField1Value: string;
    additionalField2Key: string;
    additionalField2Value: string;
    additionalField3Key: string;
    additionalField3Value: string;
  } = {
    height: null,
    weight: null,
    temperature: null,
    pressure: '',
    diagnosis: '',
    observations: '',
    additionalField1Key: '',
    additionalField1Value: '',
    additionalField2Key: '',
    additionalField2Value: '',
    additionalField3Key: '',
    additionalField3Value: ''
  };
  
  loading: boolean = false;

  constructor(
    private appointmentsService: AppointmentsService,
    private authService: AuthService,
    private messageService: MessageService,
    private medicalHistoryService: MedicalHistoryService
  ) {}

  async ngOnInit() {
    await this.loadAppointments();
  }

  async loadAppointments() {
    try {
      this.loading = true;
      const user = this.authService.currentUser();
      if (user) {
        this.appointments = await this.appointmentsService.getSpecialistAppointments(user.uid);
        this.applyFilters();
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    if (!this.searchText.trim()) {
      this.filteredAppointments = [...this.appointments];
      return;
    }

    const searchTerm = this.searchText.toLowerCase().trim();
    
    this.filteredAppointments = this.appointments.filter(apt => {
      // Buscar en datos básicos del turno
      const basicMatch = 
        apt.specialty_name?.toLowerCase().includes(searchTerm) ||
        `${apt.patient_name} ${apt.patient_last_name}`.toLowerCase().includes(searchTerm) ||
        apt.appointment_date?.toLowerCase().includes(searchTerm) ||
        apt.appointment_time?.toLowerCase().includes(searchTerm) ||
        this.getStatusText(apt.status_id).toLowerCase().includes(searchTerm) ||
        apt.specialist_review?.toLowerCase().includes(searchTerm) ||
        apt.patient_feedback?.toLowerCase().includes(searchTerm) ||
        apt.cancellation_reason?.toLowerCase().includes(searchTerm) ||
        apt.rejection_reason?.toLowerCase().includes(searchTerm);

      // Buscar en historia clínica si existe
      if (apt.medical_history) {
        const mh = apt.medical_history;
        const medicalMatch = 
          mh.height?.toString().includes(searchTerm) ||
          mh.weight?.toString().includes(searchTerm) ||
          mh.temperature?.toString().includes(searchTerm) ||
          mh.pressure?.toLowerCase().includes(searchTerm) ||
          mh.diagnosis?.toLowerCase().includes(searchTerm) ||
          mh.observations?.toLowerCase().includes(searchTerm);

        // Buscar en campos adicionales dinámicos
        const additionalFieldsMatch = mh.additional_fields?.some((field: any) => 
          field.key?.toLowerCase().includes(searchTerm) ||
          field.value?.toLowerCase().includes(searchTerm)
        );

        if (medicalMatch || additionalFieldsMatch) {
          return true;
        }
      }

      return basicMatch;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  // ==================== VALIDACIONES ====================
  
  /**
   * Puede cancelar si NO fue Aceptado, Realizado o Rechazado
   * Status: 1=Pendiente, 2=Aceptado, 3=Rechazado, 4=Realizado, 5=Cancelado
   */
  canCancel(appointment: Appointment): boolean {
    return ![2, 3, 4].includes(appointment.status_id);
  }

  /**
   * Puede rechazar si NO fue Aceptado, Realizado o Cancelado
   */
  canReject(appointment: Appointment): boolean {
    return ![2, 4, 5].includes(appointment.status_id);
  }

  /**
   * Puede aceptar si NO fue Realizado, Cancelado o Rechazado
   */
  canAccept(appointment: Appointment): boolean {
    return ![3, 4, 5].includes(appointment.status_id);
  }

  /**
   * Puede finalizar si fue Aceptado
   */
  canComplete(appointment: Appointment): boolean {
    return appointment.status_id === 2; // Aceptado
  }

  /**
   * Puede ver reseña si tiene specialist_review
   */
  canViewReview(appointment: Appointment): boolean {
    return !!appointment.specialist_review;
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
      const user = this.authService.currentUser();
      if (user) {
        await this.appointmentsService.cancelAppointmentAsSpecialist(
          this.selectedAppointment.id!,
          this.cancellationReason,
          user.uid
        );
        await this.loadAppointments();
        this.closeCancelModal();
        this.messageService.showSuccess('Turno cancelado exitosamente');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      this.messageService.showError('Error al cancelar el turno');
    } finally {
      this.loading = false;
    }
  }

  openRejectModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.selectedAppointment = null;
    this.rejectionReason = '';
  }

  async confirmReject() {
    if (!this.selectedAppointment || !this.rejectionReason.trim()) {
      this.messageService.showWarning('Por favor, ingresá el motivo del rechazo');
      return;
    }

    try {
      this.loading = true;
      await this.appointmentsService.rejectAppointment(
        this.selectedAppointment.id!,
        this.rejectionReason
      );
      await this.loadAppointments();
      this.closeRejectModal();
      this.messageService.showSuccess('Turno rechazado');
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      this.messageService.showError('Error al rechazar el turno');
    } finally {
      this.loading = false;
    }
  }

  openAcceptModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.showAcceptModal = true;
  }

  closeAcceptModal() {
    this.showAcceptModal = false;
    this.selectedAppointment = null;
  }

  async confirmAccept() {
    if (!this.selectedAppointment) return;

    try {
      this.loading = true;
      await this.appointmentsService.acceptAppointment(this.selectedAppointment.id!);
      await this.loadAppointments();
      this.closeAcceptModal();
      this.messageService.showSuccess('Turno aceptado');
    } catch (error) {
      console.error('Error accepting appointment:', error);
      this.messageService.showError('Error al aceptar el turno');
    } finally {
      this.loading = false;
    }
  }

  openCompleteModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.completionReview = '';
    this.showMedicalHistoryModal = true;
    this.resetMedicalHistoryForm();
  }

  closeCompleteModal() {
    this.showMedicalHistoryModal = false;
    this.showCompleteModal = false;
    this.selectedAppointment = null;
    this.completionReview = '';
    this.resetMedicalHistoryForm();
  }

  resetMedicalHistoryForm() {
    this.medicalHistory = {
      height: null,
      weight: null,
      temperature: null,
      pressure: '',
      diagnosis: '',
      observations: '',
      additionalField1Key: '',
      additionalField1Value: '',
      additionalField2Key: '',
      additionalField2Value: '',
      additionalField3Key: '',
      additionalField3Value: ''
    };
  }

  async confirmComplete() {
    if (!this.selectedAppointment) {
      this.messageService.showWarning('No hay turno seleccionado');
      return;
    }

    if (!this.medicalHistory.diagnosis.trim()) {
      this.messageService.showWarning('Por favor, ingresá el diagnóstico');
      return;
    }

    try {
      this.loading = true;

      const additionalFields: AdditionalField[] = [];
      if (this.medicalHistory.additionalField1Key && this.medicalHistory.additionalField1Value) {
        additionalFields.push({
          key: this.medicalHistory.additionalField1Key,
          value: this.medicalHistory.additionalField1Value
        });
      }
      if (this.medicalHistory.additionalField2Key && this.medicalHistory.additionalField2Value) {
        additionalFields.push({
          key: this.medicalHistory.additionalField2Key,
          value: this.medicalHistory.additionalField2Value
        });
      }
      if (this.medicalHistory.additionalField3Key && this.medicalHistory.additionalField3Value) {
        additionalFields.push({
          key: this.medicalHistory.additionalField3Key,
          value: this.medicalHistory.additionalField3Value
        });
      }

      const medicalRecord: MedicalHistoryRecord = {
        patient_id: this.selectedAppointment.patient_id!,
        specialist_id: this.selectedAppointment.specialist_id!,
        appointment_id: this.selectedAppointment.id, // UUID directo
        height: this.medicalHistory.height,
        weight: this.medicalHistory.weight,
        temperature: this.medicalHistory.temperature,
        pressure: this.medicalHistory.pressure || null,
        diagnosis: this.medicalHistory.diagnosis,
        observations: this.medicalHistory.observations || null,
        additional_fields: additionalFields
      };

      await this.medicalHistoryService.createRecord(medicalRecord);

      await this.appointmentsService.completeAppointment(
        this.selectedAppointment.id!,
        this.medicalHistory.diagnosis
      );

      await this.loadAppointments();
      this.closeCompleteModal();
      this.messageService.showSuccess('Historia clínica registrada y turno finalizado');
    } catch (error) {
      console.error('Error completing appointment:', error);
      this.messageService.showError('Error al finalizar el turno');
    } finally {
      this.loading = false;
    }
  }

  openReviewModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.showReviewModal = true;
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.selectedAppointment = null;
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
      // Solo fecha
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
}
