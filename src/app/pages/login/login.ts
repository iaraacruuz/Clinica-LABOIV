import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; 
import { AuthService, SessionUser, UserData } from '../../services/auth'; // Asumiendo que existe el AuthService
import { Router, RouterModule } from '@angular/router'; 
import { signal } from '@angular/core'; // Usamos signals para el estado

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  errorLogin = signal<string>('');
  loading = signal<boolean>(false);

  // Datos simulados de acceso rápido (alineados con auth.service.ts)
  accesoRapidoUsuarios = [
    { mail: 'admin@clinic.com', pass: '123456', perfil: 'Admin' },
    { mail: 'especialista.aprobado@clinic.com', pass: '123456', perfil: 'Especialista' },
    { mail: 'paciente.verificado@clinic.com', pass: '123456', perfil: 'Paciente' },
    { mail: 'especialista.pendiente@clinic.com', pass: '123456', perfil: 'Esp. Pendiente' }, // Caso denegado
    { mail: 'paciente.noverificado@clinic.com', pass: '123456', perfil: 'Pac. No Verif.' }, // Caso denegado
  ];

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }
  
  /**
   * Getter para un acceso más limpio a los controles en la plantilla.
   */
  get c() { 
      return this.loginForm.controls; 
  }

  /**
   * Rellena el formulario con las credenciales de acceso rápido.
   */
  cargarAccesoRapido(mail: string, pass: string) {
    this.loginForm.setValue({
        mail: mail,
        password: pass
    });
    this.errorLogin.set('');
    this.loginForm.markAllAsTouched();
  }

  /**
   * Intenta iniciar sesión con las credenciales del formulario y aplica las reglas de acceso.
   */
  async iniciarSesion() {
    this.errorLogin.set('');
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      this.errorLogin.set('Por favor, ingresa un email válido y contraseña (mín. 6 caracteres).');
      return;
    }

    const { mail, password } = this.loginForm.value;
    let sessionUser: SessionUser;

    try {
      this.loading.set(true);

      // 1. Autenticar con Supabase/Backend (Simulado). Retorna SessionUser directamente.
      sessionUser = await this.authService.iniciarSesion(mail, password);
      
      // 2. Obtener datos adicionales del usuario (perfil, estado) desde Supabase DB (Simulado)
      // Usamos sessionUser.uid directamente.
      const userData = await this.authService.getUserData(sessionUser.uid); 
      
      const emailVerificado = sessionUser.emailVerified; 
      
      if (!userData) {
          await this.authService.cerrarSesion();
          this.errorLogin.set('No se encontraron datos de perfil. Contacta a soporte.');
          return;
      }

      // 3. Aplicar las Reglas de Ingreso según el perfil
      
      // Regla Paciente: Solo si verificó su email.
      if (userData.perfil === 'paciente' && !emailVerificado) {
          await this.authService.cerrarSesion();
          this.errorLogin.set('Acceso denegado: Debes verificar tu correo electrónico para ingresar. Revisa tu bandeja de entrada.');
          return;
      }
      
      // Regla Especialista:
      if (userData.perfil === 'especialista') {
          // Sub-Regla 1: Debe verificar su email.
          if (!emailVerificado) {
              await this.authService.cerrarSesion();
              this.errorLogin.set('Acceso denegado: Debes verificar tu correo electrónico para ingresar.');
              return;
          }
          // Sub-Regla 2: Debe estar activo (aprobado).
          if (userData.estado === 'pendiente_aprobacion') {
              await this.authService.cerrarSesion();
              this.errorLogin.set('Acceso denegado: Tu cuenta de Especialista aún está pendiente de aprobación por el administrador.');
              return;
          }
      }
      
      // 4. Si es administrador o pasó todas las validaciones
      console.log(`Ingreso exitoso como ${userData.perfil}. Redirigiendo a /home...`);
      this.router.navigate(['/home']); 

    } catch (error: any) {
      console.error('Error de login:', error);
      
      // Manejo de errores simulados (basados en la simulación de error en AuthService)
      if (error.code === 'auth/invalid-credential') {
        this.errorLogin.set('Credenciales inválidas. Verifica tu email y contraseña.');
      } else {
        this.errorLogin.set('Error al intentar ingresar. Por favor, intenta de nuevo.');
      }
    } finally {
        this.loading.set(false);
    }
  }
}

