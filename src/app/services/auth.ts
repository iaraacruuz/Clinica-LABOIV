import { Injectable, signal } from '@angular/core';

// Interfaz que simula el objeto de Sesión (similar a User de Firebase, pero más simple)
export interface SessionUser {
    uid: string;
    email: string;
    emailVerified: boolean;
}

// Interfaz para la data extra del usuario (perfil, estado de aprobación)
export interface UserData {
    perfil: 'paciente' | 'especialista' | 'administrador';
    // Campos del registro proporcionados por el usuario
    nombre: string;
    apellido: string;
    dni: string;
    edad: number;
    estado: 'activo' | 'pendiente_aprobacion' | 'inactivo'; // Usado para la aprobación
    
    // Campos específicos (pueden ser opcionales)
    obraSocial?: string | null; 
    especialidad?: string | null;
    imagenPerfil1?: string | null; 
    imagenPerfil2?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    
    // Base de datos (DB) / Supabase SIMULADA en memoria para este entorno
    private simulatedDB = new Map<string, UserData>();
    private simulatedAuth = new Map<string, { email: string, password: string, emailVerified: boolean }>();
    
    // Estado de la sesión actual
    public currentUser = signal<SessionUser | null>(null);
    public isAuthReady = signal<boolean>(true); // Siempre listo ya que no hay inicialización asíncrona de Firebase
    
    // UID de prueba para simular los diferentes perfiles
    private readonly UIDS_PRUEBA = {
        ADMIN: 'admin_uid_001',
        ESP_APROBADO: 'esp_aprobado_uid_002',
        PAC_VERIFICADO: 'pac_verificado_uid_003',
        ESP_PENDIENTE: 'esp_pendiente_uid_004',
        PAC_NO_VERIF: 'pac_noverif_uid_005'
    };

    constructor() {
        // Inicializamos los datos de prueba en las simulaciones
        this.inicializarDatosSimulados();
    }

    /**
     * Inicializa los datos de prueba en la DB y Auth simuladas.
     */
    private inicializarDatosSimulados() {
        
        // 1. Datos de Autenticación Simulados (Supabase Auth)
        this.simulatedAuth.set('admin@clinic.com', { email: 'admin@clinic.com', password: '123456', emailVerified: true });
        this.simulatedAuth.set('especialista.aprobado@clinic.com', { email: 'especialista.aprobado@clinic.com', password: '123456', emailVerified: true });
        this.simulatedAuth.set('paciente.verificado@clinic.com', { email: 'paciente.verificado@clinic.com', password: '123456', emailVerified: true });
        this.simulatedAuth.set('especialista.pendiente@clinic.com', { email: 'especialista.pendiente@clinic.com', password: '123456', emailVerified: true });
        this.simulatedAuth.set('paciente.noverificado@clinic.com', { email: 'paciente.noverificado@clinic.com', password: '123456', emailVerified: false });
        
        // 2. Datos de Perfil Simulados (Supabase DB)
        // Usamos los emails para mapear a UIDs en la DB simulada.
        
        // Admin: siempre activo
        this.simulatedDB.set(this.UIDS_PRUEBA.ADMIN, { perfil: 'administrador', nombre: 'Admin', apellido: 'User', dni: '0', edad: 99, estado: 'activo' });
        // Especialista Aprobado: estado activo
        this.simulatedDB.set(this.UIDS_PRUEBA.ESP_APROBADO, { perfil: 'especialista', nombre: 'Esp.', apellido: 'Aprobado', dni: '1', edad: 30, estado: 'activo', especialidad: 'Kinesiología' });
        // Paciente: estado activo
        this.simulatedDB.set(this.UIDS_PRUEBA.PAC_VERIFICADO, { perfil: 'paciente', nombre: 'Pac.', apellido: 'Verificado', dni: '2', edad: 45, estado: 'activo', obraSocial: 'OSDE' });
        // Especialista Pendiente (para probar la restricción de Login): estado pendiente_aprobacion
        this.simulatedDB.set(this.UIDS_PRUEBA.ESP_PENDIENTE, { perfil: 'especialista', nombre: 'Esp.', apellido: 'Pendiente', dni: '3', edad: 35, estado: 'pendiente_aprobacion', especialidad: 'Odontología' });
        // Paciente No Verificado: Le asignamos el mismo UID que el no verificado en Auth Simulado
        this.simulatedDB.set(this.UIDS_PRUEBA.PAC_NO_VERIF, { perfil: 'paciente', nombre: 'Pac.', apellido: 'No Verificado', dni: '4', edad: 22, estado: 'activo', obraSocial: 'OSDE' });
    }
    
