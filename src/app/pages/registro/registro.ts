import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { MessageService } from '../../services/message.service';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal';
import { CaptchaComponent } from '../../shared/captcha/captcha';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent, CaptchaComponent],
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss']
})
export class RegistroComponent {
  @ViewChild(CaptchaComponent) captchaComponent!: CaptchaComponent;
  
  email = '';
  password = '';
  name = '';
  last_name = '';
  age: number | null = null;
  dni = '';
  role: 'patient' | 'specialist' = 'patient';
  specialty = '';
  customSpecialty = '';
  showCustomSpecialty = false;
  health_insurance = '';
  loading = false;
  specialities: any[] = [];
  showBackConfirmation = false;
  captchaValid = false;
  
  // Validaciones en tiempo real
  emailError = '';
  passwordError = '';
  nameError = '';
  lastNameError = '';
  ageError = '';
  dniError = '';
  healthInsuranceError = '';
  specialtyError = '';
  
  emailTouched = false;
  passwordTouched = false;
  nameTouched = false;
  lastNameTouched = false;
  ageTouched = false;
  dniTouched = false;
  healthInsuranceTouched = false;
  specialtyTouched = false;
  
  // Imágenes de perfil
  profileImage1: File | null = null;
  profileImage2: File | null = null;
  profileImage1Preview: string | null = null;
  profileImage2Preview: string | null = null;

  constructor(
    private supabase: SupabaseService, 
    private router: Router,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.loadSpecialties();
  }

  async loadSpecialties() {
    try {
      const data = await this.supabase.getSpecialties();
      if (data && data.length > 0) {
        this.specialities = data;
      } else {
        console.warn('No hay especialidades cargadas en la base.');
      }
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    }
  }

