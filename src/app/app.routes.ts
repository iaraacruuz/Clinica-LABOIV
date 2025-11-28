import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home'; 
import { LoginComponent } from './pages/login/login';
import { RegistroComponent } from './pages/registro/registro';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AprobarEspecialistasComponent } from './admin/aprobar-especialistas/aprobar-especialistas';
import { MisTurnosComponent } from './pages/mis-turnos/mis-turnos';
import { PacientesEspecialistaComponent } from './pages/pacientes-especialista/pacientes-especialista';
import { AdminGuard } from '../app/guards/admin-guard'; // 🔹 Importar el guard

export const routes: Routes = [
  // PÁGINA PRINCIPAL
  { path: '', component: HomeComponent, title: 'Clínica Online | Bienvenida' },

  // ACCESO
  { path: 'login', component: LoginComponent, title: 'Ingreso al Sistema' },
  { path: 'registro', component: RegistroComponent, title: 'Registro de Usuarios' },

  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    title: 'Dashboard'
  },
  { 
    path: 'admin/aprobar-especialistas', 
    component: AprobarEspecialistasComponent, 
    canActivate: [AdminGuard] 
  },
  {
    path: 'mis-turnos',
    component: MisTurnosComponent,
    title: 'Mis Turnos'
  },
  {
    path: 'pacientes',
    component: PacientesEspecialistaComponent,
    title: 'Mis Pacientes'
  },

  // RUTA CATCH-ALL
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
