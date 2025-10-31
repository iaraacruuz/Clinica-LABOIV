import { Routes } from '@angular/router';

// 1. Componentes de Acceso y Navegación

import { HomeComponent} from './pages/home/home'; 
import { LoginComponent } from './pages/login/login';
import { RegistroComponent } from './pages/registro/registro';
import { UsuarioComponent } from './pages/usuarios/usuarios'; // Componente de Admin

// 2. Definición ÚNICA del array de Rutas
export const routes: Routes = [
 // PÁGINA PRINCIPAL (Bienvenida)
 { path: '', component: HomeComponent, title: 'Clínica Online | Bienvenida' },
 
 // ACCESO
 { path: 'login', component: LoginComponent, title: 'Ingreso al Sistema' },
 { path: 'registro', component: RegistroComponent, title: 'Registro de Usuarios' },
 
 // ADMINISTRACIÓN (Requisito Sprint 1)

 { path: 'usuarios', component: UsuarioComponent, title: 'Administración de Usuarios' },

 // TURNO/PERFIL (Rutas futuras)

 
 // RUTA CATCH-ALL (si la URL no coincide con nada, regresa a casa)
 { path: '**', redirectTo: '', pathMatch: 'full' }
];
