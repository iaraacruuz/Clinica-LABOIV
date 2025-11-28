import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LoaderService } from '../shared/loader/loader.service';

const SUPABASE_URL = 'https://gewtwxsvecjpjoofgdka.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdld3R3eHN2ZWNqcGpvb2ZnZGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjI5MjAsImV4cCI6MjA3ODAzODkyMH0.GgIhO-Ey-ehJgsFXekxL6_7XshpsDlMQmvOsB_IdwXk';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private loader: LoaderService) {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  get client() {
    return this.supabase;
  }

  // ================= AUTH =================

  async register(email: string, password: string, metadata?: any) {
    this.loader.show();
    try {
      // Accept optional metadata as extra args via an options object
      // Callers can pass an object like: register(email, password, { role: 'specialist' })
      // which will be forwarded to Supabase as user metadata.
      const args: any = { email, password };
      // If caller provided `metadata`, forward it as user metadata
      const meta = metadata ?? (arguments as any)[2];
      if (meta && typeof meta === 'object') {
        // supabase-js signUp accepts metadata via the `options.data` field
        const response = await this.supabase.auth.signUp({ email, password, options: { data: meta } } as any);
        return response;
      }
      const response = await this.supabase.auth.signUp({ email, password } as any);
      return response;
    } finally {
      this.loader.hide();
    }
  }

  async login(email: string, password: string) {
    this.loader.show();
    try {
      const maxRetries = 3;
      let attempt = 0;
      while (true) {
        try {
          const response = await this.supabase.auth.signInWithPassword({ email, password });
          return response;
        } catch (err: any) {
          const msg = (err && err.message) ? err.message : String(err);
          // Retry on NavigatorLockAcquireTimeoutError which can happen in browsers
          if (msg.includes('NavigatorLockAcquireTimeoutError') && attempt < maxRetries) {
            attempt++;
            // small backoff
            await new Promise(r => setTimeout(r, 200 * attempt));
            continue;
          }
          throw err;
        }
      }
    } finally {
      this.loader.hide();
    }
  }

  async logout() {
    this.loader.show();
    const response = await this.supabase.auth.signOut();
    this.loader.hide();
    return response;
  }

  async getSession() {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async getCurrentUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  // ================= PROFILES =================

  async createProfile(data: any) {
    this.loader.show();
    const response = await this.supabase.from('profiles').insert(data);
    this.loader.hide();
    return response;
  }

  async getProfile(id: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error && (error as any).code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data || null;
  }

  // New method: get profile without async role-specific data (faster, less concurrent)
  async getProfileBasic(id: string) {
    return this.getProfile(id);
  }

  async updateProfile(id: string, data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('profiles')
      .update(data)
      .eq('id', id);
    this.loader.hide();
    return response;
  }

  async getAllProfiles(role?: string) {
    let query = this.supabase.from('profiles').select('*');
    if (role) {
      query = query.eq('role', role);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // ================= PATIENTS DATA =================

  async createPatientData(data: any) {
    this.loader.show();
    const response = await this.supabase.from('patients_data').insert(data);
    this.loader.hide();
    return response;
  }

  async getPatientData(userId: string) {
    const { data, error } = await this.supabase
      .from('patients_data')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async updatePatientData(userId: string, data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('patients_data')
      .update(data)
      .eq('user_id', userId);
    this.loader.hide();
    return response;
  }

  // ================= SPECIALISTS DATA =================

  async createSpecialistData(data: any) {
    this.loader.show();
    const response = await this.supabase.from('specialists_data').insert(data);
    this.loader.hide();
    return response;
  }

  async getSpecialistData(userId: string) {
    const { data, error } = await this.supabase
      .from('specialists_data')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async updateSpecialistData(userId: string, data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('specialists_data')
      .update(data)
      .eq('user_id', userId);
    this.loader.hide();
    return response;
  }

  async getAllSpecialists(isApproved?: boolean) {
    let query = this.supabase.from('specialists_data').select('*');
    if (isApproved !== undefined) {
      query = query.eq('is_approved', isApproved);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // ================= SPECIALTIES =================

  async getSpecialties() {
    const { data, error } = await this.supabase
      .from('specialties')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  }

  async createSpecialty(name: string, description?: string) {
    this.loader.show();
    const { data, error } = await this.supabase
      .from('specialties')
      .insert({ name, description })
      .select();
    this.loader.hide();
    if (error) throw error;
    return data;
  }

  // ================= APPOINTMENTS =================

  async createAppointment(data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('appointments')
      .insert(data)
      .select();
    this.loader.hide();
    return response;
  }

  async getAppointment(id: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*,appointment_statuses:status_id(status_name),specialties:specialty_id(name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async getPatientAppointments(patientId: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*,appointment_statuses:status_id(status_name),specialties:specialty_id(name)')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getSpecialistAppointments(specialistId: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*,appointment_statuses:status_id(status_name),specialties:specialty_id(name)')
      .eq('specialist_id', specialistId)
      .order('appointment_date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getAllAppointments() {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*,appointment_statuses:status_id(status_name),specialties:specialty_id(name)')
      .order('appointment_date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async updateAppointment(id: string, data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('appointments')
      .update(data)
      .eq('id', id);
    this.loader.hide();
    return response;
  }

  async cancelAppointment(id: string, reason: string) {
    this.loader.show();
    const response = await this.supabase
      .from('appointments')
      .update({ status_id: 5, cancellation_reason: reason })
      .eq('id', id);
    this.loader.hide();
    return response;
  }

  // ================= APPOINTMENT COMMENTS =================

  async createAppointmentComment(data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('appointment_comments')
      .insert(data)
      .select();
    this.loader.hide();
    return response;
  }

  async getAppointmentComments(appointmentId: string) {
    const { data, error } = await this.supabase
      .from('appointment_comments')
      .select('*')
      .eq('appointment_id', appointmentId);
    if (error) throw error;
    return data;
  }

  // ================= APPOINTMENT STATUSES =================

  async getAppointmentStatuses() {
    const { data, error } = await this.supabase
      .from('appointment_statuses')
      .select('*');
    if (error) throw error;
    return data;
  }

  // ================= MEDICAL HISTORY =================

  async createMedicalHistory(data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('medical_history')
      .insert(data)
      .select();
    this.loader.hide();
    return response;
  }

  async getMedicalHistory(appointmentId: string) {
    const { data, error } = await this.supabase
      .from('medical_history')
      .select('*,medical_history_fields(*)')
      .eq('appointment_id', appointmentId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getMedicalHistoryByPatient(patientId: string) {
    const { data, error } = await this.supabase
      .from('medical_history')
      .select('*,medical_history_fields(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async updateMedicalHistory(id: string, data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('medical_history')
      .update(data)
      .eq('id', id);
    this.loader.hide();
    return response;
  }

  // ================= MEDICAL HISTORY FIELDS =================

  async createMedicalHistoryField(data: any) {
    const response = await this.supabase
      .from('medical_history_fields')
      .insert(data)
      .select();
    return response;
  }

  async getMedicalHistoryFields(medicalHistoryId: string) {
    const { data, error } = await this.supabase
      .from('medical_history_fields')
      .select('*')
      .eq('medical_history_id', medicalHistoryId);
    if (error) throw error;
    return data;
  }

  async deleteMedicalHistoryField(id: string) {
    const response = await this.supabase
      .from('medical_history_fields')
      .delete()
      .eq('id', id);
    return response;
  }

  // ================= SPECIALIST AVAILABILITY =================

  async createSpecialistAvailability(data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('specialist_availability')
      .insert(data)
      .select();
    this.loader.hide();
    return response;
  }

  async getSpecialistAvailability(specialistId: string) {
    const { data, error } = await this.supabase
      .from('specialist_availability')
      .select('*')
      .eq('specialist_id', specialistId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true });
    if (error) throw error;
    return data;
  }

  async updateSpecialistAvailability(id: string, data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('specialist_availability')
      .update(data)
      .eq('id', id);
    this.loader.hide();
    return response;
  }

  async deleteSpecialistAvailability(id: string) {
    this.loader.show();
    const response = await this.supabase
      .from('specialist_availability')
      .delete()
      .eq('id', id);
    this.loader.hide();
    return response;
  }

  // ================= APPOINTMENT SURVEYS =================

  async createAppointmentSurvey(data: any) {
    this.loader.show();
    const response = await this.supabase
      .from('appointment_surveys')
      .insert(data)
      .select();
    this.loader.hide();
    return response;
  }

  async getAppointmentSurvey(appointmentId: string) {
    const { data, error } = await this.supabase
      .from('appointment_surveys')
      .select('*,survey_responses(*)')
      .eq('appointment_id', appointmentId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getSurveysBySpecialist(specialistId: string) {
    const { data, error } = await this.supabase
      .from('appointment_surveys')
      .select('*')
      .eq('specialist_id', specialistId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // ================= SURVEY RESPONSES =================

  async createSurveyResponse(data: any) {
    const response = await this.supabase
      .from('survey_responses')
      .insert(data)
      .select();
    return response;
  }

  async getSurveyResponses(surveyId: string) {
    const { data, error } = await this.supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId);
    if (error) throw error;
    return data;
  }

  // ================= SYSTEM LOGS =================

  async createSystemLog(data: any) {
    const response = await this.supabase
      .from('system_logs')
      .insert(data);
    return response;
  }

  async getSystemLogs(userId?: string, limit: number = 100) {
    let query = this.supabase.from('system_logs').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query
      .order('login_timestamp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }

  async updateSystemLog(id: string, data: any) {
    const response = await this.supabase
      .from('system_logs')
      .update(data)
      .eq('id', id);
    return response;
  }

  // ================= USER IMAGES =================

  async createUserImage(data: any) {
    const response = await this.supabase
      .from('user_images')
      .insert(data)
      .select();
    return response;
  }

  async getUserImages(userId: string) {
    const { data, error } = await this.supabase
      .from('user_images')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  async deleteUserImage(id: string) {
    const response = await this.supabase
      .from('user_images')
      .delete()
      .eq('id', id);
    return response;
  }

  // ================= APPROVE/DISAPPROVE SPECIALIST =================

  async approveSpecialist(userId: string, isApproved: boolean) {
    this.loader.show();
    const { error } = await this.supabase
      .from('profiles')
      .update({ is_approved: isApproved })
      .eq('id', userId);
    this.loader.hide();
    return { error };
  }

  // ================= USER PROFILE HELPERS =================

  // Método compatible con AuthService.getUserData
  // IMPORTANT: Queries are done SEQUENTIALLY, not in parallel, to avoid lock contention
  async getUserData(uid: string): Promise<any | null> {
    try {
      // Fetch base profile
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error fetching base profile:', error);
        return null;
      }
      if (!profile) return null;

      // Prepare result with base fields
      const result: any = {
        id: profile.id,
        role: profile.role,
        email: profile.email,
        name: profile.name,
        last_name: profile.last_name,
        age: profile.age,
        dni: profile.dni,
        is_approved: profile.is_approved,
        profile_image_url: profile.profile_image_url
      };

      // Fetch role-specific data SEQUENTIALLY (not in parallel)
      try {
        if (profile.role === 'patient') {
          // First, check if patient data exists
          const { data: patientData } = await this.supabase
            .from('patients_data')
            .select('*')
            .eq('user_id', uid)
            .maybeSingle();
          result.obra_social = patientData?.health_insurance || null;
        } else if (profile.role === 'specialist') {
          // Then, check if specialist data exists
          const { data: specData } = await this.supabase
            .from('specialists_data')
            .select('*,specialties(name)')
            .eq('user_id', uid)
            .maybeSingle();
          if (specData) {
            result.especialidad = specData.specialty_id ? (specData.specialties?.name || null) : null;
          } else {
            result.especialidad = null;
          }
        }
      } catch (e) {
        console.warn('Error fetching role-specific data:', e);
        result.obra_social = result.obra_social ?? null;
        result.especialidad = result.especialidad ?? null;
      }

      return result;
    } catch (e) {
      console.error('Unexpected error in getUserData:', e);
      return null;
    }
  }

  // ================= STORAGE =================

  async uploadProfileImage(file: File, userId: string) {
    const filePath = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await this.supabase.storage
      .from('perfiles')
      .upload(filePath, file);
    if (error) throw error;

    const { data } = this.supabase.storage
      .from('perfiles')
      .getPublicUrl(filePath);
    return data.publicUrl;
  }

  async uploadReport(file: File, adminId: string, reportName: string) {
    const filePath = `${adminId}/${reportName}`;
    const { error } = await this.supabase.storage
      .from('reports')
      .upload(filePath, file);
    if (error) throw error;

    const { data } = this.supabase.storage
      .from('reports')
      .getPublicUrl(filePath);
    return data.publicUrl;
  }

  async uploadMedicalRecord(file: File, patientId: string, fileName: string) {
    const filePath = `${patientId}/${fileName}`;
    const { error } = await this.supabase.storage
      .from('medical_records')
      .upload(filePath, file);
    if (error) throw error;

    const { data } = this.supabase.storage
      .from('medical_records')
      .getPublicUrl(filePath);
    return data.publicUrl;
  }

  async deleteFile(bucket: string, path: string) {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);
    if (error) throw error;
    return true;
  }
}
