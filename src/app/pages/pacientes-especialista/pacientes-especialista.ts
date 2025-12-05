import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { MedicalHistoryService } from '../../services/medical-history.service';
import { MessageService } from '../../services/message.service';
import { MedicalHistoryRecord } from '../../services/medical-history.service';
import { SupabaseService } from '../../services/supabase.service';
import { fadeIn, zoomIn } from '../../animations';

interface Patient {
  id: string;
  name: string;
  last_name: string;
  email: string;
  dni?: string;
  age?: number;
  profile_image_url?: string;
}

@Component({
  selector: 'app-pacientes-especialista',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pacientes-especialista.html',
  styleUrls: ['./pacientes-especialista.scss'],
  animations: [fadeIn, zoomIn]
})
export class PacientesEspecialistaComponent implements OnInit {
  patients: Patient[] = [];
  selectedPatient: Patient | null = null;
  patientHistory: MedicalHistoryRecord[] = [];
  selectedRecord: MedicalHistoryRecord | null = null;

  loading = true;
  loadingHistory = false;
  showHistoryModal = false;
  showDetailModal = false;

  currentSpecialistId: string = '';

  constructor(
    private authService: AuthService,
    private medicalHistoryService: MedicalHistoryService,
    private messageService: MessageService,
    private supabase: SupabaseService
  ) {}

  async ngOnInit() {
    await this.loadPatients();
  }

  async loadPatients() {
    try {
      this.loading = true;
      const sessionUser = this.authService.currentUser();
      
      if (!sessionUser) {
        this.messageService.showError('Acceso denegado');
        return;
      }

      this.currentSpecialistId = sessionUser.uid;
      
      console.log('🔍 Cargando pacientes para especialista:', sessionUser.uid);
      
      // Get unique patient IDs from medical history
      const { data: historyData, error: historyError } = await this.supabase.client
        .from('medical_history')
        .select('patient_id')
        .eq('specialist_id', sessionUser.uid);
      
      console.log('📋 Medical history data:', historyData);
      console.log('❌ Medical history error:', historyError);
      
      if (historyError) {
        console.error('Error fetching medical history:', historyError);
        throw historyError;
      }
      
      // Get unique patient IDs
      const uniquePatientIds = [...new Set(historyData?.map((h: any) => h.patient_id) || [])];
      
      console.log('👥 Unique patient IDs:', uniquePatientIds);
      
      if (uniquePatientIds.length === 0) {
        console.log('⚠️ No patients found');
        this.patients = [];
        return;
      }
      
      // Get complete patient data from profiles
      const { data: patientsData, error: patientsError } = await this.supabase.client
        .from('profiles')
        .select('id, name, last_name, email, dni, age, profile_image_url')
        .in('id', uniquePatientIds);
      
      console.log('✅ Patients data from DB:', patientsData);
      console.log('❌ Patients error:', patientsError);
      
      console.log('✅ Patients data from DB:', patientsData);
      console.log('❌ Patients error:', patientsError);
      
      if (patientsError) {
        console.error('Error fetching patients:', patientsError);
        throw patientsError;
      }
      
      console.log('Patients data from DB:', patientsData);
      
      this.patients = (patientsData || []).map((p: any) => {
        console.log('🔄 Processing patient:', {
          id: p.id,
          name: p.name,
          last_name: p.last_name,
          email: p.email,
          profile_image_url: p.profile_image_url
        });
        
        return {
          id: p.id,
          name: p.name || 'Sin nombre',
          last_name: p.last_name || '',
          email: p.email || 'No registrado',
          dni: p.dni,
          age: p.age,
          profile_image_url: p.profile_image_url
        };
      });
      
      console.log('✨ Final processed patients:', this.patients);
      
    } catch (error: any) {
      console.error('💥 Error loading patients:', error);
      this.messageService.showError('Error al cargar la lista de pacientes');
    } finally {
      this.loading = false;
    }
  }

  async viewPatientHistory(patient: Patient) {
    try {
      this.loadingHistory = true;
      this.selectedPatient = patient;
      this.patientHistory = await this.medicalHistoryService.getPatientHistoryBySpecialist(
        patient.id,
        this.currentSpecialistId
      );
      this.showHistoryModal = true;
    } catch (error: any) {
      console.error('Error loading patient history:', error);
      this.messageService.showError('Error al cargar la historia clínica del paciente');
    } finally {
      this.loadingHistory = false;
    }
  }

  closeHistoryModal() {
    this.showHistoryModal = false;
    this.selectedPatient = null;
    this.patientHistory = [];
  }

  openRecordDetail(record: MedicalHistoryRecord) {
    this.selectedRecord = record;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedRecord = null;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDetailDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByPatientId(index: number, patient: Patient): string {
    return patient.id;
  }

  trackByRecordId(index: number, record: MedicalHistoryRecord): string {
    return record.id?.toString() || index.toString();
  }
}
