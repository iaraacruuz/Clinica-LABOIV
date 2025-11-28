import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Appointment {
  id?: string;
  patient_id: string;
  specialist_id: string;
  specialty_id: number; // INTEGER FK to specialties.id
  status_id: number;
  appointment_date: string; // DATE (YYYY-MM-DD) or full ISO timestamp
  appointment_time?: string; // TIME (HH:MM:SS) - when using separate fields
  duration_minutes: number;
  cancellation_reason?: string;
  rejection_reason?: string;
  specialist_review?: string; // Reseña del especialista
  patient_feedback?: string; // Comentario del paciente
  patient_rating?: number; // Rating del paciente (1-5)
  survey_completed?: boolean;
  survey_answers?: any; // JSONB
  created_at?: string;
  updated_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  
  // Datos relacionados (joins)
  patient_name?: string;
  patient_last_name?: string;
  specialist_name?: string;
  specialist_last_name?: string;
  specialty_name?: string;
  status_name?: string;
  medical_history?: any; // Historia clínica del turno
}

export interface SpecialistAvailability {
  id?: string;
  specialist_id: string;
  specialty_id: number; // INTEGER FK to specialties.id
  day_of_week: number; // 0-6
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  is_active: boolean;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  constructor(private supabase: SupabaseService) {}

  // ==================== PACIENTES ====================

  /**
   * Obtener todos los turnos de un paciente
   */
  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Obtener datos relacionados manualmente
      const enrichedData = await Promise.all((data || []).map(async (apt: any) => {
        // Obtener datos del especialista
        const { data: specialistData } = await this.supabase.client
          .from('profiles')
          .select('name, last_name')
          .eq('id', apt.specialist_id)
          .single();

        // Obtener datos de la especialidad
        const { data: specialtyData } = await this.supabase.client
          .from('specialties')
          .select('name')
          .eq('id', apt.specialty_id)
          .single();

        // Obtener datos del estado
        const { data: statusData } = await this.supabase.client
          .from('appointment_statuses')
          .select('status_name')
          .eq('id', apt.status_id)
          .single();

        // Obtener historia clínica si existe
        const { data: medicalHistory } = await this.supabase.client
          .from('medical_history')
          .select('*')
          .eq('appointment_id', apt.id)
          .single();

        return {
          ...apt,
          specialist_name: specialistData?.name,
          specialist_last_name: specialistData?.last_name,
          specialty_name: specialtyData?.name,
          status_name: statusData?.status_name,
          medical_history: medicalHistory || null
        };
      }));

