import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ExcelService } from '../../services/excel.service';
import { PdfService } from '../../services/pdf.service';

// Declare Chartist globally
declare const Chartist: any;

interface AppointmentStats {
  specialty_name: string;
  count: number;
}

interface DayStats {
  date: string;
  count: number;
}

interface DoctorStats {
  doctor_name: string;
  requested_count: number;
  finished_count: number;
}

interface LoginLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  login_timestamp: string;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.scss']
})
export class EstadisticasComponent implements OnInit {
  loading = true;
  error = '';
  activeTab: 'turnos-especialidad' | 'turnos-dia' | 'turnos-medico' | 'log-ingresos' = 'turnos-especialidad';
  
  // Data
  specialtyStats: AppointmentStats[] = [];
  dayStats: DayStats[] = [];
  doctorStats: DoctorStats[] = [];
  loginLogs: LoginLog[] = [];
  
  // Filters
  startDate: string = '';
  endDate: string = '';

  constructor(
    private supabaseService: SupabaseService,
    private excelService: ExcelService,
    private pdfService: PdfService
  ) {
    // Set default date range (last 30 days)
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    
    this.startDate = lastMonth.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  async ngOnInit() {
    await this.loadAppointmentsBySpecialty();
  }

  switchTab(tab: 'turnos-especialidad' | 'turnos-dia' | 'turnos-medico' | 'log-ingresos') {
    this.activeTab = tab;
    
    // Load data and recreate charts based on tab
    setTimeout(() => {
      switch(tab) {
        case 'turnos-especialidad':
          if (this.specialtyStats.length > 0) {
            this.createSpecialtyChart();
          }
          break;
        case 'turnos-dia':
          this.loadAppointmentsByDay();
          break;
        case 'turnos-medico':
          this.loadAppointmentsByDoctor();
          break;
        case 'log-ingresos':
          this.loadLoginLogs();
          break;
      }
    }, 100);
  }

  async loadAppointmentsBySpecialty() {
    try {
      this.loading = true;
      this.error = '';

      // Get all appointments with specialty_id
      const { data: appointments, error: appointmentsError } = await this.supabaseService.client
        .from('appointments')
        .select('id, specialty_id');

      if (appointmentsError) {
        throw appointmentsError;
      }

      console.log('📊 Raw appointments:', appointments);

      // Get unique specialty IDs
      const specialtyIds = [...new Set(appointments?.map(a => a.specialty_id).filter(Boolean) || [])];
      
      console.log('🏥 Specialty IDs:', specialtyIds);

      // Get specialty names
      const { data: specialties, error: specialtiesError } = await this.supabaseService.client
        .from('specialties')
        .select('id, name')
        .in('id', specialtyIds);

      if (specialtiesError) {
        throw specialtiesError;
      }

      console.log('🏥 Specialties:', specialties);

      // Create specialty map
      const specialtyMap = new Map(specialties?.map(s => [s.id, s.name]) || []);

      // Count appointments per specialty
      const specialtyCount = new Map<string, number>();
      
      appointments?.forEach((appointment: any) => {
        const specialtyName = specialtyMap.get(appointment.specialty_id) || 'Sin especialidad';
        specialtyCount.set(specialtyName, (specialtyCount.get(specialtyName) || 0) + 1);
      });

      // Convert to array and sort by count
      this.specialtyStats = Array.from(specialtyCount.entries())
        .map(([specialty_name, count]) => ({ specialty_name, count }))
        .sort((a, b) => b.count - a.count);

      console.log('📊 Final stats:', this.specialtyStats);

      this.loading = false;

      // Create chart after view is rendered
      setTimeout(() => {
        this.createSpecialtyChart();
      }, 200);
      
    } catch (error: any) {
      console.error('Error loading statistics:', error);
      this.error = 'Error al cargar las estadísticas: ' + error.message;
      this.loading = false;
    }
  }

  async loadAppointmentsByDay() {
    try {
      this.loading = true;
      this.error = '';

      const { data: appointments, error } = await this.supabaseService.client
        .from('appointments')
        .select('appointment_date');

      if (error) throw error;

      // Count appointments per day
      const dayCount = new Map<string, number>();
      
      appointments?.forEach((apt: any) => {
        const date = apt.appointment_date;
        dayCount.set(date, (dayCount.get(date) || 0) + 1);
      });

      // Convert and sort by date
      this.dayStats = Array.from(dayCount.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.loading = false;

      setTimeout(() => {
        this.createDayChart();
      }, 200);

    } catch (error: any) {
      console.error('Error loading day statistics:', error);
      this.error = 'Error al cargar estadísticas por día: ' + error.message;
      this.loading = false;
    }
  }

  async loadAppointmentsByDoctor() {
    try {
      this.loading = true;
      this.error = '';

      // Get appointments in date range
      const { data: appointments, error: appointmentsError } = await this.supabaseService.client
        .from('appointments')
        .select('specialist_id, status_id, appointment_date')
        .gte('appointment_date', this.startDate)
        .lte('appointment_date', this.endDate);

      if (appointmentsError) throw appointmentsError;

      // Get unique specialist IDs
      const specialistIds = [...new Set(appointments?.map(a => a.specialist_id).filter(Boolean) || [])];

      // Get specialist names
      const { data: specialists } = await this.supabaseService.client
        .from('profiles')
        .select('id, name, last_name')
        .in('id', specialistIds);

      const specialistMap = new Map(specialists?.map(s => [s.id, `${s.name} ${s.last_name}`]) || []);

      // Count requested and finished appointments per doctor
      const doctorRequestedCount = new Map<string, number>();
      const doctorFinishedCount = new Map<string, number>();

      appointments?.forEach((apt: any) => {
        const doctorName = specialistMap.get(apt.specialist_id) || 'Desconocido';
        
        // All appointments are requested
        doctorRequestedCount.set(doctorName, (doctorRequestedCount.get(doctorName) || 0) + 1);
        
        // Count finished (status_id = 4)
        if (apt.status_id === 4) {
          doctorFinishedCount.set(doctorName, (doctorFinishedCount.get(doctorName) || 0) + 1);
        }
      });

      // Combine stats
      this.doctorStats = Array.from(doctorRequestedCount.entries())
        .map(([doctor_name, requested_count]) => ({
          doctor_name,
          requested_count,
          finished_count: doctorFinishedCount.get(doctor_name) || 0
        }))
        .sort((a, b) => b.requested_count - a.requested_count);

      this.loading = false;

      setTimeout(() => {
        this.createDoctorCharts();
      }, 200);

    } catch (error: any) {
      console.error('Error loading doctor statistics:', error);
      this.error = 'Error al cargar estadísticas por médico: ' + error.message;
      this.loading = false;
    }
  }

  async loadLoginLogs() {
    try {
      this.loading = true;
      this.error = '';

      const { data: logs, error } = await this.supabaseService.client
        .from('login_logs')
        .select('*')
        .order('login_timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user names
      const userIds = [...new Set(logs?.map(l => l.user_id) || [])];
      const { data: users } = await this.supabaseService.client
        .from('profiles')
        .select('id, name, last_name')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, `${u.name} ${u.last_name}`]) || []);

      this.loginLogs = logs?.map(log => ({
        ...log,
        user_name: userMap.get(log.user_id) || 'Desconocido'
      })) || [];

      this.loading = false;

    } catch (error: any) {
      console.error('Error loading login logs:', error);
      this.error = 'Error al cargar logs de ingreso: ' + error.message;
      this.loading = false;
    }
  }

