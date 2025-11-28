import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AdditionalField {
  key: string;
  value: string;
}

export interface MedicalHistoryRecord {
  id?: number;
  patient_id: string;
  specialist_id: string;
  appointment_id?: string | null; // UUID
  height?: number | null;
  weight?: number | null;
  temperature?: number | null;
  pressure?: string | null;
  diagnosis: string;
  observations?: string | null;
  additional_fields?: AdditionalField[];
  created_at?: string;
  updated_at?: string;
  patient?: any;
  specialist?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalHistoryService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Crea un nuevo registro de historia clínica
   */
  async createRecord(record: MedicalHistoryRecord): Promise<any> {
    const { data, error } = await this.supabaseService.client
      .from('medical_history')
      .insert([{
        patient_id: record.patient_id,
        specialist_id: record.specialist_id,
        appointment_id: record.appointment_id,
        height: record.height,
        weight: record.weight,
        temperature: record.temperature,
        pressure: record.pressure,
        diagnosis: record.diagnosis,
        observations: record.observations,
        additional_fields: record.additional_fields || []
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obtiene la historia clínica completa de un paciente
   */
  async getPatientHistory(patientId: string): Promise<MedicalHistoryRecord[]> {
    const { data, error } = await this.supabaseService.client
      .from('medical_history')
      .select(`
        *,
        patient:profiles!medical_history_patient_id_fkey(id, name, last_name, dni, age),
        specialist:profiles!medical_history_specialist_id_fkey(id, name, last_name)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene todos los pacientes atendidos por un especialista
   */
  async getSpecialistPatients(specialistId: string): Promise<any[]> {
    const { data, error } = await this.supabaseService.client
      .from('medical_history')
      .select(`
        patient_id,
        patient:profiles!medical_history_patient_id_fkey(id, name, last_name, dni, age, profile_image_url)
      `)
      .eq('specialist_id', specialistId);

    if (error) throw error;

    const uniquePatients = new Map();
    (data || []).forEach((record: any) => {
      if (!uniquePatients.has(record.patient_id) && record.patient) {
        uniquePatients.set(record.patient_id, record.patient);
      }
    });

    return Array.from(uniquePatients.values());
  }

  /**
   * Obtiene el historial de un paciente visto por un especialista específico
   */
  async getPatientHistoryBySpecialist(patientId: string, specialistId: string): Promise<MedicalHistoryRecord[]> {
    const { data, error } = await this.supabaseService.client
      .from('medical_history')
      .select(`
        *,
        patient:profiles!medical_history_patient_id_fkey(id, name, last_name, dni, age),
        specialist:profiles!medical_history_specialist_id_fkey(id, name, last_name)
      `)
      .eq('patient_id', patientId)
      .eq('specialist_id', specialistId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Actualiza un registro existente
   */
  async updateRecord(id: number, updates: Partial<MedicalHistoryRecord>): Promise<any> {
    const { data, error } = await this.supabaseService.client
      .from('medical_history')
      .update({
        height: updates.height,
        weight: updates.weight,
        temperature: updates.temperature,
        pressure: updates.pressure,
        diagnosis: updates.diagnosis,
        observations: updates.observations,
        additional_fields: updates.additional_fields
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obtiene un registro específico por ID
   */
  async getRecordById(id: number): Promise<MedicalHistoryRecord | null> {
    const { data, error } = await this.supabaseService.client
      .from('medical_history')
      .select(`
        *,
        patient:profiles!medical_history_patient_id_fkey(id, name, last_name, dni, age),
        specialist:profiles!medical_history_specialist_id_fkey(id, name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obtiene todos los registros (solo para admin)
   */
  async getAllRecords(): Promise<MedicalHistoryRecord[]> {
    const { data, error } = await this.supabaseService.client
      .from('medical_history')
      .select(`
        *,
        patient:profiles!medical_history_patient_id_fkey(id, name, last_name, dni, age),
        specialist:profiles!medical_history_specialist_id_fkey(id, name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
