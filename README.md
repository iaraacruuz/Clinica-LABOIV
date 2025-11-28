# 🏥 Clínica Online

## Descripción del Proyecto

**Clínica Online** es un sistema web de gestión de turnos médicos desarrollado con Angular 20 y Supabase. La plataforma permite a pacientes solicitar turnos, a especialistas gestionar sus consultas y a administradores coordinar toda la operación de la clínica.

### Información de la Clínica

La Clínica OnLine es especialista en salud y cuenta con:
- **6 consultorios** para atención médica
- **2 laboratorios** físicos en las instalaciones
- **1 sala de espera** general

**Horarios de atención:**
- Lunes a Viernes: 8:00 - 19:00
- Sábados: 8:00 - 14:00

**Características:**
- Turnos de 30 minutos (personalizables por especialista según especialidad)
- Profesionales con múltiples especialidades
- Sistema de administración centralizado

---

## 🚀 Tecnologías Utilizadas

- **Frontend:** Angular 20 (Standalone Components)
- **Backend/Database:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Storage:** Supabase Storage
- **Captcha:** Google reCAPTCHA v2
- **Estilos:** SCSS

---

## 📋 Funcionalidades por Rol

### 👤 Pacientes

**Acceso:**
- Registro con verificación de email
- Login una vez verificado el correo electrónico

**Funcionalidades:**
- ✅ Registro con datos personales (nombre, apellido, edad, DNI, obra social)
- ✅ Carga de 2 imágenes de perfil
- ✅ Solicitar turnos con especialistas
- ✅ Ver y gestionar sus turnos (Mis Turnos)
- ✅ Cancelar turnos con motivo
- ✅ Ver reseñas de consultas
- ✅ Calificar atención del especialista
- ✅ Completar encuestas de satisfacción
- ✅ Ver perfil personal con datos e imágenes

### 👨‍⚕️ Especialistas

**Acceso:**
- Registro con verificación de email
- Aprobación por parte del administrador
- Login una vez aprobado y verificado

**Funcionalidades:**
- ✅ Registro con datos profesionales
- ✅ Selección de especialidad (con opción de agregar nuevas)
- ✅ Carga de 1 imagen de perfil
- ✅ Ver turnos asignados (Mis Turnos)
- ✅ Aceptar/rechazar/cancelar turnos con motivo
- ✅ Finalizar turnos con reseña de la consulta
- ✅ Configurar disponibilidad horaria
- ✅ Ver perfil con especialidad

### 👨‍💼 Administradores

**Acceso:**
- Creados únicamente por otro administrador
- Login directo sin aprobaciones

**Funcionalidades:**
- ✅ Crear nuevos usuarios (pacientes, especialistas, administradores)
- ✅ Ver y gestionar todos los usuarios del sistema
- ✅ Aprobar/desaprobar especialistas
- ✅ Ver todos los turnos de la clínica
- ✅ Cancelar turnos con motivo
- ✅ Solicitar turnos en nombre de pacientes
- ✅ Ver estadísticas del sistema
- ✅ Panel de administración completo

---

## 🗂️ Estructura del Proyecto

### Páginas Principales

#### 🏠 **Home (Página de Bienvenida)**
- **Ruta:** `/`
- **Acceso:** Público
- **Descripción:** Landing page con información de la clínica
- **Acciones:**
  - Botón "Ingresar al Sistema" → Login
  - Botón "Crear Cuenta Nueva" → Registro

#### 🔐 **Login**
- **Ruta:** `/login`
- **Acceso:** Público
- **Descripción:** Página de inicio de sesión
- **Elementos:**
  - Campos: Email, Contraseña
  - Botones de acceso rápido (Paciente/Especialista/Admin - para testing)
  - Link a registro
  - Botón volver atrás con confirmación

#### 📝 **Registro**
- **Ruta:** `/registro`
- **Acceso:** Público
- **Descripción:** Formulario de registro para pacientes y especialistas
- **Elementos:**
  - Selector de rol (Paciente/Especialista)
  - Campos comunes: Nombre, Apellido, Edad, DNI, Email, Contraseña
  - **Pacientes:** Obra Social + 2 imágenes
  - **Especialistas:** Especialidad (selección o personalizada) + 1 imagen
  - **Google reCAPTCHA** obligatorio
  - Validaciones en tiempo real
  - Link a login