  createBarChart(stats: AppointmentStats[]) {
    // Verify element exists
    const chartElement = document.querySelector('.ct-chart');
    if (!chartElement) {
      console.error('❌ Chart element .ct-chart not found in DOM');
      return;
    }

    console.log('✅ Chart element found:', chartElement);

    const labels = stats.map(s => s.specialty_name);
    const series = [stats.map(s => s.count)];

    const data = {
      labels: labels,
      series: series
    };

    const options = {
      seriesBarDistance: 15,
      axisX: {
        showGrid: false
      },
      axisY: {
        onlyInteger: true
      },
      height: '400px'
    };

    const responsiveOptions: any = [
      ['screen and (max-width: 640px)', {
        seriesBarDistance: 5,
        axisX: {
          labelInterpolationFnc: function(value: string) {
            return value[0];
          }
        }
      }]
    ];

    // Create bar chart using global Chartist
    try {
      if (typeof Chartist !== 'undefined' && Chartist.Bar) {
        new Chartist.Bar('.ct-chart', data, options, responsiveOptions);
        console.log('✅ Chart created successfully');
      } else {
        console.error('❌ Chartist library not loaded');
      }
    } catch (error) {
      console.error('❌ Error creating chart:', error);
    }
  }

  createSpecialtyChart() {
    const chartElement = document.querySelector('#chart-specialty');
    if (!chartElement) {
      console.error('Chart element #chart-specialty not found');
      return;
    }

    const labels = this.specialtyStats.map(s => s.specialty_name);
    const series = [this.specialtyStats.map(s => s.count)];

    new Chartist.Bar('#chart-specialty', {
      labels: labels,
      series: series
    }, {
      seriesBarDistance: 15,
      axisX: {
        showGrid: false,
        offset: 60
      },
      axisY: {
        onlyInteger: true,
        offset: 50
      },
      height: '450px',
      chartPadding: {
        top: 20,
        right: 20,
        bottom: 80,
        left: 20
      }
    });
  }

