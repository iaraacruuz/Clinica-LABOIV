import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home'; 
import { LoginComponent } from './pages/login/login';
import { RegistroComponent } from './pages/registro/registro';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AprobarEspecialistasComponent } from './admin/aprobar-especialistas/aprobar-especialistas';
import { MisTurnosComponent } from './pages/mis-turnos/mis-turnos';
import { MisTurnosEspecialistaComponent } from './pages/mis-turnos-especialista/mis-turnos-especialista';
import { PacientesEspecialistaComponent } from './pages/pacientes-especialista/pacientes-especialista';
import { MiPerfilComponent } from './pages/mi-perfil/mi-perfil';
import { SolicitarTurnoComponent } from './pages/solicitar-turno/solicitar-turno';
import { TurnosAdminComponent } from './pages/turnos-admin/turnos-admin';
import { UsuariosAdminComponent } from './admin/usuarios-admin/usuarios-admin';
import { EstadisticasComponent } from './admin/estadisticas/estadisticas';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';

export const routes: Routes = [
  // PÁGINA PRINCIPAL
  { path: '', component: HomeComponent, title: 'Clínica Online | Bienvenida' },

  // ACCESO
  { path: 'login', component: LoginComponent, title: 'Ingreso al Sistema' },
  { path: 'registro', component: RegistroComponent, title: 'Registro de Usuarios' },

  // RUTAS PROTEGIDAS PARA USUARIOS AUTENTICADOS
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    title: 'Dashboard',
    canActivate: [AuthGuard]
  },
  {
    path: 'mi-perfil',
    component: MiPerfilComponent,
    title: 'Mi Perfil',
    canActivate: [AuthGuard]
  },
  {
    path: 'mis-turnos',
    component: MisTurnosComponent,
    title: 'Mis Turnos',
    canActivate: [AuthGuard]
  },
  {
    path: 'mis-turnos-especialista',
    component: MisTurnosEspecialistaComponent,
    title: 'Mis Turnos - Especialista',
    canActivate: [AuthGuard]
  },
  {
    path: 'solicitar-turno',
    component: SolicitarTurnoComponent,
    title: 'Solicitar Turno',
    canActivate: [AuthGuard]
  },
  {
    path: 'pacientes',
    component: PacientesEspecialistaComponent,
    title: 'Mis Pacientes',
    canActivate: [AuthGuard]
  },

  // RUTAS PROTEGIDAS PARA ADMINISTRADORES
  { 
    path: 'admin/aprobar-especialistas', 
    component: AprobarEspecialistasComponent,
    title: 'Aprobar Especialistas',
    canActivate: [AdminGuard] 
  },
  {
    path: 'admin/usuarios',
    component: UsuariosAdminComponent,
    title: 'Gestión de Usuarios',
    canActivate: [AdminGuard]
  },
  {
    path: 'admin/turnos',
    component: TurnosAdminComponent,
    title: 'Gestión de Turnos',
    canActivate: [AdminGuard]
  },
  {
    path: 'admin/estadisticas',
    component: EstadisticasComponent,
    title: 'Estadísticas',
    canActivate: [AdminGuard]
  },

  // RUTA CATCH-ALL
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
