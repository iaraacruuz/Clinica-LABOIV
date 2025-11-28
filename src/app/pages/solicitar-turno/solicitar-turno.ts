import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../services/appointments.service';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth';
import { MessageService } from '../../services/message.service';

interface Specialty {
  id: number;
  name: string;
}

interface Specialist {
  id: string;
  name: string;
  last_name: string;
  specialties: string[];
}

interface TimeSlot {
  date: Date;
  time: string;
  available: boolean;
  formattedDate: string;
  dayName: string;
}

@Component({
  selector: 'app-solicitar-turno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitar-turno.html',
  styleUrls: ['./solicitar-turno.scss']
})
export class SolicitarTurnoComponent implements OnInit {
  currentUser: any = null;
  isAdmin = false;
  
  selectedSpecialtyId: number | null = null;
  selectedSpecialistId: string = '';
  selectedPatientId: string = '';
  selectedTimeSlot: TimeSlot | null = null;
  
  specialties: Specialty[] = [];
  specialists: Specialist[] = [];
  patients: any[] = [];
  availableSlots: TimeSlot[] = [];
  
  loading = false;
  loadingSlots = false;
  
  readonly CLINIC_HOURS = {
    weekdays: { start: 8, end: 19 },
    saturday: { start: 8, end: 14 },
    sunday: null
  };
  
  readonly SLOT_DURATION = 30;
  readonly DAYS_AHEAD = 15;

  constructor(
    private appointmentsService: AppointmentsService,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.loadInitialData();
  }