  createDayChart() {
    const chartElement = document.querySelector('#chart-day');
    if (!chartElement) {
      console.error('Chart day element not found');
      return;
    }

    // Take last 30 days max for readability
    const recentDays = this.dayStats.slice(-30);
    const labels = recentDays.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const series = [recentDays.map(d => d.count)];

    new Chartist.Bar('#chart-day', {
      labels: labels,
      series: series
    }, {
      seriesBarDistance: 10,
      axisX: {
        showGrid: false,
        offset: 60,
        labelInterpolationFnc: function(value: any, index: number) {
          // Show every 3rd label to avoid crowding
          return index % 3 === 0 ? value : null;
        }
      },
      axisY: {
        onlyInteger: true,
        offset: 40
      },
      height: '450px',
      chartPadding: {
        top: 20,
        right: 20,
        bottom: 80,
        left: 20
      }
    });
  }

  createDoctorCharts() {
    // Chart for requested appointments
    const chartRequestedElement = document.querySelector('#chart-doctor-requested');
    if (chartRequestedElement) {
      const labels = this.doctorStats.map(d => {
        // Truncate long names
        const name = d.doctor_name;
        return name.length > 12 ? name.substring(0, 12) + '...' : name;
      });
      const series = [this.doctorStats.map(d => d.requested_count)];

      new Chartist.Bar('#chart-doctor-requested', {
        labels: labels,
        series: series
      }, {
        seriesBarDistance: 15,
        axisX: {
          showGrid: false,
          offset: 60
        },
        axisY: {
          onlyInteger: true,
          offset: 50
        },
        height: '400px',
        chartPadding: {
          top: 20,
          right: 20,
          bottom: 80,
          left: 20
        }
      });
    }

    // Chart for finished appointments
    const chartFinishedElement = document.querySelector('#chart-doctor-finished');
    if (chartFinishedElement) {
      const labels = this.doctorStats.map(d => {
        const name = d.doctor_name;
        return name.length > 12 ? name.substring(0, 12) + '...' : name;
      });
      const series = [this.doctorStats.map(d => d.finished_count)];

      new Chartist.Bar('#chart-doctor-finished', {
        labels: labels,
        series: series
      }, {
        seriesBarDistance: 15,
        axisX: {
          showGrid: false,
          offset: 60
        },
        axisY: {
          onlyInteger: true,
          offset: 50
        },
        height: '400px',
        chartPadding: {
          top: 20,
          right: 20,
          bottom: 80,
          left: 20
        }
      });
    }
  }

  // Export methods
  exportSpecialtyToExcel() {
    const data = this.specialtyStats.map(s => ({
      'Especialidad': s.specialty_name,
      'Cantidad de Turnos': s.count
    }));

    this.excelService.exportToExcel(data, 'turnos-por-especialidad');
  }

  async exportSpecialtyToPDF() {
    const data = this.specialtyStats.map(s => ({
      'Especialidad': s.specialty_name,
      'Cantidad de Turnos': s.count
    }));

    this.pdfService.exportStatisticsToPDF(data, 'turnos-por-especialidad', 'Turnos por Especialidad');
  }

  exportDayToExcel() {
    const data = this.dayStats.map(d => ({
      'Fecha': new Date(d.date).toLocaleDateString('es-AR'),
      'Cantidad de Turnos': d.count
    }));

    this.excelService.exportToExcel(data, 'turnos-por-dia');
  }

  async exportDayToPDF() {
    const data = this.dayStats.map(d => ({
      'Fecha': new Date(d.date).toLocaleDateString('es-AR'),
      'Cantidad de Turnos': d.count
    }));

    this.pdfService.exportStatisticsToPDF(data, 'turnos-por-dia', 'Turnos por Día');
  }

  exportDoctorToExcel() {
    const data = this.doctorStats.map(d => ({
      'Médico': d.doctor_name,
      'Turnos Solicitados': d.requested_count,
      'Turnos Finalizados': d.finished_count
    }));

    this.excelService.exportToExcel(data, 'turnos-por-medico');
  }

  async exportDoctorToPDF() {
    const data = this.doctorStats.map(d => ({
      'Médico': d.doctor_name,
      'Turnos Solicitados': d.requested_count,
      'Turnos Finalizados': d.finished_count
    }));

    this.pdfService.exportStatisticsToPDF(data, 'turnos-por-medico', 'Turnos por Médico');
  }

  exportLogsToExcel() {
    const data = this.loginLogs.map(log => ({
      'Usuario': log.user_name,
      'Email': log.user_email,
      'Rol': log.user_role,
      'Fecha y Hora': new Date(log.login_timestamp).toLocaleString('es-AR')
    }));

    this.excelService.exportToExcel(data, 'logs-ingreso');
  }

  async exportLogsToPDF() {
    const data = this.loginLogs.map(log => ({
      'Usuario': log.user_name,
      'Email': log.user_email,
      'Rol': log.user_role,
      'Fecha y Hora': new Date(log.login_timestamp).toLocaleString('es-AR')
    }));

    this.pdfService.exportStatisticsToPDF(data, 'logs-ingreso', 'Logs de Ingreso al Sistema');
  }
}
