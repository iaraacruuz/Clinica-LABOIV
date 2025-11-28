import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CaptchaComponent } from '../../shared/captcha/captcha';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-aprobar-especialistas',
  standalone: true,
  imports: [CommonModule, FormsModule, CaptchaComponent],
  templateUrl: './aprobar-especialistas.html'
})
export class AprobarEspecialistasComponent implements OnInit {

  specialists: any[] = [];
  filteredSpecialists: any[] = [];

  filtroPendientes: boolean = false;
  searchTerm: string = '';
  loading: boolean = false;
  captchaValid: boolean = true;
  
  newUser: any = {
    role: 'specialist',
    name: '',
    last_name: '',
    age: null,
    dni: '',
    email: '',
    password: '',
    specialty: '',
    health_insurance: ''
  };
  specialities: any[] = [];
  
  newUserImage1: File | null = null;
  newUserImage2: File | null = null;

  constructor(private supabase: SupabaseService, private router: Router, private messageService: MessageService) {}

  async ngOnInit() {
    await Promise.all([this.loadSpecialists(), this.loadSpecialties()]);
  }

  async loadSpecialists() {
    this.loading = true;
    try {
      // Get all specialists from profiles
      const { data: profiles } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('role', 'specialist');

      // For each specialist, get their specialty name
      const specialistsWithData = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            const specData = await this.supabase.getSpecialistData(profile.id);
            if (specData && specData.specialty_id) {
              // Get specialty name
              const { data: specialty } = await this.supabase.client
                .from('specialties')
                .select('name')
                .eq('id', specData.specialty_id)
                .maybeSingle();
              return {
                ...profile,
                especialidad: specialty?.name || 'No especificada',
                specialty_id: specData.specialty_id
              };
            }
          } catch (e) {
            console.warn('Error loading specialist data for', profile.id, e);
          }
          return {
            ...profile,
            especialidad: 'No especificada',
            specialty_id: null
          };
        })
      );

      this.specialists = specialistsWithData;
      this.applyFilters();
    } catch (err) {
      console.error('Error loading specialists:', err);
      this.messageService.showError('Error al cargar especialistas');
    } finally {
      this.loading = false;
    }
  }

  async loadSpecialties() {
    try {
      const data = await this.supabase.getSpecialties();
      if (data && data.length > 0) {
        this.specialities = data;
      }
    } catch (e) {
      console.warn('No se pudieron cargar especialidades en admin:', e);
    }
  }

  applyFilters() {
    this.filteredSpecialists = this.specialists.filter(esp => {

      const coincideNombre =
        (esp.name + ' ' + esp.last_name)
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase());

      const coincideEstado =
        !this.filtroPendientes || !esp.is_approved;

      return coincideNombre && coincideEstado;
    });
  }

  async toggleApproval(user: any) {
    try {
      await this.supabase.approveSpecialist(user.id, !user.is_approved);
      await this.loadSpecialists();
    } catch (err) {
      console.error('Error toggling approval:', err);
      this.messageService.showError('Error al cambiar estado de aprobación');
    }
  }

  // Create a new user from admin panel
  async createUser() {
    this.loading = true;
    try {
      if (!this.newUser.name || !this.newUser.last_name) {
        this.messageService.showWarning('Nombre y apellido son obligatorios');
        this.loading = false;
        return;
      }

      if (!this.newUser.age || this.newUser.age <= 0) {
        this.messageService.showWarning('Por favor ingresá una edad válida');
        this.loading = false;
        return;
      }

      if (!this.newUser.dni || this.newUser.dni.length < 7) {
        this.messageService.showWarning('Por favor ingresá un DNI válido');
        this.loading = false;
        return;
      }

      if (!this.newUser.email || !this.newUser.password) {
        this.messageService.showWarning('Email y password son obligatorios');
        this.loading = false;
        return;
      }

      if (this.newUser.role === 'patient' && (!this.newUserImage1 || !this.newUserImage2)) {
        this.messageService.showWarning('Los pacientes deben tener 2 imágenes de perfil');
        this.loading = false;
        return;
      }
      if ((this.newUser.role === 'specialist' || this.newUser.role === 'admin') && !this.newUserImage1) {
        this.messageService.showWarning('Debe cargar al menos 1 imagen de perfil');
        this.loading = false;
        return;
      }

      // Validar especialidad para especialistas
      if (this.newUser.role === 'specialist' && !this.newUser.specialty) {
        this.messageService.showWarning('Debe seleccionar una especialidad para el especialista');
        this.loading = false;
        return;
      }

      // Validar obra social para pacientes
      if (this.newUser.role === 'patient' && !this.newUser.health_insurance) {
        this.messageService.showWarning('Debe ingresar la obra social del paciente');
        this.loading = false;
        return;
      }

      const res: any = await this.supabase.register(this.newUser.email, this.newUser.password, { role: this.newUser.role });
      if (res.error) throw res.error;

      // Try to obtain created user id
      const userId = res?.data?.user?.id ?? (await this.supabase.getCurrentUser())?.id ?? null;

      if (!userId) {
        // If signup requires email confirmation, signUp may not return user id.
        // Save a pending item for admin to be aware.
        const pending = { email: this.newUser.email, datosRegistro: {
          perfil: this.newUser.role,
          nombre: this.newUser.name,
          apellido: this.newUser.last_name,
          edad: this.newUser.age,
          dni: this.newUser.dni,
          obraSocial: this.newUser.health_insurance,
          especialidad: this.newUser.specialty
        }};
        const arr = JSON.parse(localStorage.getItem('adminPendingProfiles') || '[]');
        arr.push(pending);
        localStorage.setItem('adminPendingProfiles', JSON.stringify(arr));
        this.messageService.showInfo('Usuario creado en Auth. El usuario debe confirmar su correo electrónico; aparecerá en la lista una vez confirme e inicie sesión.');
        this.resetNewUser();
        this.loading = false;
        return;
      }

      // Subir imágenes a Supabase Storage
      let imageUrl1 = '';
      let imageUrl2 = '';

      try {
        if (this.newUserImage1) {
          imageUrl1 = await this.supabase.uploadProfileImage(this.newUserImage1, userId);
        }
        if (this.newUserImage2) {
          imageUrl2 = await this.supabase.uploadProfileImage(this.newUserImage2, userId);
        }
      } catch (imgError) {
        console.error('Error al subir imágenes:', imgError);
        this.messageService.showWarning('Usuario creado pero hubo un error al subir las imágenes.');
      }

      // Create or update profile row. The auth trigger may have already
      // inserted a minimal profile (default role 'patient'). In that case
      // update it to reflect the admin-chosen role and fields.
      const profile: any = {
        role: this.newUser.role,
        email: this.newUser.email,
        name: this.newUser.name || '',
        last_name: this.newUser.last_name || '',
        age: this.newUser.age || 0,
        dni: this.newUser.dni || '',
        is_approved: this.newUser.role === 'specialist' ? false : true,
        profile_image_url: imageUrl1 || null
      };

      // Check if profile exists
      const existingProfile = await this.supabase.getProfile(userId);
      if (existingProfile) {
        // Update existing profile
        await this.supabase.updateProfile(userId, profile);
      } else {
        // Create new profile with explicit id
        const toCreate = { id: userId, ...profile };
        const { error: profErr } = await (this.supabase.createProfile(toCreate) as any);
        if (profErr) throw profErr;
      }

      // Guardar segunda imagen en user_images si es paciente
      if (this.newUser.role === 'patient' && imageUrl2) {
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

      // Role specific data: try to update if exists, otherwise create
      if (this.newUser.role === 'specialist') {
        const found = (this.specialities || []).find(s => s.name === this.newUser.specialty || s.id === this.newUser.specialty);
        const specialty_id = found ? found.id : null;

        // Try update; if update returns error or 0 affected rows, create
        try {
          await this.supabase.updateSpecialistData(userId, { specialty_id, is_approved: false });
        } catch (e) {
          // create if update fails
          try {
            await this.supabase.createSpecialistData({ user_id: userId, specialty_id, is_approved: false });
          } catch (e2) {
            console.warn('No se pudo crear specialists_data:', e2);
          }
        }
      } else if (this.newUser.role === 'patient') {
        try {
          await this.supabase.updatePatientData(userId, { health_insurance: this.newUser.health_insurance || '' });
        } catch (e) {
          try {
            await this.supabase.createPatientData({ user_id: userId, health_insurance: this.newUser.health_insurance || '' });
          } catch (e2) {
            console.warn('No se pudo crear patients_data:', e2);
          }
        }
      }

      this.messageService.showSuccess('Usuario creado y perfil guardado correctamente.');
      await this.loadSpecialists();
      this.resetNewUser();
    } catch (e: any) {
      console.error('Error creando usuario desde admin:', e);
      this.messageService.showError('Error creando usuario: ' + (e.message || e));
    } finally {
      this.loading = false;
    }
  }

  resetNewUser() {
    this.newUser = {
      role: 'specialist',
      name: '',
      last_name: '',
      age: null,
      dni: '',
      email: '',
      password: '',
      specialty: '',
      health_insurance: ''
    };
    this.newUserImage1 = null;
    this.newUserImage2 = null;
    this.captchaValid = false;
  }

  onCaptchaValidated(isValid: boolean) {
    this.captchaValid = isValid;
  }

  onAdminFileSelected(event: any, imageNumber: 1 | 2) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.messageService.showWarning('Por favor selecciona un archivo de imagen válido');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.messageService.showWarning('La imagen no debe superar los 5MB');
        return;
      }
      if (imageNumber === 1) {
        this.newUserImage1 = file;
      } else {
        this.newUserImage2 = file;
      }
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  // Call admin endpoint to confirm a user's email (requires adminApiBase set)
  // (confirmEmail removed — confirmation handled manually in Supabase or via service role script)
}