  onFileSelected(event: any, imageNumber: 1 | 2) {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        this.messageService.showWarning('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.messageService.showWarning('La imagen no debe superar los 5MB');
        return;
      }

      if (imageNumber === 1) {
        this.profileImage1 = file;
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.profileImage1Preview = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.profileImage2 = file;
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.profileImage2Preview = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(imageNumber: 1 | 2) {
    if (imageNumber === 1) {
      this.profileImage1 = null;
      this.profileImage1Preview = null;
    } else {
      this.profileImage2 = null;
      this.profileImage2Preview = null;
    }
  }

  onSpecialtyChange() {
    if (this.specialty === 'otra') {
      this.showCustomSpecialty = true;
    } else {
      this.showCustomSpecialty = false;
      this.customSpecialty = '';
    }
  }

  async register() {
    this.loading = true;
    try {
      // Validar captcha primero
      if (!this.captchaValid) {
        this.messageService.showWarning('Por favor completá y verificá el código de seguridad (CAPTCHA)');
        this.loading = false;
        return;
      }

      // Validaciones de campos básicos
      if (!this.name || !this.last_name || !this.email || !this.password) {
        this.messageService.showWarning('Por favor completá todos los campos obligatorios');
        this.loading = false;
        return;
      }

      if (!this.age || this.age <= 0) {
        this.messageService.showWarning('Por favor ingresá una edad válida');
        this.loading = false;
        return;
      }

      if (!this.dni || this.dni.length < 7) {
        this.messageService.showWarning('Por favor ingresá un DNI válido');
        this.loading = false;
        return;
      }

      // Validaciones específicas por rol
      if (this.role === 'patient') {
        if (!this.profileImage1 || !this.profileImage2) {
          this.messageService.showWarning('Los pacientes deben cargar 2 imágenes de perfil');
          this.loading = false;
          return;
        }
        if (!this.health_insurance) {
          this.messageService.showWarning('Por favor ingresá la obra social');
          this.loading = false;
          return;
        }
      } else if (this.role === 'specialist') {
        if (!this.profileImage1) {
          this.messageService.showWarning('Los especialistas deben cargar 1 imagen de perfil');
          this.loading = false;
          return;
        }
        
        // Validar especialidad
        const finalSpecialty = this.showCustomSpecialty ? this.customSpecialty : this.specialty;
        if (!finalSpecialty) {
          this.messageService.showWarning('Debe seleccionar o ingresar una especialidad');
          this.loading = false;
          return;
        }
      }

      // Crear usuario en Supabase Auth
      const result = await this.supabase.register(this.email, this.password, { role: this.role });
      if (result.error) throw result.error;
      if (!result.data?.user) throw new Error('No se pudo crear el usuario');

      // Try to determine the created user's id. In some signup flows (email
      // confirmation required) `signUp` may not return a fully available user.
      let userId: string | null = result?.data?.user?.id ?? null;

      // Fallback: ask the client for current user (works if session was created)
      if (!userId) {
        const current = await this.supabase.getCurrentUser();
        userId = current?.id ?? null;
      }

      // Another fallback: try session info
      if (!userId) {
        const sess = await this.supabase.getSession();
        userId = (sess as any)?.user?.id ?? null;
      }

      // If still no user id, do not try to insert profile (would violate FK).
      if (!userId) {
        // Save pending profile data and inform the user to confirm their email.
        // Guardar las imágenes en localStorage como base64 temporalmente
        const image1Base64 = this.profileImage1 ? await this.fileToBase64(this.profileImage1) : null;
        const image2Base64 = this.profileImage2 ? await this.fileToBase64(this.profileImage2) : null;
        
        localStorage.setItem('pendingProfile', JSON.stringify({
          email: this.email,
          name: this.name,
          last_name: this.last_name,
          age: this.age,
          dni: this.dni,
          role: this.role,
          specialty: this.showCustomSpecialty ? this.customSpecialty : this.specialty,
          health_insurance: this.health_insurance,
          profileImage1: image1Base64,
          profileImage2: image2Base64,
          customSpecialty: this.showCustomSpecialty
        }));
        this.messageService.showSuccess('Registro iniciado. Por favor confirmá tu correo electrónico antes de completar el perfil.');
        this.loading = false;
        this.router.navigate(['/login']);
        return;
      }

      // Subir imágenes a Supabase Storage
      let imageUrl1 = '';
      let imageUrl2 = '';

      try {
        if (this.profileImage1) {
          imageUrl1 = await this.supabase.uploadProfileImage(this.profileImage1, userId);
        }
        if (this.profileImage2) {
          imageUrl2 = await this.supabase.uploadProfileImage(this.profileImage2, userId);
        }
      } catch (imgError) {
        console.error('Error al subir imágenes:', imgError);
        this.messageService.showError('Error al subir las imágenes. Por favor intenta nuevamente.');
        this.loading = false;
        return;
      }

      // Crear o actualizar el perfil
      const finalSpecialty = this.showCustomSpecialty ? this.customSpecialty : this.specialty;
      const profileData = {
        role: this.role,
        email: this.email,
        name: this.name,
        last_name: this.last_name,
        age: this.age,
        dni: this.dni,
        is_approved: this.role === 'specialist' ? false : true,
        profile_image_url: imageUrl1 || null
      };

      // Verificar si ya existe un perfil (creado por el trigger)
      const existingProfile = await this.supabase.getProfile(userId);
      
      if (existingProfile) {
        // Actualizar el perfil existente
        await this.supabase.updateProfile(userId, profileData);
      } else {
        // Crear nuevo perfil
        await this.supabase.createProfile({ id: userId, ...profileData });
      }

      // Guardar segunda imagen en user_images si es paciente
      if (this.role === 'patient' && imageUrl2) {
        try {
          await this.supabase.createUserImage({
            user_id: userId,
            image_url: imageUrl2,
            image_type: 'profile'
          });
        } catch (e) {
          console.warn('No se pudo guardar la segunda imagen:', e);
        }
      }

      // Crear datos específicos del rol
      if (this.role === 'patient') {
        try {
          await this.supabase.createPatientData({
            user_id: userId,
            health_insurance: this.health_insurance || ''
          });
        } catch (e) {
          console.warn('No se pudo crear patients_data:', e);
        }
      } else if (this.role === 'specialist') {
        // Si es especialidad personalizada, crearla primero
        let specialtyId = null;
        
        if (this.showCustomSpecialty && this.customSpecialty) {
          try {
            const newSpecialty = await this.supabase.createSpecialty(this.customSpecialty);
            specialtyId = newSpecialty[0].id;
          } catch (e) {
            console.warn('No se pudo crear la especialidad personalizada:', e);
          }
        } else if (this.specialty) {
          // Buscar el ID de la especialidad seleccionada
          const found = this.specialities.find(s => s.name === this.specialty);
          specialtyId = found ? found.id : null;
        }

        try {
          await this.supabase.createSpecialistData({
            user_id: userId,
            specialty_id: specialtyId,
            is_approved: false
          });
        } catch (e) {
          console.warn('No se pudo crear specialists_data:', e);
        }
      }

      this.messageService.showSuccess('Registro completado exitosamente. Por favor confirmá tu correo electrónico para iniciar sesión.');
      this.router.navigate(['/login']);
    } catch (err: any) {
      console.error('Error al registrarse:', err);
      this.messageService.showError('Error al registrarse: ' + (err.message || err));
    } finally {
      this.loading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goBackWithConfirmation() {
    if (this.email || this.password || this.name || this.last_name || this.dni || this.profileImage1 || this.profileImage2) {
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

  onCaptchaValidated(isValid: boolean) {
    this.captchaValid = isValid;
  }

  // Convertir archivo a Base64 para guardar temporalmente en localStorage
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
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

  validateName() {
    this.nameTouched = true;
    
    if (!this.name) {
      this.nameError = 'El nombre es obligatorio';
    } else if (this.name.length < 2) {
      this.nameError = 'El nombre debe tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.name)) {
      this.nameError = 'El nombre solo puede contener letras';
    } else {
      this.nameError = '';
    }
  }

  validateLastName() {
    this.lastNameTouched = true;
    
    if (!this.last_name) {
      this.lastNameError = 'El apellido es obligatorio';
    } else if (this.last_name.length < 2) {
      this.lastNameError = 'El apellido debe tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.last_name)) {
      this.lastNameError = 'El apellido solo puede contener letras';
    } else {
      this.lastNameError = '';
    }
  }

  validateAge() {
    this.ageTouched = true;
    
    if (!this.age) {
      this.ageError = 'La edad es obligatoria';
    } else if (this.age < 1 || this.age > 120) {
      this.ageError = 'Por favor ingresá una edad válida (1-120)';
    } else {
      this.ageError = '';
    }
  }

  validateDni() {
    this.dniTouched = true;
    
    if (!this.dni) {
      this.dniError = 'El DNI es obligatorio';
    } else if (!/^\d{7,8}$/.test(this.dni)) {
      this.dniError = 'El DNI debe tener 7 u 8 dígitos';
    } else {
      this.dniError = '';
    }
  }

  validateHealthInsurance() {
    this.healthInsuranceTouched = true;
    
    if (this.role === 'patient') {
      if (!this.health_insurance) {
        this.healthInsuranceError = 'La obra social es obligatoria para pacientes';
      } else if (this.health_insurance.length < 2) {
        this.healthInsuranceError = 'La obra social debe tener al menos 2 caracteres';
      } else {
        this.healthInsuranceError = '';
      }
    } else {
      this.healthInsuranceError = '';
    }
  }

  validateSpecialty() {
    this.specialtyTouched = true;
    
    if (this.role === 'specialist') {
      const finalSpecialty = this.showCustomSpecialty ? this.customSpecialty : this.specialty;
      if (!finalSpecialty) {
        this.specialtyError = 'Debe seleccionar o ingresar una especialidad';
      } else {
        this.specialtyError = '';
      }
    } else {
      this.specialtyError = '';
    }
  }

  isFormValid(): boolean {
    return !this.emailError && !this.passwordError && !this.nameError && 
           !this.lastNameError && !this.ageError && !this.dniError &&
           (this.role !== 'patient' || !this.healthInsuranceError) &&
           (this.role !== 'specialist' || !this.specialtyError) &&
           this.email !== '' && this.password !== '' && this.name !== '' &&
           this.last_name !== '' && this.age !== null && this.dni !== '' &&
           this.captchaValid;
  }
}
