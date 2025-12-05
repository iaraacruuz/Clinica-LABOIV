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

  public _currentUser = signal<SessionUser | null>(null); 
  public isAuthReady = signal<boolean>(false);
  private loginLock = false;

  constructor(private supabaseSvc: SupabaseService) {
    this.verificarSesion();
  }

  /** Verifica si existe una sesión activa y actualiza el estado del usuario */
  private async verificarSesion() {
    try {
      const user = await this.supabaseSvc.getCurrentUser();
      if (user) {
        this._currentUser.set({
          uid: user.id,
          email: user.email!,
          emailVerified: !!user.email_confirmed_at
        });
      } else {
        this._currentUser.set(null);
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
      this._currentUser.set(null);
    } finally {
      this.isAuthReady.set(true);
    }
  }

  /** Registra un nuevo usuario en el sistema */
  async registrarUsuario(mail: string, password: string, datosRegistro: any): Promise<void> {
    const result = await this.supabaseSvc.register(mail, password);
    if (result.error) throw result.error;
    localStorage.setItem('pendingProfile', JSON.stringify({ mail, datosRegistro }));
  }

  /** Inicia sesión del usuario validando credenciales, perfil y permisos según su rol */
  async iniciarSesion(email: string, password: string): Promise<SessionUser> {
    if (this.loginLock) {
      throw new Error('LOGIN_IN_PROGRESS');
    }
    this.loginLock = true;

    try {
      const { data, error } = await this.supabaseSvc.login(email, password);
      if (error) throw error;


      const user = data.user;
      if (!user) throw new Error('USER_NOT_FOUND');

      try {
        await this.crearPerfilDesdeRegistro(user);
      } catch (e) {
        console.warn('Error creating pending profile after login:', e);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let userProfile = await this.supabaseSvc.getUserData(user.id);

      if (!userProfile) {
        await this.crearPerfilBasico(user);
        // Esperar y reintentar
        await new Promise(resolve => setTimeout(resolve, 800));
        userProfile = await this.supabaseSvc.getUserData(user.id);
      }

      if (!userProfile) {
        throw new Error('PROFILE_CREATION_FAILED');
      }

      const emailConfirmed = !!user.email_confirmed_at;
      
      if (userProfile.role === 'patient' && !emailConfirmed) {
        await this.supabaseSvc.logout();
        throw new Error('EMAIL_UNVERIFIED');
      }

      if (userProfile.role === 'specialist') {
        if (!userProfile.is_approved) {
          await this.supabaseSvc.logout();
          throw new Error('SPECIALIST_NOT_APPROVED');
        }
      }

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
      
      await this.registerLoginLog(user.id, user.email!, userProfile.role);
      
      return sessionUser;
    } finally {
      this.loginLock = false;
    }
  }

  /** Registra el ingreso del usuario en los logs del sistema */
  private async registerLoginLog(userId: string, email: string, role: string) {
    try {
      await this.supabaseSvc.client
        .from('login_logs')
        .insert({
          user_id: userId,
          user_email: email,
          user_role: role,
          login_timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error registering login log:', error);
    }
  }

  /** Crea un perfil básico de paciente para usuarios sin perfil configurado */
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

  /** Crea el perfil del usuario utilizando los datos guardados durante el registro */
  private async crearPerfilDesdeRegistro(user: any) {
    const stored = localStorage.getItem('pendingProfile');
    if (!stored) return;
    
    const { datosRegistro } = JSON.parse(stored);

    try {
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

      const { error: profileError } = await this.supabaseSvc.createProfile(perfil) as any;
      if (profileError) {
        if (profileError.code === '23505' || profileError.code === '409') {
          console.log('Profile already exists (conflict), skipping creation');
          localStorage.removeItem('pendingProfile');
          return;
        }
        console.error('Error creating profile from pending:', profileError);
        return;
      }

      if (datosRegistro.perfil === 'patient') {
        await this.supabaseSvc.createPatientData({
          user_id: user.id,
          health_insurance: datosRegistro.obraSocial || ''
        });
      } else if (datosRegistro.perfil === 'specialist') {
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

  /** Cierra la sesión del usuario actual */
  async cerrarSesion() {
    await this.supabaseSvc.logout();
    this._currentUser.set(null);
  }

  /** Obtiene el usuario actualmente autenticado */
  currentUser(): SessionUser | null {
    return this._currentUser();
  }

  /** Obtiene los datos completos del perfil de un usuario */
  async getUserData(uid: string): Promise<UserProfileData | null> {
    return this.supabaseSvc.getUserData(uid);
  }

  /** Espera hasta que el estado de autenticación esté listo */
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