    /**
     * Realiza el inicio de sesión simulado (Llamada a la API de Supabase Auth).
     */
    async iniciarSesion(email: string, password: string): Promise<SessionUser> {
        // Simulación de latencia de red
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        const authData = this.simulatedAuth.get(email);

        if (!authData || authData.password !== password) {
            // Lógica real: throw new Error('Credenciales inválidas');
            throw { code: 'auth/invalid-credential', message: 'Credenciales inválidas' }; 
        }
        
        // Simulación de la respuesta exitosa de Supabase/Backend
        // Asignamos un UID de prueba basado en el email para que el login componente funcione
        let uid = this.getSimulatedUidByEmail(email);

        const sessionUser: SessionUser = {
            uid: uid,
            email: authData.email,
            emailVerified: authData.emailVerified
        };
        
        this.currentUser.set(sessionUser);
        return sessionUser;
    }
    
    /**
     * Simula la creación de usuario en Supabase Auth y el guardado de datos en Supabase DB.
     */
    async registrarUsuario(mail: string, password: string, datosUsuario: Omit<UserData, 'estado'>): Promise<void> {
        
        try {
            // PASO 1: CREAR USUARIO EN SUPABASE AUTH (Simulado)
            // Lógica real: await supabase.auth.signUp({ email, password });
            if (this.simulatedAuth.has(mail)) {
                 throw new Error('El correo ya está registrado.');
            }
            
            // Simulación de UID nuevo
            const newUid = `user_new_${Date.now()}`;

            // PASO 2: SUPABASE ENVÍA EMAIL DE VERIFICACIÓN (Simulado, por defecto NO verificado)
            this.simulatedAuth.set(mail, { email: mail, password: password, emailVerified: false });
            
            // Determinar el estado inicial
            let estado: UserData['estado'] = 'activo'; 
            if (datosUsuario.perfil === 'especialista') {
                estado = 'pendiente_aprobacion'; 
            }
            
            // Datos completos a guardar
            const userDataToSave: UserData = {
                ...datosUsuario, 
                estado: estado, 
            };

            // PASO 3: GUARDAR DATOS ADICIONALES EN SUPABASE DB (Simulado)
            // Lógica real: await supabase.from('perfiles').insert([{ uid: newUid, ...userDataToSave }]);
            this.simulatedDB.set(newUid, userDataToSave);

            console.log(`Registro exitoso para ${datosUsuario.perfil} (UID: ${newUid}). Datos guardados en Supabase simulado.`);
            
            await this.cerrarSesion();
            
        } catch (error: any) {
            console.error("Error en el registro:", error);
            throw error; 
        }
    }


    /**
     * CIERRA la sesión del usuario (Simulación de Supabase Auth).
     */
    cerrarSesion() {
        this.currentUser.set(null);
        return Promise.resolve();
    }
    
    /**
     * Obtiene los datos adicionales del usuario (perfil, estado) desde Supabase (Simulado).
     */
    async getUserData(uid: string): Promise<UserData | null> {
        if (!uid) return null;

        // Lógica real: const { data } = await supabase.from('perfiles').select('*').eq('uid', uid).single();
        // Simulación:
        const data = this.simulatedDB.get(uid);
        
        // Simulación de latencia de red
        await new Promise(resolve => setTimeout(resolve, 100)); 

        return data || null; 
    }
    
    /**
     * Método auxiliar para mapear emails de prueba a UIDs fijos para la simulación.
     */
    private getSimulatedUidByEmail(email: string): string {
        switch(email) {
            case 'admin@clinic.com': return this.UIDS_PRUEBA.ADMIN;
            case 'especialista.aprobado@clinic.com': return this.UIDS_PRUEBA.ESP_APROBADO;
            case 'paciente.verificado@clinic.com': return this.UIDS_PRUEBA.PAC_VERIFICADO;
            case 'especialista.pendiente@clinic.com': return this.UIDS_PRUEBA.ESP_PENDIENTE;
            case 'paciente.noverificado@clinic.com': return this.UIDS_PRUEBA.PAC_NO_VERIF;
            default: return `user_dynamic_${Date.now()}`;
        }
    }
}
