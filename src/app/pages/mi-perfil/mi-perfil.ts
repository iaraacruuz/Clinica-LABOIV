import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { MessageService } from '../../services/message.service';
import { AuthService, UserProfileData } from '../../services/auth';
import { MedicalHistoryService, MedicalHistoryRecord } from '../../services/medical-history.service';
import { PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-perfil.html',
  styleUrls: ['./mi-perfil.scss']
})
export class MiPerfilComponent {
  currentUser: UserProfileData | null = null;
  availabilities: any[] = [];
  specialties: any[] = [];
  userSpecialties: any[] = []; // Especialidades del usuario
  isLoading = true;
  isEditingSchedules = false;
  loadingSchedules = false;
  isEditingSpecialties = false;
  selectedNewSpecialty: number | null = null;
  customSpecialtyName = '';
  
  userImages: string[] = [];
  medicalHistory: MedicalHistoryRecord[] = [];
  filteredMedicalHistory: MedicalHistoryRecord[] = [];
  loadingMedicalHistory = false;
  showMedicalHistoryModal = false;
  selectedRecord: MedicalHistoryRecord | null = null;
  selectedSpecialistFilter: string = 'all';
  availableSpecialists: { id: string; name: string }[] = [];

  weekDays = [
    { id: 1, name: 'Lunes', key: 'monday' },
    { id: 2, name: 'Martes', key: 'tuesday' },
    { id: 3, name: 'Miércoles', key: 'wednesday' },
    { id: 4, name: 'Jueves', key: 'thursday' },
    { id: 5, name: 'Viernes', key: 'friday' },
    { id: 6, name: 'Sábado (8-14)', key: 'saturday' }
  ];

