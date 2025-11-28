import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

interface SessionUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

export interface UserProfileData {
  id: string; 
  role: 'admin' | 'specialist' | 'patient';
  email: string;
  name: string;
  last_name: string;
  age: number;
  dni: string;
  is_approved: boolean; 
  profile_image_url: string | null;
  obra_social?: string | null;
  especialidad?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // 🔹 Renombramos la señal para evitar conflictos con el método
  public _currentUser = signal<SessionUser | null>(null); 
  public isAuthReady = signal<boolean>(false);
  
  // Lock para evitar múltiples logins simultáneos
  private loginLock = false;

  constructor(private supabaseSvc: SupabaseService) {
    this.verificarSesion();
  }

  private async verificarSesion() {
    const data = await this.supabaseSvc.getSession();
    if (data?.user) {
      this._currentUser.set({
        uid: (data as any).user.id,
        email: (data as any).user.email!,
        emailVerified: (data as any).user.email_confirmed_at !== null
      });
    }
    this.isAuthReady.set(true);
  }

  // ================= REGISTRO =================
  async registrarUsuario(mail: string, password: string, datosRegistro: any): Promise<void> {
    const result = await this.supabaseSvc.register(mail, password);
    if (result.error) throw result.error;
    localStorage.setItem('pendingProfile', JSON.stringify({ mail, datosRegistro }));
  }

  // ================= LOGIN =================
  async iniciarSesion(email: string, password: string): Promise<SessionUser> {
    // Prevent concurrent login attempts
    if (this.loginLock) {
      throw new Error('LOGIN_IN_PROGRESS');
    }
    this.loginLock = true;

    try {
      const { data, error } = await this.supabaseSvc.login(email, password);
      if (error) throw error;


      const user = data.user;
      if (!user) throw new Error('USER_NOT_FOUND');

      // If there is a pending profile (from registration), create it now
      try {
        await this.crearPerfilDesdeRegistro(user);
      } catch (e) {
        console.warn('Error creating pending profile after login:', e);
      }
      
      // Esperar para que la BD se sincronice
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Intentar obtener perfil (usa caché si está disponible)
      let userProfile = await this.supabaseSvc.getUserData(user.id);

      // Si no existe, crear perfil básico automático

      if (!userProfile) {
        await this.crearPerfilBasico(user);
        // Esperar y reintentar
        await new Promise(resolve => setTimeout(resolve, 800));
        userProfile = await this.supabaseSvc.getUserData(user.id);
      }

      if (!userProfile) {
        throw new Error('PROFILE_CREATION_FAILED');
      }

      // Validación de email confirmado
      const emailConfirmed = !!user.email_confirmed_at;
      
      // PACIENTES: Requieren email verificado
      if (userProfile.role === 'patient' && !emailConfirmed) {
        await this.supabaseSvc.logout();
        throw new Error('EMAIL_UNVERIFIED');
      }

      // ESPECIALISTAS: Solo requieren aprobación del admin
      // El email se auto-confirma por trigger SQL
      if (userProfile.role === 'specialist') {
        if (!userProfile.is_approved) {
          await this.supabaseSvc.logout();
          throw new Error('SPECIALIST_NOT_APPROVED');
        }
      }

      // ADMINISTRADORES: También requieren aprobación de otro admin
      // El email se auto-confirma por trigger SQL
      if (userProfile.role === 'admin') {
        if (!userProfile.is_approved) {
          await this.supabaseSvc.logout();
          throw new Error('ADMIN_NOT_APPROVED');
        }
      }

      const sessionUser: SessionUser = {
        uid: user.id,
        email: user.email!,
        emailVerified: true
      };

      this._currentUser.set(sessionUser);
      return sessionUser;
    } finally {
      this.loginLock = false;
    }
  }

  // ================= PERFIL AUTOMÁTICO PARA USUARIOS VIEJOS =================
  private async crearPerfilBasico(user: any) {
    const perfil = {
      id: user.id,
      email: user.email,
      role: 'patient',
      name: 'Sin nombre',
      last_name: 'Sin apellido',
      age: 0,
      dni: '00000000',
      is_approved: true,
      profile_image_url: null
    };
    const { error } = await this.supabaseSvc.createProfile(perfil) as any;
    if (error) {
      console.error('Error creando perfil básico:', error);
      throw error;
    }
  }

  // ================= CREAR PERFIL DESDE REGISTRO =================
  private async crearPerfilDesdeRegistro(user: any) {
    const stored = localStorage.getItem('pendingProfile');
    if (!stored) return;
    
    const { datosRegistro } = JSON.parse(stored);

    try {
      // Verificar si el perfil ya existe
      const existingProfile = await this.supabaseSvc.getProfile(user.id);
      if (existingProfile) {
        console.log('Profile already exists, skipping creation');
        localStorage.removeItem('pendingProfile');
        return;
      }

      const perfil = {
        id: user.id,
        role: datosRegistro.perfil,
        email: user.email,
        name: datosRegistro.nombre,
        last_name: datosRegistro.apellido,
        age: datosRegistro.edad,
        dni: datosRegistro.dni,
        is_approved: datosRegistro.perfil === 'specialist' ? false : true,
        profile_image_url: datosRegistro.imagenPerfil1URL || null
      };

      // Create base profile first
      const { error: profileError } = await this.supabaseSvc.createProfile(perfil) as any;
      if (profileError) {
        // Si es error 409 (conflict), el perfil ya existe
        if (profileError.code === '23505' || profileError.code === '409') {
          console.log('Profile already exists (conflict), skipping creation');
          localStorage.removeItem('pendingProfile');
          return;
        }
        console.error('Error creating profile from pending:', profileError);
        return;
      }

      // Create role-specific data
      if (datosRegistro.perfil === 'patient') {
        await this.supabaseSvc.createPatientData({
          user_id: user.id,
          health_insurance: datosRegistro.obraSocial || ''
        });
      } else if (datosRegistro.perfil === 'specialist') {
        // Try to resolve specialty id by name
        try {
          const specialties = await this.supabaseSvc.getSpecialties();
          const found = (specialties || []).find((s: any) => s.name === datosRegistro.especialidad || s.id === datosRegistro.especialidad);
          const specialty_id = found ? found.id : null;
          await this.supabaseSvc.createSpecialistData({
            user_id: user.id,
            specialty_id,
            is_approved: false
          });
        } catch (e) {
          console.warn('Could not create specialists_data for pending profile:', e);
        }
      }

      localStorage.removeItem('pendingProfile');
    } catch (error) {
      console.error('Error in crearPerfilDesdeRegistro:', error);
    }
  }

  // ================= LOGOUT =================
  async cerrarSesion() {
    await this.supabaseSvc.logout();
    this._currentUser.set(null);
  }

  // ================= OBTENER PERFIL =================
  // Nota: getUserData se delega a SupabaseService.getUserData
  // 🔹 Método para obtener currentUser sin conflicto
  currentUser(): SessionUser | null {
    return this._currentUser();
  }

  // Delegated helper to fetch profile data by uid
  async getUserData(uid: string): Promise<UserProfileData | null> {
    return this.supabaseSvc.getUserData(uid);
  }

  // Espera a que la señal isAuthReady sea true
  waitAuthReady(): Promise<void> {
    return new Promise(resolve => {
      if (this.isAuthReady()) resolve();
      const check = setInterval(() => {
        if (this.isAuthReady()) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }
}