#### 📊 **Dashboard**
- **Ruta:** `/dashboard`
- **Acceso:** Usuarios autenticados
- **Descripción:** Panel principal según el rol del usuario

**Vista Administrador:**
- Estadísticas del sistema (total especialistas, pendientes, aprobados, pacientes)
- Acceso a gestión de especialistas
- Acceso a estadísticas detalladas

**Vista Especialista:**
- Tarjetas de acceso rápido a turnos y perfil
- Resumen de actividad

**Vista Paciente:**
- Tarjetas de acceso rápido a solicitar turno y perfil
- Información de turnos próximos

#### 📅 **Mis Turnos** *(En desarrollo - Sprint 2)*
- **Ruta:** `/dashboard` → Sección "Mis Turnos"
- **Acceso:** Pacientes y Especialistas
- **Descripción:** Lista de turnos con filtros y acciones según rol

**Paciente puede:**
- Filtrar por especialidad/especialista (sin combobox)
- Cancelar turno (con motivo)
- Ver reseña
- Calificar atención
- Completar encuesta

**Especialista puede:**
- Filtrar por especialidad/paciente (sin combobox)
- Aceptar turno
- Rechazar turno (con motivo)
- Cancelar turno (con motivo)
- Finalizar turno (con reseña)
- Ver reseña

#### 🩺 **Solicitar Turno** *(En desarrollo - Sprint 2)*
- **Acceso:** Pacientes y Administradores
- **Descripción:** Formulario para agendar turnos
- **Proceso:**
  1. Seleccionar especialidad
  2. Seleccionar especialista
  3. Elegir día (próximos 15 días)
  4. Elegir horario (según disponibilidad del especialista)
- **NO usa datepicker** (selector manual de fechas)
- Administradores deben seleccionar también el paciente

#### ⚙️ **Mi Perfil**
- **Ruta:** `/dashboard` → Sección "Mi Perfil"
- **Acceso:** Todos los usuarios autenticados
- **Descripción:** Información personal del usuario
- **Elementos:**
  - Foto de perfil
  - Datos personales (nombre, apellido, email, DNI, edad)
  - **Pacientes:** Obra social
  - **Especialistas:** Especialidad + Configuración de horarios

#### 👥 **Gestión de Usuarios** (Admin)
- **Ruta:** `/dashboard` → Sección "Gestionar Especialistas"
- **Acceso:** Solo Administradores
- **Descripción:** Panel para administrar especialistas
- **Funcionalidades:**
  - Ver lista de todos los especialistas
  - Aprobar/desaprobar especialistas
  - Filtrar por nombre y estado (pendientes)
  - Crear nuevos usuarios (cualquier rol)
  - **Google reCAPTCHA** en creación de usuarios

---

## 🔒 Sistema de Autenticación

### Estados de Usuario

| Rol | Verificación Email | Aprobación Admin | Puede Ingresar |
|-----|-------------------|------------------|----------------|
| Paciente | ✅ Requerida | ❌ No requerida | Sí (con email verificado) |
| Especialista | ✅ Requerida | ✅ Requerida | Sí (ambas condiciones) |
| Administrador | ❌ No requerida | ❌ No requerida | Sí (inmediato) |

### Flujo de Registro

**Pacientes:**
1. Completan formulario de registro + captcha
2. Reciben email de verificación
3. Confirman email haciendo click en el link
4. ✅ Pueden iniciar sesión

**Especialistas:**
1. Completan formulario de registro + captcha
2. Reciben email de verificación
3. Confirman email haciendo click en el link
4. ⏳ Esperan aprobación del administrador
5. ✅ Pueden iniciar sesión una vez aprobados

**Administradores:**
1. Creados por otro administrador desde el panel
2. ✅ Pueden iniciar sesión inmediatamente

---

## 🛡️ Seguridad