  clinicHours = [
    { value: '08:00', label: '08:00' },
    { value: '08:30', label: '08:30' },
    { value: '09:00', label: '09:00' },
    { value: '09:30', label: '09:30' },
    { value: '10:00', label: '10:00' },
    { value: '10:30', label: '10:30' },
    { value: '11:00', label: '11:00' },
    { value: '11:30', label: '11:30' },
    { value: '12:00', label: '12:00' },
    { value: '12:30', label: '12:30' },
    { value: '13:00', label: '13:00' },
    { value: '13:30', label: '13:30' },
    { value: '14:00', label: '14:00' },
    { value: '14:30', label: '14:30' },
    { value: '15:00', label: '15:00' },
    { value: '15:30', label: '15:30' },
    { value: '16:00', label: '16:00' },
    { value: '16:30', label: '16:30' },
    { value: '17:00', label: '17:00' },
    { value: '17:30', label: '17:30' },
    { value: '18:00', label: '18:00' },
    { value: '18:30', label: '18:30' },
    { value: '19:00', label: '19:00' }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private messageService: MessageService,
    private authService: AuthService,
    private medicalHistoryService: MedicalHistoryService,
    private pdfService: PdfService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  /** Carga el perfil del usuario actual y sus datos relacionados según su rol */
  async loadProfile() {
    try {
      this.isLoading = true;

      const sessionUser = this.authService.currentUser();
      
      if (!sessionUser) {
        this.messageService.showError('No se pudo obtener la información del usuario');
        return;
      }

      this.currentUser = await this.supabaseService.getUserData(sessionUser.uid);
      
      if (!this.currentUser) {
        this.messageService.showError('No se pudo obtener la información del usuario');
        return;
      }

      if (this.currentUser.role === 'specialist') {
        await this.loadSpecialties();
        await this.loadUserSpecialties();
        await this.loadAvailabilities();
      }
      
      if (this.currentUser.role === 'patient') {
        await this.loadMedicalHistory();
      }
      
      await this.loadUserImages();

    } catch (error: any) {
      console.error('Error loading profile:', error);
      this.messageService.showError('Error al cargar el perfil: ' + (error.message || 'Error desconocido'));
    } finally {
      this.isLoading = false;
    }
  }

  async loadSpecialties() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('specialties')
        .select('*')
        .order('name');

      if (error) throw error;
      this.specialties = data || [];
    } catch (error: any) {
      console.error('Error loading specialties:', error);
      this.messageService.showError('Error al cargar especialidades: ' + error.message);
    }
  }

  async loadUserSpecialties() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('specialists_data')
        .select(`
          *,
          specialties(id, name)
        `)
        .eq('user_id', this.currentUser!.id);

      if (error) throw error;
      this.userSpecialties = data || [];
    } catch (error: any) {
      console.error('Error loading user specialties:', error);
      this.messageService.showError('Error al cargar tus especialidades: ' + error.message);
    }
  }

  async loadAvailabilities() {
    try {
      this.loadingSchedules = true;
      
      const { data, error } = await this.supabaseService.client
        .from('specialist_availability')
        .select(`
          *,
          specialties!inner(name)
        `)
        .eq('specialist_id', this.currentUser!.id)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      this.availabilities = data || [];
    } catch (error: any) {
      console.error('Error loading availabilities:', error);
      this.messageService.showError('Error al cargar horarios: ' + error.message);
    } finally {
      this.loadingSchedules = false;
    }
  }

  /** Carga las imágenes de perfil del usuario desde la base de datos */
  async loadUserImages() {
    try {
      if (!this.currentUser) return;
      
      this.userImages = [];
      
      if (this.currentUser.profile_image_url) {
        this.userImages.push(this.currentUser.profile_image_url);
      }
      
      const additionalImages = await this.supabaseService.getUserImages(this.currentUser.id);
      if (additionalImages && additionalImages.length > 0) {
        const imageUrls = additionalImages.map((img: any) => img.image_url);
        this.userImages.push(...imageUrls);
      }
    } catch (error: any) {
      console.error('Error loading user images:', error);
    }
  }

  toggleEditSchedules() {
    this.isEditingSchedules = !this.isEditingSchedules;
    if (!this.isEditingSchedules) {
      this.loadAvailabilities();
    }
  }

  // Agrega un nuevo horario de disponibilidad para el especialista
  async addSchedule(specialtyId: string, dayOfWeek: number, startTime: string, endTime: string) {
    try {
      if (!specialtyId || !startTime || !endTime) {
        this.messageService.showWarning('Debe completar todos los campos del horario');
        return;
      }

      if (startTime >= endTime) {
        this.messageService.showWarning('La hora de inicio debe ser menor a la hora de fin');
        return;
      }

      if (dayOfWeek === 0) {
        this.messageService.showWarning('La clínica está cerrada los domingos');
        return;
      }

      const isSaturday = dayOfWeek === 6;
      const maxEndTime = isSaturday ? '14:00' : '19:00';
      
      if (startTime < '08:00') {
        this.messageService.showWarning('La clínica abre a las 08:00');
        return;
      }
      
      if (endTime > maxEndTime) {
        this.messageService.showWarning(
          isSaturday 
            ? 'Los sábados la clínica cierra a las 14:00'
            : 'De lunes a viernes la clínica cierra a las 19:00'
        );
        return;
      }

      const existingOverlap = this.availabilities.find(avail => 
        avail.specialty_id === specialtyId &&
        avail.day_of_week === dayOfWeek &&
        ((startTime >= avail.start_time && startTime < avail.end_time) ||
         (endTime > avail.start_time && endTime <= avail.end_time) ||
         (startTime <= avail.start_time && endTime >= avail.end_time))
      );

      if (existingOverlap) {
        this.messageService.showWarning('Ya existe un horario que se solapa con el seleccionado');
        return;
      }

      const { error } = await this.supabaseService.client
        .from('specialist_availability')
        .insert([{
          specialist_id: this.currentUser!.id,
          specialty_id: specialtyId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime
        }]);

      if (error) throw error;

      this.messageService.showSuccess('Horario agregado correctamente');
      this.loadAvailabilities();
      
    } catch (error: any) {
      console.error('Error adding schedule:', error);
      this.messageService.showError('Error al agregar horario: ' + error.message);
    }
  }

  async deleteSchedule(availabilityId: number) {
    try {
      const { error } = await this.supabaseService.client
        .from('specialist_availability')
        .delete()
        .eq('id', availabilityId);

      if (error) throw error;

      this.messageService.showSuccess('Horario eliminado correctamente');
      this.loadAvailabilities();
      
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      this.messageService.showError('Error al eliminar horario: ' + error.message);
    }
  }

  getDayName(dayOfWeek: number): string {
    const day = this.weekDays.find(d => d.id === dayOfWeek);
    return day ? day.name : 'Día desconocido';
  }

  getSpecialtyName(specialtyId: number): string {
    const specialty = this.specialties.find(s => s.id === specialtyId);
    return specialty ? specialty.name : 'Especialidad desconocida';
  }

  getSchedulesByDay(dayOfWeek: number) {
    return this.availabilities.filter(avail => avail.day_of_week === dayOfWeek);
  }

  onAddScheduleSubmit(form: any) {
    if (form.valid) {
      const formValues = form.value;
      this.addSchedule(
        formValues.specialtyId,
        parseInt(formValues.dayOfWeek),
        formValues.startTime,
        formValues.endTime
      );
      form.resetForm();
    }
  }

  getUserImages(): string[] {
    return this.userImages;
  }

  getFormattedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getRoleIcon(): string {
    switch (this.currentUser?.role) {
      case 'admin': return '👑';
      case 'specialist': return '👨‍⚕️';
      case 'patient': return '👤';
      default: return '❓';
    }
  }

  getRoleName(): string {
    switch (this.currentUser?.role) {
      case 'admin': return 'Administrador';
      case 'specialist': return 'Especialista';
      case 'patient': return 'Paciente';
      default: return 'Usuario';
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  async loadMedicalHistory() {
    if (!this.currentUser) return;
    
    try {
      this.loadingMedicalHistory = true;
      this.medicalHistory = await this.medicalHistoryService.getPatientHistory(this.currentUser.id);
      this.filteredMedicalHistory = [...this.medicalHistory];
      
      const specialistsMap = new Map<string, string>();
      this.medicalHistory.forEach(record => {
        if (record.specialist && record.specialist_id) {
          const fullName = `${record.specialist.name} ${record.specialist.last_name}`;
          specialistsMap.set(record.specialist_id, fullName);
        }
      });
      
      this.availableSpecialists = Array.from(specialistsMap.entries()).map(([id, name]) => ({ id, name }));
    } catch (error: any) {
      console.error('Error loading medical history:', error);
      this.messageService.showError('Error al cargar la historia clínica');
    } finally {
      this.loadingMedicalHistory = false;
    }
  }

  filterMedicalHistoryBySpecialist() {
    if (this.selectedSpecialistFilter === 'all') {
      this.filteredMedicalHistory = [...this.medicalHistory];
    } else {
      this.filteredMedicalHistory = this.medicalHistory.filter(
        record => record.specialist_id === this.selectedSpecialistFilter
      );
    }
  }

  openMedicalHistoryDetail(record: MedicalHistoryRecord) {
    this.selectedRecord = record;
    this.showMedicalHistoryModal = true;
  }

  closeMedicalHistoryModal() {
    this.showMedicalHistoryModal = false;
    this.selectedRecord = null;
  }

  formatMedicalDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  async downloadMedicalHistoryPDF() {
    if (!this.currentUser) {
      this.messageService.showError('No hay datos de usuario disponibles');
      return;
    }

    if (this.medicalHistory.length === 0) {
      this.messageService.showInfo('No hay registros médicos para descargar');
      return;
    }

    try {
      await this.pdfService.generateMedicalHistoryPDF(
        this.currentUser.name,
        this.currentUser.last_name,
        this.currentUser.dni,
        this.currentUser.age,
        this.medicalHistory
      );
      
      this.messageService.showSuccess('PDF generado correctamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.messageService.showError('Error al generar el PDF');
    }
  }

  toggleEditSpecialties() {
    this.isEditingSpecialties = !this.isEditingSpecialties;
    this.selectedNewSpecialty = null;
    this.customSpecialtyName = '';
  }

  getAvailableSpecialties() {
    const userSpecialtyIds = this.userSpecialties.map(us => us.specialties?.id);
    return this.specialties.filter(s => !userSpecialtyIds.includes(s.id));
  }

  async addSpecialty() {
    try {
      if (!this.selectedNewSpecialty && !this.customSpecialtyName.trim()) {
        this.messageService.showWarning('Debe seleccionar o ingresar una especialidad');
        return;
      }

      let specialtyId = this.selectedNewSpecialty;

      if (this.customSpecialtyName.trim()) {
        const customName = this.customSpecialtyName.trim();
        const exists = this.specialties.find(s => s.name.toLowerCase() === customName.toLowerCase());
        
        if (exists) {
          specialtyId = exists.id;
        } else {
          const { data, error } = await this.supabaseService.client
            .from('specialties')
            .insert([{ name: customName }])
            .select()
            .single();

          if (error) throw error;
          specialtyId = data.id;
          this.specialties.push(data);
        }
      }

      if (!specialtyId) {
        this.messageService.showWarning('Error al obtener el ID de la especialidad');
        return;
      }

      const alreadyHas = this.userSpecialties.find(us => us.specialties?.id === specialtyId);
      if (alreadyHas) {
        this.messageService.showWarning('Ya tienes esta especialidad asociada');
        return;
      }

      const { error } = await this.supabaseService.client
        .from('specialists_data')
        .insert([{
          user_id: this.currentUser!.id,
          specialty_id: specialtyId,
          is_approved: true
        }]);

      if (error) throw error;

      this.messageService.showSuccess('Especialidad agregada correctamente');
      await this.loadUserSpecialties();
      this.selectedNewSpecialty = null;
      this.customSpecialtyName = '';
      this.isEditingSpecialties = false;
    } catch (error: any) {
      console.error('Error adding specialty:', error);
      this.messageService.showError('Error al agregar especialidad: ' + error.message);
    }
  }

  async removeSpecialty(specialistDataId: number) {
    try {
      const confirm = window.confirm('¿Está seguro que desea eliminar esta especialidad? También se eliminarán los horarios asociados.');
      if (!confirm) return;

      const { error } = await this.supabaseService.client
        .from('specialists_data')
        .delete()
        .eq('id', specialistDataId);

      if (error) throw error;

      this.messageService.showSuccess('Especialidad eliminada correctamente');
      await this.loadUserSpecialties();
      await this.loadAvailabilities();
    } catch (error: any) {
      console.error('Error removing specialty:', error);
      this.messageService.showError('Error al eliminar especialidad: ' + error.message);
    }
  }
}
