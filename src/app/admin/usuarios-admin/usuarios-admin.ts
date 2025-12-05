import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { MedicalHistoryService, MedicalHistoryRecord } from '../../services/medical-history.service';
import { MessageService } from '../../services/message.service';
import { ExcelService } from '../../services/excel.service';

interface User {
  id: string;
  name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'specialist' | 'patient';
  dni?: string;
  age?: number;
  is_approved?: boolean;
  created_at?: string;
}

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-admin.html',
  styleUrls: ['./usuarios-admin.scss']
})
export class UsuariosAdminComponent implements OnInit {
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  userHistory: MedicalHistoryRecord[] = [];
  selectedRecord: MedicalHistoryRecord | null = null;

  loading = true;
  loadingHistory = false;
  showHistoryModal = false;
  showDetailModal = false;

  roleFilter: string = 'all';
  searchTerm: string = '';

  constructor(
    private supabase: SupabaseService,
    private medicalHistoryService: MedicalHistoryService,
    private messageService: MessageService,
    private excelService: ExcelService
  ) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.loading = true;
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.allUsers = data || [];
      this.applyFilters();
    } catch (error: any) {
      console.error('Error loading users:', error);
      this.messageService.showError('Error al cargar los usuarios');
    } finally {
      this.loading = false;
    }
  }

  /** Aplica los filtros de rol y búsqueda para mostrar usuarios */
  applyFilters() {
    let filtered = [...this.allUsers];

    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === this.roleFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.last_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.dni?.toLowerCase().includes(term)
      );
    }

    this.filteredUsers = filtered;
  }

  onRoleFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  async viewPatientHistory(user: User) {
    if (user.role !== 'patient') {
      this.messageService.showInfo('Solo los pacientes tienen historia clínica');
      return;
    }

    try {
      this.loadingHistory = true;
      this.selectedUser = user;
      this.userHistory = await this.medicalHistoryService.getPatientHistory(user.id);
      this.showHistoryModal = true;
    } catch (error: any) {
      console.error('Error loading patient history:', error);
      this.messageService.showError('Error al cargar la historia clínica');
    } finally {
      this.loadingHistory = false;
    }
  }

  closeHistoryModal() {
    this.showHistoryModal = false;
    this.selectedUser = null;
    this.userHistory = [];
  }

  openRecordDetail(record: MedicalHistoryRecord) {
    this.selectedRecord = record;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedRecord = null;
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      'admin': 'Administrador',
      'specialist': 'Especialista',
      'patient': 'Paciente'
    };
    return labels[role] || role;
  }

  getRoleIcon(role: string): string {
    const icons: any = {
      'admin': '👑',
      'specialist': '👨‍⚕️',
      'patient': '👤'
    };
    return icons[role] || '❓';
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

  exportToExcel() {
    if (this.allUsers.length === 0) {
      this.messageService.showInfo('No hay usuarios para exportar');
      return;
    }

    try {
      this.excelService.exportUsersToExcel(this.allUsers);
      this.messageService.showSuccess('Excel generado correctamente');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.messageService.showError('Error al generar el archivo Excel');
    }
  }

  async exportPatientAppointments(patient: User) {
    if (patient.role !== 'patient') {
      this.messageService.showInfo('Esta funcionalidad es solo para pacientes');
      return;
    }

    try {
      console.log('📊 Starting export for patient:', patient.name, patient.last_name, patient.id);

      // Get all appointments for this patient
      const { data: appointments, error: appointmentsError } = await this.supabase.client
        .from('appointments')
        .select('*')
        .eq('patient_id', patient.id);

      console.log('📊 Raw appointments:', appointments);
      if (appointments && appointments.length > 0) {
        console.log('📊 First appointment structure:', appointments[0]);
      }

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        this.messageService.showError('Error al obtener los turnos: ' + appointmentsError.message);
        return;
      }

      if (!appointments || appointments.length === 0) {
        this.messageService.showInfo('El paciente no tiene turnos registrados');
        return;
      }

      // Get unique specialty and specialist IDs directly from appointments
      const specialtyIds = [...new Set(appointments.map(a => a.specialty_id).filter(Boolean))];
      const specialistIds = [...new Set(appointments.map(a => a.specialist_id).filter(Boolean))];

      console.log('🏥 Specialty IDs:', specialtyIds);
      console.log('👨‍⚕️ Specialist IDs:', specialistIds);

      // Get specialties
      const { data: specialties } = await this.supabase.client
        .from('specialties')
        .select('id, name')
        .in('id', specialtyIds);

      console.log('🏥 Specialties:', specialties);

      // Get specialists
      const { data: specialists } = await this.supabase.client
        .from('profiles')
        .select('id, name, last_name')
        .in('id', specialistIds);

      console.log('👨‍⚕️ Specialists:', specialists);

      // Create lookup maps
      const specialtyMap = new Map(specialties?.map(s => [s.id, s.name]) || []);
      const specialistMap = new Map(specialists?.map(s => [s.id, s]) || []);

      // Transform appointments with full data
      const transformedAppointments = appointments.map((apt: any) => {
        const specialtyName = specialtyMap.get(apt.specialty_id);
        const specialist = specialistMap.get(apt.specialist_id);

        return {
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          specialty_name: specialtyName || 'N/A',
          specialist_name: specialist?.name || 'N/A',
          specialist_last_name: specialist?.last_name || '',
          status_id: apt.status_id,
          duration_minutes: apt.duration_minutes,
          comment: apt.specialist_review || apt.patient_feedback || 'Sin comentarios',
          rating: apt.patient_rating || null
        };
      });

      // Sort by date
      transformedAppointments.sort((a, b) => {
        return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
      });

      console.log('✅ Final transformed appointments:', transformedAppointments);

      // Export to Excel
      this.excelService.exportPatientAppointmentsToExcel(
        patient.name,
        patient.last_name,
        transformedAppointments
      );

      this.messageService.showSuccess('Excel de turnos generado correctamente');
    } catch (error: any) {
      console.error('💥 Error exporting patient appointments:', error);
      this.messageService.showError('Error al generar el archivo Excel de turnos');
    }
  }

  getStatusName(statusId: number): string {
    const statuses: { [key: number]: string } = {
      1: 'Pendiente',
      2: 'Aceptado',
      3: 'Rechazado',
      4: 'Realizado',
      5: 'Cancelado'
    };
    return statuses[statusId] || 'Desconocido';
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  trackByRecordId(index: number, record: MedicalHistoryRecord): string {
    return record.id?.toString() || index.toString();
  }
}