  // Carga datos iniciales del componente
  async loadInitialData() {
    try {
      this.loading = true;
      
      const user = this.authService.currentUser();
      if (user) {
        this.currentUser = await this.supabaseService.getUserData(user.uid);
        this.isAdmin = this.currentUser?.role === 'admin';
        
        if (this.currentUser?.role === 'patient') {
          this.selectedPatientId = this.currentUser.id;
        }
      }
      
      await this.loadSpecialties();
      
      if (this.isAdmin) {
        await this.loadPatients();
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.messageService.showError('Error al cargar los datos iniciales');
    } finally {
      this.loading = false;
    }
  }

  async loadSpecialties() {
    try {
      this.specialties = await this.supabaseService.getSpecialties();
    } catch (error) {
      console.error('Error loading specialties:', error);
      this.messageService.showError('Error al cargar las especialidades');
    }
  }

  async loadSpecialists() {
    if (!this.selectedSpecialtyId) {
      this.specialists = [];
      this.availableSlots = [];
      return;
    }

    try {
      this.loadingSlots = true;
      
      const { data, error } = await this.supabaseService.client
        .from('specialist_availability')
        .select(`
          specialist_id,
          profiles!inner(id, name, last_name, is_approved)
        `)
        .eq('specialty_id', this.selectedSpecialtyId)
        .eq('profiles.is_approved', true);

      if (error) throw error;
      
      const uniqueSpecialists = new Map();
      (data || []).forEach((item: any) => {
        if (!uniqueSpecialists.has(item.specialist_id) && this.selectedSpecialtyId) {
          uniqueSpecialists.set(item.specialist_id, {
            id: item.profiles.id,
            name: item.profiles.name,
            last_name: item.profiles.last_name,
            specialties: [this.getSpecialtyName(this.selectedSpecialtyId)]
          });
        }
      });
      
      this.specialists = Array.from(uniqueSpecialists.values());
      
      this.selectedSpecialistId = '';
      this.availableSlots = [];
      
    } catch (error) {
      console.error('Error loading specialists:', error);
      this.messageService.showError('Error al cargar los especialistas');
    } finally {
      this.loadingSlots = false;
    }
  }

  async loadPatients() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('id, name, last_name, dni')
        .eq('role', 'patient')
        .order('last_name');

      if (error) throw error;
      this.patients = data || [];
    } catch (error) {
      console.error('Error loading patients:', error);
      this.messageService.showError('Error al cargar los pacientes');
    }
  }

  async loadAvailableSlots() {
    if (!this.selectedSpecialistId || !this.selectedSpecialtyId) {
      this.availableSlots = [];
      return;
    }

    try {
      this.loadingSlots = true;
      
      const { data: availability, error } = await this.supabaseService.client
        .from('specialist_availability')
        .select('*')
        .eq('specialist_id', this.selectedSpecialistId)
        .eq('specialty_id', this.selectedSpecialtyId)
        .eq('is_active', true);

      if (error) throw error;
      
      if (!availability || availability.length === 0) {
        this.availableSlots = [];
        this.messageService.showWarning('Este especialista no tiene horarios configurados para esta especialidad');
        return;
      }
      
      // Generar slots para los próximos 15 días basados en disponibilidad
      const slots: TimeSlot[] = [];
      const today = new Date();
      
      for (let dayOffset = 0; dayOffset < this.DAYS_AHEAD; dayOffset++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + dayOffset);
        
        const daySlots = await this.generateDaySlotsFromAvailability(currentDate, availability);
        slots.push(...daySlots);
      }
      
      // Verificar disponibilidad de cada slot (si ya está ocupado)
      await this.checkSlotsAvailability(slots);
      
      this.availableSlots = slots.filter(slot => slot.available);
      
    } catch (error) {
      console.error('Error loading available slots:', error);
      this.messageService.showError('Error al cargar los horarios disponibles');
    } finally {
      this.loadingSlots = false;
    }
  }

  private async generateDaySlotsFromAvailability(date: Date, availability: any[]): Promise<TimeSlot[]> {
    const dayOfWeek = date.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const slots: TimeSlot[] = [];
    
    // La clínica está cerrada los domingos
    if (dayOfWeek === 0) return slots;
    
    // Filtrar disponibilidad para este día de la semana
    const dayAvailability = availability.filter(avail => avail.day_of_week === dayOfWeek);
    
    if (dayAvailability.length === 0) return slots; // No hay disponibilidad este día
    
    // Para cada bloque de disponibilidad del especialista
    for (const avail of dayAvailability) {
      const [startHour, startMin] = avail.start_time.split(':').map(Number);
      const [endHour, endMin] = avail.end_time.split(':').map(Number);
      
      let startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;
      
      // Validar que no exceda el horario de cierre
      // Sábados: máximo hasta 14:00 (840 minutos)
      if (dayOfWeek === 6) {
        const clinicCloseMinutes = 14 * 60; // 14:00
        if (endMinutes > clinicCloseMinutes) {
          endMinutes = clinicCloseMinutes;
        }
        if (startMinutes >= clinicCloseMinutes) {
          continue; // Saltar este bloque, ya pasó el horario de cierre
        }
      }
      
      // Generar slots cada 30 minutos hasta el final (inclusivo)
      // El último slot debe comenzar antes del endMinutes, pero puede incluir el límite
      for (let currentMinutes = startMinutes; currentMinutes + this.SLOT_DURATION <= endMinutes; currentMinutes += this.SLOT_DURATION) {
        const hour = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        const slotTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        
        slots.push({
          date: new Date(date),
          time: slotTime,
          available: true, // Se verificará después
          formattedDate: date.toLocaleDateString('es-AR'),
          dayName: date.toLocaleDateString('es-AR', { weekday: 'long' })
        });
      }
    }
    
    return slots;
  }

  private async checkSlotsAvailability(slots: TimeSlot[]) {
    try {
      // Obtener turnos existentes del especialista
      const existingAppointments = await this.appointmentsService.getSpecialistAppointments(this.selectedSpecialistId);
      
      // Marcar slots ocupados
      slots.forEach(slot => {
        const slotDateTime = new Date(slot.date);
        const [hours, minutes] = slot.time.split(':').map(Number);
        slotDateTime.setHours(hours, minutes, 0, 0);
        
        const isOccupied = existingAppointments.some(apt => {
          if (apt.status_id === 5) return false; // Ignorar cancelados
          
          const aptDate = new Date(apt.appointment_date);
          const aptEnd = new Date(aptDate.getTime() + (apt.duration_minutes * 60000));
          const slotEnd = new Date(slotDateTime.getTime() + (this.SLOT_DURATION * 60000));
          
          // Verificar superposición
          return (slotDateTime < aptEnd && slotEnd > aptDate);
        });
        
        slot.available = !isOccupied;
      });
      
    } catch (error) {
      console.error('Error checking slot availability:', error);
      // En caso de error, asumir que todos están disponibles
    }
  }

  onSpecialtyChange() {
    this.selectedSpecialistId = '';
    this.availableSlots = [];
    this.selectedTimeSlot = null;
    
    if (this.selectedSpecialtyId) {
      this.loadSpecialists();
    }
  }

  onSpecialistChange() {
    this.availableSlots = [];
    this.selectedTimeSlot = null;
    
    if (this.selectedSpecialistId) {
      this.loadAvailableSlots();
    }
  }

  selectTimeSlot(slot: TimeSlot) {
    if (!slot.available) return;
    this.selectedTimeSlot = slot;
  }

  async confirmAppointment() {
    // Validaciones
    if (!this.selectedSpecialtyId) {
      this.messageService.showWarning('Por favor seleccioná una especialidad');
      return;
    }
    
    if (!this.selectedSpecialistId) {
      this.messageService.showWarning('Por favor seleccioná un especialista');
      return;
    }
    
    if (!this.selectedTimeSlot) {
      this.messageService.showWarning('Por favor seleccioná un horario');
      return;
    }
    
    if (this.isAdmin && !this.selectedPatientId) {
      this.messageService.showWarning('Por favor seleccioná un paciente');
      return;
    }

    try {
      this.loading = true;
      
      // Crear la fecha y hora del turno
      const appointmentDate = new Date(this.selectedTimeSlot.date);
      const [hours, minutes] = this.selectedTimeSlot.time.split(':').map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      // Crear el turno
      await this.appointmentsService.createAppointment({
        patient_id: this.selectedPatientId || this.currentUser.id,
        specialist_id: this.selectedSpecialistId,
        specialty_id: this.selectedSpecialtyId,
        appointment_date: appointmentDate.toISOString(),
        duration_minutes: this.SLOT_DURATION
      });
      
      this.messageService.showSuccess('Turno solicitado exitosamente. El especialista debe aceptarlo para confirmar la cita.');
      this.resetForm();
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      this.messageService.showError('Error al solicitar el turno. Por favor intentá nuevamente.');
    } finally {
      this.loading = false;
    }
  }

  resetForm() {
    this.selectedSpecialtyId = null;
    this.selectedSpecialistId = '';
    this.selectedTimeSlot = null;
    this.specialists = [];
    this.availableSlots = [];
    
    if (!this.isAdmin) {
      this.selectedPatientId = this.currentUser?.id || '';
    } else {
      this.selectedPatientId = '';
    }
  }

  getSpecialtyName(id: number | null): string {
    if (!id) return '';
    return this.specialties.find(s => s.id === id)?.name || '';
  }

  getSpecialistName(id: string): string {
    const specialist = this.specialists.find(s => s.id === id);
    return specialist ? `${specialist.name} ${specialist.last_name}` : '';
  }

  getPatientName(id: string): string {
    const patient = this.patients.find(p => p.id === id);
    return patient ? `${patient.name} ${patient.last_name}` : '';
  }

  groupSlotsByDate(slots: TimeSlot[]): { [date: string]: TimeSlot[] } {
    return slots.reduce((groups, slot) => {
      const key = slot.formattedDate;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(slot);
      return groups;
    }, {} as { [date: string]: TimeSlot[] });
  }

  getGroupedSlots() {
    return this.groupSlotsByDate(this.availableSlots);
  }
}