import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth';
import { MessageService } from '../../services/message.service';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  showBackConfirmation = false;
  
  // Validaciones en tiempo real
  emailError = '';
  passwordError = '';
  emailTouched = false;
  passwordTouched = false;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  async login() {
    try {
      // Call AuthService.iniciarSesion which handles ALL auth flow
      // (login, profile creation, validation) in a serialized manner
      await this.authService.iniciarSesion(this.email, this.password);
      
      // Redirect to dashboard for all authenticated users
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      const errorMsg = err.message || 'Error desconocido';
      
      if (errorMsg === 'EMAIL_UNVERIFIED') {
        this.messageService.showWarning('Debes verificar tu correo electrónico antes de iniciar sesión. Revisá tu casilla de email.');
      } else if (errorMsg === 'SPECIALIST_NOT_APPROVED') {
        this.messageService.showWarning('Tu cuenta de especialista aún no fue aprobada por un administrador. Por favor esperá la aprobación.');
      } else if (errorMsg === 'ADMIN_NOT_APPROVED') {
        this.messageService.showWarning('Tu cuenta de administrador aún no fue aprobada por otro administrador. Por favor esperá la aprobación.');
      } else if (errorMsg === 'LOGIN_IN_PROGRESS') {
        this.messageService.showInfo('Inicio de sesión en progreso. Por favor espera...');
      } else if (errorMsg === 'PROFILE_CREATION_FAILED') {
        this.messageService.showError('No se pudo crear el perfil del usuario. Por favor contactá al administrador');
      } else if (errorMsg === 'USER_NOT_FOUND') {
        this.messageService.showError('Credenciales incorrectas');
      } else {
        this.messageService.showError('Error al iniciar sesión: ' + errorMsg);
      }
      console.error('Login error:', err);
    }
  }

  // Función para accesos rápidos
  quickAccess(role: 'patient' | 'specialist' | 'admin') {
    switch(role) {
      case 'patient':
        this.email = 'paciente@clinica.com';
        this.password = '123456';
        break;
      case 'specialist':
        this.email = 'especialista@clinica.com';
        this.password = '123456';
        break;
      case 'admin':
        this.email = 'admin@clinica.com';
        this.password = '123456';
        break;
    }
  }

  goToRegister() {
    this.router.navigate(['/registro']);
  }

  goBackWithConfirmation() {
    if (this.email || this.password) {
      this.showBackConfirmation = true;
    } else {
      this.router.navigate(['/']);
    }
  }

  confirmGoBack() {
    this.showBackConfirmation = false;
    this.router.navigate(['/']);
  }

  cancelGoBack() {
    this.showBackConfirmation = false;
  }

  // Validaciones en tiempo real
  validateEmail() {
    this.emailTouched = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!this.email) {
      this.emailError = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(this.email)) {
      this.emailError = 'Por favor ingresá un correo electrónico válido';
    } else {
      this.emailError = '';
    }
  }

  validatePassword() {
    this.passwordTouched = true;
    
    if (!this.password) {
      this.passwordError = 'La contraseña es obligatoria';
    } else if (this.password.length < 6) {
      this.passwordError = 'La contraseña debe tener al menos 6 caracteres';
    } else {
      this.passwordError = '';
    }
  }

  isFormValid(): boolean {
    return !this.emailError && !this.passwordError && this.email !== '' && this.password !== '';
  }
}