- ✅ **Google reCAPTCHA v2** en todos los formularios de registro y creación de usuarios
- ✅ Validación de email con Supabase Auth
- ✅ Sistema de aprobación para especialistas
- ✅ Validaciones de formularios en frontend y backend
- ✅ Protección de rutas según rol de usuario
- ✅ Almacenamiento seguro de contraseñas (Supabase Auth)
- ✅ Storage de imágenes con políticas públicas configuradas

---

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn
- Cuenta de Supabase
- Cuenta de Google (para reCAPTCHA)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/iaraacruuz/Clinica-LABOIV.git
cd Clinica-LABOIV/ClinicaOnline
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Editar `src/environments/environment.ts`:

```typescript
export const enviroment = {
  production: false,
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseKey: 'TU_SUPABASE_ANON_KEY',
  recaptchaSiteKey: 'TU_GOOGLE_RECAPTCHA_SITE_KEY'
};
```

**Obtener credenciales:**
- **Supabase:** https://app.supabase.com/ → Crear proyecto → Settings → API
- **reCAPTCHA:** https://www.google.com/recaptcha/admin/create → reCAPTCHA v2 → Copiar Site Key

4. **Ejecutar la aplicación**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

---

## 🗄️ Base de Datos

### Tablas Principales

- **profiles** - Datos de todos los usuarios
- **specialists_data** - Datos específicos de especialistas
- **patients_data** - Datos específicos de pacientes
- **specialties** - Catálogo de especialidades médicas
- **user_images** - Imágenes adicionales de usuarios
- **appointments** *(En desarrollo)* - Turnos médicos

### Storage Buckets

- **perfiles** - Almacenamiento de imágenes de perfil (público, max 5MB)

---

## 🎨 Diseño y UX

### Paleta de Colores
- **Primario:** #3498db (Azul)
- **Secundario:** #2c3e50 (Gris oscuro)
- **Éxito:** #2ecc71 (Verde)
- **Error:** #e74c3c (Rojo)
- **Advertencia:** #f39c12 (Naranja)

### Características UX
- ✅ Gradientes suaves en fondos
- ✅ Animaciones de transición (fadeIn, slide)
- ✅ Modales de confirmación para acciones importantes
- ✅ Feedback visual inmediato
- ✅ Diseño responsive (mobile-first)
- ✅ Loading states durante operaciones asíncronas
- ✅ Validaciones en tiempo real con mensajes claros

---

## 🧪 Testing

### Usuarios de Prueba

Para facilitar el testing, se pueden usar los botones de acceso rápido en el login:

**Administrador:**
- Email: `admin@clinica.com`
- Password: `123456`

**Especialista:**
- Email: `especialista@clinica.com`
- Password: `123456`
- ⚠️ Debe estar aprobado por el admin

**Paciente:**
- Email: `paciente@clinica.com`
- Password: `123456`

---

## 📝 Estado del Proyecto

### ✅ Sprint 1 - Completado
- [x] Página de bienvenida
- [x] Sistema de registro (pacientes y especialistas)
- [x] Sistema de login con validaciones
- [x] Panel de administración
- [x] Gestión de usuarios
- [x] Aprobación de especialistas
- [x] Carga de imágenes de perfil
- [x] Especialidades personalizadas

### 🚧 Sprint 2 - En Progreso
- [x] Google reCAPTCHA integrado
- [ ] Sistema de turnos (Mis Turnos)
- [ ] Solicitar turnos
- [ ] Gestión de disponibilidad horaria (especialistas)
- [ ] Mi perfil completo
- [x] README documentación

### ⏳ Próximos Sprints
- Sprint 3: Historia clínica
- Sprint 4: Gráficos y estadísticas
- Sprint 5: Datos dinámicos adicionales
- Sprint 6: Multi-idioma y encuestas

---

## 👥 Autor

**Iara Cruz**
- GitHub: [@iaraacruuz](https://github.com/iaraacruuz)
- Repositorio: [Clinica-LABOIV](https://github.com/iaraacruuz/Clinica-LABOIV)

---

## 📄 Licencia

Este proyecto fue desarrollado como trabajo práctico para la materia Laboratorio de Computación IV - 4º Cuatrimestre.

---

## 🆘 Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio de GitHub.
