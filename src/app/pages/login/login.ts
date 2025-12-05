import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth';
import { MessageService } from '../../services/message.service';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal';
import { slideInFromLeft, fadeIn } from '../../animations';

interface QuickAccessUser {
  email: string;
  password: string;
  label: string;
  photoUrl: string;
  color: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  animations: [slideInFromLeft, fadeIn]
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  showBackConfirmation = false;
  
  emailError = '';
  passwordError = '';
  emailTouched = false;
  passwordTouched = false;

  quickAccessUsers: QuickAccessUser[] = [
    { email: 'bebote3251@docsfy.com', password: '123456', label: 'Paciente 1', photoUrl: '', color: '#4CAF50' },
    { email: 'iarazoecruz@hotmail.com', password: '123456', label: 'Paciente 2', photoUrl: '', color: '#8BC34A' },
    { email: 'juanlopez426@hotmail.com', password: '123456', label: 'Paciente 3', photoUrl: '', color: '#CDDC39' },
    { email: 'lauragallo555@hotmail.com', password: '123456', label: 'Dra. Gallo', photoUrl: '', color: '#2196F3' },
    { email: 'adrianaalv36@hotmail.com', password: '123456', label: 'Dra. Álvarez', photoUrl: '', color: '#03A9F4' },
    { email: 'admclinica456@gmail.com', password: '123456', label: 'Admin', photoUrl: '', color: '#9C27B0' }
  ];

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.loadQuickAccessPhotos();
  }

  async loadQuickAccessPhotos() {
    try {
      console.log('🔍 Loading quick access photos from bucket...');
      
      for (const user of this.quickAccessUsers) {
        const { data: profileData, error: profileError } = await this.supabase.client
          .from('profiles')
          .select('id, profile_image_url')
          .eq('email', user.email)
          .single();

        if (profileError) {
          console.error(`❌ Error loading profile for ${user.email}:`, profileError);
          continue;
        }

        console.log(`✅ Profile data for ${user.email}:`, profileData);

        // El campo correcto es profile_image_url y ya contiene la URL completa
        if (profileData.profile_image_url) {
          user.photoUrl = profileData.profile_image_url;
          console.log(`✅ Photo URL for ${user.email}:`, user.photoUrl);
        }
      }
      
      console.log('📸 All users loaded:', this.quickAccessUsers);
    } catch (error) {
      console.error('Error loading quick access photos:', error);
    }
  }

  /** Inicia sesión y redirige al dashboard o muestra errores según el caso */
  async login() {
    try {
      await this.authService.iniciarSesion(this.email, this.password);
      
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

  /** Autentica al usuario usando las credenciales de acceso rápido */
  async quickLogin(email: string, password: string) {
    this.email = email;
    this.password = password;
    await this.login();
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
