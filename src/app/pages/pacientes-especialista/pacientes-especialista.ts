import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { MedicalHistoryService } from '../../services/medical-history.service';
import { MessageService } from '../../services/message.service';
import { MedicalHistoryRecord } from '../../services/medical-history.service';
import { fadeIn, zoomIn } from '../../animations';

interface Patient {
  id: string;
  name: string;
  last_name: string;
  email: string;
  dni?: string;
  age?: number;
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
    private messageService: MessageService
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
      this.patients = await this.medicalHistoryService.getSpecialistPatients(sessionUser.uid);
    } catch (error: any) {
      console.error('Error loading patients:', error);
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
