import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule, ValidatorFn } from '@angular/forms'; 
import { AuthService } from '../../services/auth'; // Asumiendo la ubicación de tu servicio
import { Router, RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-registro',
  standalone: true, 
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
  ],
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss']
})
export class RegistroComponent implements OnInit {

  registroForm!: FormGroup;
  perfilSeleccionado: 'paciente' | 'especialista' | null = null;
  // Simulación de especialidades disponibles
  especialidadesDisponibles: string[] = ['Cardiología', 'Dermatología', 'Pediatría', 'Traumatología', 'Odontología'];

  errorRegistro: string = '';
  loading: boolean = false; 

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router
  ) { }

  ngOnInit(): void {
    // Inicialización del formulario con los campos comunes y los específicos
    this.registroForm = this.fb.group({
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      edad: [null, [Validators.required, Validators.min(18), Validators.max(120)]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,9}$/)]],
      
      // Campos específicos (inicialmente sin validadores requeridos)
      obraSocial: [''],
      especialidad: [null],
      otraEspecialidad: [''], 
      imagenPerfil1: [null], 
      imagenPerfil2: [null], 
    });

    // Subscripción para manejar la validación condicional de 'otraEspecialidad'
    this.c['especialidad'].valueChanges.subscribe(value => {
        const otraEspecialidadControl = this.c['otraEspecialidad'];
        if (value === 'otra') {
            // Requerido si selecciona 'otra'
            otraEspecialidadControl.setValidators([Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]);
        } else {
            // No requerido
            otraEspecialidadControl.clearValidators();
            otraEspecialidadControl.setValue(''); // Limpiar valor
        }
        otraEspecialidadControl.updateValueAndValidity();
    });
  }
  
  // Custom validator para asegurar que se seleccionó un objeto File (opcional, ya que el [null] del setValue no es un File)
  // Lo dejamos comentado y confiamos en el Validators.required y el setValue(file) en onFileSelected.
  /*
  validarArchivo(control: AbstractControl): { [key: string]: any } | null {
    if (control.value && !(control.value instanceof File)) {
      return { 'notAFile': true };
    }
    return null;
  }
  */
  
  /**
   * Determina qué campos adicionales se requieren según el perfil.
   */
  seleccionarPerfil(perfil: 'paciente' | 'especialista') {
    this.perfilSeleccionado = perfil;
    
    // **Importante:** Reseteamos los campos específicos y sus validadores
    this.c['obraSocial'].setValue('');
    this.c['obraSocial'].clearValidators();
    this.c['especialidad'].setValue(null);
    this.c['especialidad'].clearValidators();
    this.c['otraEspecialidad'].setValue('');
    this.c['otraEspecialidad'].clearValidators();
    this.c['imagenPerfil1'].setValue(null);
    this.c['imagenPerfil1'].clearValidators();
    this.c['imagenPerfil2'].setValue(null);
    this.c['imagenPerfil2'].clearValidators();

    if (perfil === 'paciente') {
      this.c['obraSocial'].setValidators(Validators.required);
      this.c['imagenPerfil1'].setValidators(Validators.required);
      this.c['imagenPerfil2'].setValidators(Validators.required);
    } else if (perfil === 'especialista') {
      this.c['especialidad'].setValidators(Validators.required);
      this.c['imagenPerfil1'].setValidators(Validators.required);
    }

    // Actualizar el formulario para aplicar las nuevas validaciones
    this.c['obraSocial'].updateValueAndValidity();
    this.c['especialidad'].updateValueAndValidity();
    this.c['otraEspecialidad'].updateValueAndValidity();
    this.c['imagenPerfil1'].updateValueAndValidity();
    this.c['imagenPerfil2'].updateValueAndValidity();
    
    // Marcar como 'pristine' y 'untouched' para evitar errores de validación inmediatos
    // Dejamos los campos comunes como estaban
    this.c['obraSocial'].markAsPristine();
    this.c['especialidad'].markAsPristine();
    this.c['imagenPerfil1'].markAsPristine();
    this.c['imagenPerfil2'].markAsPristine();
    this.c['obraSocial'].markAsUntouched();
    this.c['especialidad'].markAsUntouched();
    this.c['imagenPerfil1'].markAsUntouched();
    this.c['imagenPerfil2'].markAsUntouched();
  }

  /**
   * Maneja la subida de archivos (guarda el objeto File en el Form Control).
   */
  onFileSelected(event: any, controlName: string) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      // Guardamos el objeto File en el Form Control
      this.registroForm.get(controlName)?.setValue(file);
      this.registroForm.get(controlName)?.markAsDirty();
      this.registroForm.get(controlName)?.markAsTouched();
    } else {
      this.registroForm.get(controlName)?.setValue(null);
      this.registroForm.get(controlName)?.markAsDirty();
      this.registroForm.get(controlName)?.markAsTouched();
    }
  }

  /**
   * Intenta registrar al usuario.
   */
  async registrarUsuario() {
    this.errorRegistro = '';
    this.registroForm.markAllAsTouched();

    if (this.registroForm.invalid || !this.perfilSeleccionado) {
      this.errorRegistro = 'Por favor, completa todos los campos requeridos correctamente.';
      return;
    }

    const formValue = this.registroForm.value;
    const mail = formValue.mail;
    const password = formValue.password;

    try {
      this.loading = true;
      
      // La LÓGICA DE SUBIDA DE IMÁGENES a Storage (Firebase/otro) debe ir aquí o en un servicio de Storage
      // Esta subida es ASÍNCRONA y debe completarse antes de registrar el usuario en Firestore.
      
      // Simulación de los datos a enviar a Firestore
      const datosUsuario = {
        perfil: this.perfilSeleccionado,
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        edad: formValue.edad,
        dni: formValue.dni,
        // Solo incluimos los campos que aplican al perfil
        ...(this.perfilSeleccionado === 'paciente' && { obraSocial: formValue.obraSocial }),
        ...(this.perfilSeleccionado === 'especialista' && { especialidad: formValue.especialidad === 'otra' ? formValue.otraEspecialidad : formValue.especialidad }),
        // NOTA: Aquí irían las URLs de las imágenes subidas, no los objetos File.
        imagenPerfil1URL: 'https://storage/img1_url.png', 
        ...(this.perfilSeleccionado === 'paciente' && { imagenPerfil2URL: 'https://storage/img2_url.png' }),
        // ... otros campos de usuario: habilitado (false), etc.
      };

      // Llamada al servicio de autenticación
      await this.authService.registrarUsuario(mail, password, datosUsuario);

      // Redirigir después del registro exitoso
      this.router.navigate(['/login']);

    } catch (error: any) {
      this.loading = false;
      console.error('Error de registro:', error);
      if (error.code === 'auth/email-already-in-use') {
        this.errorRegistro = 'El correo electrónico ya está registrado. Intenta con otro.';
      } else {
        this.errorRegistro = 'Error al registrar: Ocurrió un problema de conexión o servidor.';
      }
    } finally {
        this.loading = false;
    }
  }

  // Getter para un acceso más limpio a los controles en la plantilla
  get c(): { [key: string]: AbstractControl } { 
      return this.registroForm.controls; 
  }
}