      return enrichedData;
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      throw error;
    }
  }

  /**
   * Cancelar turno (paciente)
   * Status IDs: 1=Pendiente, 2=Aceptado, 3=Rechazado, 4=Realizado, 5=Cancelado, 6=No se presentó
   */
  async cancelAppointmentAsPatient(appointmentId: string, reason: string, patientId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('appointments')
        .update({
          status_id: 5, // Cancelado
          cancellation_reason: reason
        })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Calificar atención del especialista
   */
  async rateAppointment(appointmentId: string, rating: number, comment: string): Promise<void> {
    try {
      console.log('Rating appointment with data:', { appointmentId, rating, comment });
      
      const updateData = {
        patient_rating: rating,
        patient_feedback: comment
      };
      
      console.log('Update data:', updateData);
      
      const { error } = await this.supabase.client
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      console.log('Update error:', error);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error rating appointment:', error);
      throw error;
    }
  }

  /**
   * Completar encuesta de satisfacción
   */
  async completeSurvey(appointmentId: string, surveyAnswers: any): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('appointments')
        .update({
          survey_completed: true,
          survey_answers: surveyAnswers
        })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing survey:', error);
      throw error;
    }
  }

  // ==================== ESPECIALISTAS ====================

  /**
   * Obtener todos los turnos de un especialista
   */
  async getSpecialistAppointments(specialistId: string): Promise<Appointment[]> {
    try {
      console.log('Loading appointments for specialist:', specialistId);
      
      const { data, error } = await this.supabase.client
        .from('appointments')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('appointment_date', { ascending: true });

      console.log('Specialist appointments raw data:', data);
      console.log('Specialist appointments error:', error);

      if (error) throw error;

      // Ahora obtenemos los datos relacionados manualmente
      const enrichedData = await Promise.all((data || []).map(async (apt: any) => {
        // Obtener datos del paciente
        const { data: patientData } = await this.supabase.client
          .from('profiles')
          .select('name, last_name')
          .eq('id', apt.patient_id)
          .single();

        // Obtener datos de la especialidad
        const { data: specialtyData } = await this.supabase.client
          .from('specialties')
          .select('name')
          .eq('id', apt.specialty_id)
          .single();

        // Obtener datos del estado
        const { data: statusData } = await this.supabase.client
          .from('appointment_statuses')
          .select('status_name')
          .eq('id', apt.status_id)
          .single();

        // Obtener historia clínica si existe
        const { data: medicalHistory } = await this.supabase.client
          .from('medical_history')
          .select('*')
          .eq('appointment_id', apt.id)
          .single();

        return {
          ...apt,
          patient_name: patientData?.name,
          patient_last_name: patientData?.last_name,
          specialty_name: specialtyData?.name,
          status_name: statusData?.status_name,
          medical_history: medicalHistory || null
        };
      }));

      console.log('Enriched appointments:', enrichedData);
      return enrichedData;
    } catch (error) {
      console.error('Error getting specialist appointments:', error);
      throw error;
    }
  }

  /**
   * Aceptar turno (especialista)
   */
  async acceptAppointment(appointmentId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('appointments')
        .update({ status_id: 2 }) // Aceptado
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error accepting appointment:', error);
      throw error;
    }
  }

  /**
   * Rechazar turno (especialista)
   */
  async rejectAppointment(appointmentId: string, reason: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('appointments')
        .update({
          status_id: 3, // Rechazado
          rejection_reason: reason
        })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      throw error;
    }
  }

  /**
   * Cancelar turno (especialista)
   */
  async cancelAppointmentAsSpecialist(appointmentId: string, reason: string, specialistId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('appointments')
        .update({
          status_id: 5, // Cancelado
          cancellation_reason: reason
        })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Finalizar turno (especialista)
   */
  async completeAppointment(appointmentId: string, review: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('appointments')
        .update({
          status_id: 4, // Realizado
          specialist_review: review
        })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  }

  // ==================== ADMINISTRADORES ====================

  /**
   * Obtener todos los turnos (admin)
   */
  async getAllAppointments(): Promise<Appointment[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Obtener datos relacionados manualmente para cada turno
      const enrichedData = await Promise.all((data || []).map(async (apt: any) => {
        // Obtener datos del paciente
        const { data: patientData } = await this.supabase.client
          .from('profiles')
          .select('name, last_name')
          .eq('id', apt.patient_id)
          .single();

        // Obtener datos del especialista
        const { data: specialistData } = await this.supabase.client
          .from('profiles')
          .select('name, last_name')
          .eq('id', apt.specialist_id)
          .single();

        // Obtener datos de la especialidad
        const { data: specialtyData } = await this.supabase.client
          .from('specialties')
          .select('name')
          .eq('id', apt.specialty_id)
          .single();

        // Obtener datos del estado
        const { data: statusData } = await this.supabase.client
          .from('appointment_statuses')
          .select('status_name')
          .eq('id', apt.status_id)
          .single();

        return {
          ...apt,
          patient_name: patientData?.name,
          patient_last_name: patientData?.last_name,
          specialist_name: specialistData?.name,
          specialist_last_name: specialistData?.last_name,
          specialty_name: specialtyData?.name,
          status_name: statusData?.status_name
        };
      }));

      return enrichedData;
    } catch (error) {
      console.error('Error getting all appointments:', error);
      throw error;
    }
  }

  /**
   * Cancelar turno (admin)
   */
  async cancelAppointmentAsAdmin(appointmentId: string, reason: string, adminId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('appointments')
        .update({
          status_id: 5, // Cancelado
          cancellation_reason: reason
        })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling appointment (admin):', error);
      throw error;
    }
  }

  /**
   * Crear turno (paciente o admin)
   */
  async createAppointment(appointment: Partial<Appointment>): Promise<string> {
    try {
      // Separar fecha y hora del appointment_date si viene como ISO string
      let appointmentDate: string;
      let appointmentTime: string;
      
      if (appointment.appointment_date) {
        const dateObj = new Date(appointment.appointment_date);
        appointmentDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
        appointmentTime = dateObj.toTimeString().split(' ')[0]; // HH:MM:SS
      } else {
        throw new Error('Appointment date is required');
      }

      const { data, error } = await this.supabase.client
        .from('appointments')
        .insert([{
          patient_id: appointment.patient_id,
          specialist_id: appointment.specialist_id,
          specialty_id: appointment.specialty_id,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status_id: 1
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error creating appointment:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      return data.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Obtener un turno específico
   */
  async getAppointment(id: string): Promise<Appointment | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('appointments')
        .select(`
          *,
          patient:profiles!patient_id(name, last_name),
          specialist:profiles!specialist_id(name, last_name),
          specialty:specialties(name),
          status:appointment_statuses(status_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        ...data,
        patient_name: data.patient?.name,
        patient_last_name: data.patient?.last_name,
        specialist_name: data.specialist?.name,
        specialist_last_name: data.specialist?.last_name,
        specialty_name: data.specialty?.name,
        status_name: data.status?.status_name
      };
    } catch (error) {
      console.error('Error getting appointment:', error);
      return null;
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Verificar si un slot está disponible
   */
  async isSlotAvailable(specialistId: string, appointmentDate: string, durationMinutes: number = 30): Promise<boolean> {
    try {
      const requestedDate = new Date(appointmentDate);
      const requestedEnd = new Date(requestedDate.getTime() + durationMinutes * 60000);

      const { data, error } = await this.supabase.client
        .from('appointments')
        .select('appointment_date, duration_minutes')
        .eq('specialist_id', specialistId)
        .in('status_id', [1, 2]); // Pendiente o Aceptado

      if (error) throw error;

      if (!data || data.length === 0) return true;

      for (const apt of data) {
        const aptStart = new Date(apt.appointment_date);
        const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes || 30) * 60000);

        // Verificar superposición
        if (requestedDate < aptEnd && requestedEnd > aptStart) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  }

  // ==================== DISPONIBILIDAD ====================

  /**
   * Obtener horarios de un especialista
   */
  async getSpecialistAvailability(specialistId: string): Promise<SpecialistAvailability[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('specialist_availability')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting availability:', error);
      throw error;
    }
  }

  /**
   * Guardar disponibilidad de especialista
   */
  async saveAvailability(availability: Partial<SpecialistAvailability>): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('specialist_availability')
        .insert([availability]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving availability:', error);
      throw error;
    }
  }

  /**
   * Eliminar disponibilidad
   */
  async deleteAvailability(availabilityId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('specialist_availability')
        .delete()
        .eq('id', availabilityId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting availability:', error);
      throw error;
    }
  }
}
