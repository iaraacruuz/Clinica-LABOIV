import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService, Appointment } from '../../services/appointments.service';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-turnos.html',
  styleUrls: ['./mis-turnos.scss']
})
export class MisTurnosComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  
  // Filtro global
  searchText: string = '';
  
  // Estado
  loading: boolean = true;
  currentUserId: string = '';
  
  // Modales
  showCancelModal: boolean = false;
  showRatingModal: boolean = false;
  showReviewModal: boolean = false;
  showSurveyModal: boolean = false;
  
  selectedAppointment: Appointment | null = null;
  cancellationReason: string = '';
  
  // Calificación
  rating: number = 0;
  patientComment: string = '';
  
  // Encuesta
  surveyAnswers = {
    question1: '', // ¿Cómo calificaría la atención recibida?
    question2: '', // ¿El especialista fue puntual?
    question3: '', // ¿El especialista explicó claramente su diagnóstico?
    question4: '', // ¿Recomendaría este especialista?
    question5: '', // ¿Las instalaciones de la clínica fueron adecuadas?
    question6: ''  // Comentarios adicionales
  };
  


  constructor(
    private appointmentsService: AppointmentsService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    try {
      const user = this.authService.currentUser();
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      
      this.currentUserId = user.uid;
      await this.loadAppointments();
    } catch (error) {
      console.error('Error initializing component:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadAppointments() {
    try {
      this.loading = true;
      this.appointments = await this.appointmentsService.getPatientAppointments(this.currentUserId);
      this.applyFilters();
    } catch (error) {
      console.error('Error loading appointments:', error);
      this.messageService.showError('Error al cargar los turnos');
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
        `${apt.specialist_name} ${apt.specialist_last_name}`.toLowerCase().includes(searchTerm) ||
        apt.appointment_date?.toLowerCase().includes(searchTerm) ||
        apt.appointment_time?.toLowerCase().includes(searchTerm) ||
        this.getStatusText(apt).toLowerCase().includes(searchTerm) ||
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

  // ==================== ACCIONES ====================
  // Status IDs: 1=Pendiente, 2=Aceptado, 3=Rechazado, 4=Realizado, 5=Cancelado, 6=No se presentó

  canCancel(appointment: Appointment): boolean {
    // Solo si el turno NO fue realizado (status_id !== 4)
    return appointment.status_id !== 4 && appointment.status_id !== 3 && appointment.status_id !== 5;
  }

  canViewReview(appointment: Appointment): boolean {
    // Solo si el turno tiene reseña del especialista
    return !!appointment.specialist_review;
  }

  canCompleteSurvey(appointment: Appointment): boolean {
    // Solo si el turno está realizado, tiene reseña y no completó la encuesta
    return appointment.status_id === 4 && !!appointment.specialist_review && !appointment.survey_completed;
  }

  canRate(appointment: Appointment): boolean {
    // Solo si el turno está realizado y no ha calificado
    return appointment.status_id === 4 && !appointment.patient_rating;
  }

  // Cancelar turno
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
      this.messageService.showWarning('Debe ingresar un motivo de cancelación');
      return;
    }

    try {
      await this.appointmentsService.cancelAppointmentAsPatient(
        this.selectedAppointment.id!,
        this.cancellationReason,
        this.currentUserId
      );
      
      this.closeCancelModal();
      await this.loadAppointments();
      this.messageService.showSuccess('Turno cancelado exitosamente');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      this.messageService.showError('Error al cancelar el turno');
    }
  }

  // Ver reseña
  openReviewModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.showReviewModal = true;
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.selectedAppointment = null;
  }

  // Completar encuesta
  openSurveyModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.surveyAnswers = {
      question1: '',
      question2: '',
      question3: '',
      question4: '',
      question5: '',
      question6: ''
    };
    this.showSurveyModal = true;
  }

  closeSurveyModal() {
    this.showSurveyModal = false;
    this.selectedAppointment = null;
  }

  async submitSurvey() {
    if (!this.selectedAppointment) return;

    // Validar que al menos las primeras 5 preguntas estén respondidas
    const requiredAnswers = [
      this.surveyAnswers.question1,
      this.surveyAnswers.question2,
      this.surveyAnswers.question3,
      this.surveyAnswers.question4,
      this.surveyAnswers.question5
    ];

    if (requiredAnswers.some(answer => !answer.trim())) {
      this.messageService.showWarning('Por favor responda todas las preguntas obligatorias (1-5)');
      return;
    }

    try {
      await this.appointmentsService.completeSurvey(
        this.selectedAppointment.id!,
        this.surveyAnswers
      );
      
      this.closeSurveyModal();
      await this.loadAppointments();
      this.messageService.showSuccess('Encuesta completada exitosamente. ¡Gracias por su tiempo!');
    } catch (error) {
      console.error('Error submitting survey:', error);
      this.messageService.showError('Error al enviar la encuesta');
    }
  }



  // Calificar atención
  openRatingModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.rating = 0;
    this.patientComment = '';
    this.showRatingModal = true;
  }

  closeRatingModal() {
    this.showRatingModal = false;
    this.selectedAppointment = null;
    this.rating = 0;
    this.patientComment = '';
  }

  setRating(stars: number) {
    this.rating = stars;
  }

  async submitRating() {
    if (!this.selectedAppointment || this.rating === 0) {
      this.messageService.showWarning('Debe seleccionar una calificación (1-5 estrellas)');
      return;
    }

    if (!this.patientComment.trim()) {
      this.messageService.showWarning('Debe ingresar un comentario sobre la atención recibida');
      return;
    }

    try {
      await this.appointmentsService.rateAppointment(
        this.selectedAppointment.id!,
        this.rating,
        this.patientComment
      );
      
      this.closeRatingModal();
      await this.loadAppointments();
      this.messageService.showSuccess('Calificación enviada exitosamente. ¡Gracias por su valoración!');
    } catch (error) {
      console.error('Error rating appointment:', error);
      this.messageService.showError('Error al enviar la calificación');
    }
  }

  // ==================== UTILIDADES ====================

  getStatusText(appointment: Appointment): string {
    // Mapeo de nombres en inglés a español
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'accepted': 'Aceptado',
      'rejected': 'Rechazado',
      'cancelled': 'Cancelado',
      'completed': 'Realizado',
      'no-show': 'No se presentó'
    };
    return statusMap[appointment.status_name || ''] || appointment.status_name || 'Desconocido';
  }

  getStatusClass(statusId: number): string {
    const classMap: { [key: number]: string } = {
      1: 'status-pending',
      2: 'status-accepted',
      3: 'status-rejected',
      4: 'status-completed',
      5: 'status-cancelled',
      6: 'status-no-show'
    };
    return classMap[statusId] || 'status-unknown';
  }

  formatDate(dateString: string): string {
    // dateString es DATE (YYYY-MM-DD)
    // Agregar T00:00:00 para evitar problemas de zona horaria
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }

  formatTime(timeString: string): string {
    // timeString es TIME (HH:MM:SS)
    // Crear una fecha arbitraria solo para formatear la hora
    const d = new Date(`2000-01-01T${timeString}`);
    return d.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
