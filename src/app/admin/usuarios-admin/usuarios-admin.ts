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

  // Filters
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

  applyFilters() {
    let filtered = [...this.allUsers];

    // Role filter
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === this.roleFilter);
    }

    // Search filter
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

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  trackByRecordId(index: number, record: MedicalHistoryRecord): string {
    return record.id?.toString() || index.toString();
  }
}
