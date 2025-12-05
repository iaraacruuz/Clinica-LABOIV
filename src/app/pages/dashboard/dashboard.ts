import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { SupabaseService } from '../../services/supabase.service';
import { AprobarEspecialistasComponent } from '../../admin/aprobar-especialistas/aprobar-especialistas';
import { UsuariosAdminComponent } from '../../admin/usuarios-admin/usuarios-admin';
import { MisTurnosComponent } from '../mis-turnos/mis-turnos';
import { MisTurnosEspecialistaComponent } from '../mis-turnos-especialista/mis-turnos-especialista';
import { TurnosAdminComponent } from '../turnos-admin/turnos-admin';
import { SolicitarTurnoComponent } from '../solicitar-turno/solicitar-turno';
import { MiPerfilComponent } from '../mi-perfil/mi-perfil';
import { PacientesEspecialistaComponent } from '../pacientes-especialista/pacientes-especialista';
import { EstadisticasComponent } from '../../admin/estadisticas/estadisticas';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal';
import { fadeIn, slideInUp } from '../../animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AprobarEspecialistasComponent, UsuariosAdminComponent, MisTurnosComponent, MisTurnosEspecialistaComponent, TurnosAdminComponent, SolicitarTurnoComponent, MiPerfilComponent, PacientesEspecialistaComponent, EstadisticasComponent, ConfirmationModalComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  animations: [fadeIn, slideInUp]
})
export class DashboardComponent implements OnInit {

  currentUser: any = null;
  stats = {
    totalSpecialists: 0,
    pendingSpecialists: 0,
    approvedSpecialists: 0,
    totalPatients: 0
  };
  
  loading = false;
  activeSection: 'home' | 'especialistas' | 'usuarios' | 'estadisticas' | 'turnos' | 'turnos-admin' | 'solicitar-turno' | 'perfil' | 'pacientes' = 'home';
  showLogoutConfirmation = false;
  
  constructor(
    private auth: AuthService,
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    const sessionUser = this.auth.currentUser();
    if (!sessionUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = await this.supabase.getUserData(sessionUser.uid);
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.currentUser.role === 'admin') {
      await this.loadStats();
    }
  }

  async loadStats() {
    this.loading = true;
    try {
      // Total specialists
      const { count: totalSpecs } = await this.supabase.client
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'specialist');

      // Pending specialists
      const { count: pendingSpecs } = await this.supabase.client
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'specialist')
        .eq('is_approved', false);

      // Approved specialists
      const { count: approvedSpecs } = await this.supabase.client
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'specialist')
        .eq('is_approved', true);

      // Total patients
      const { count: totalPats } = await this.supabase.client
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'patient');

      this.stats = {
        totalSpecialists: totalSpecs || 0,
        pendingSpecialists: pendingSpecs || 0,
        approvedSpecialists: approvedSpecs || 0,
        totalPatients: totalPats || 0
      };
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      this.loading = false;
    }
  }

  setActiveSection(section: 'home' | 'especialistas' | 'usuarios' | 'estadisticas' | 'turnos' | 'turnos-admin' | 'solicitar-turno' | 'perfil' | 'pacientes') {
    this.activeSection = section;
  }

  requestLogout() {
    this.showLogoutConfirmation = true;
  }

  async confirmLogout() {
    this.showLogoutConfirmation = false;
    try {
      await this.auth.cerrarSesion();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }

  cancelLogout() {
    this.showLogoutConfirmation = false;
  }

  getRoleLabel(): string {
    if (!this.currentUser) return '';
    switch (this.currentUser.role) {
      case 'admin': return 'Administrador';
      case 'specialist': return 'Especialista';
      case 'patient': return 'Paciente';
      default: return '';
    }
  }

  getRoleIcon(): string {
    if (!this.currentUser) return '👤';
    switch (this.currentUser.role) {
      case 'admin': return '👨‍💼';
      case 'specialist': return '👨‍⚕️';
      case 'patient': return '👤';
      default: return '👤';
    }
  }
}
