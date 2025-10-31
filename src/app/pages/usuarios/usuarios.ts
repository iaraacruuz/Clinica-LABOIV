import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-alta-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.scss']
})
export class UsuarioComponent implements OnInit {

  fotoPerfilUrl: string | ArrayBuffer | null = 'assets/default-profile.png'; 
  usuarioForm!: FormGroup;

  perfilesDisponibles = ['administrador', 'especialista', 'paciente'];

  constructor(private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    this.usuarioForm = this.fb.group({
      perfil: ['', Validators.required], 
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: ['', [Validators.required, Validators.minLength(3)]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(100)]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8,10}$/)]],
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      imagenPerfil: [null, [Validators.required]],
      especialidad: [''] 
    });
  }

  get f() { return this.usuarioForm.controls; }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.usuarioForm.patchValue({ imagenPerfil: file });
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPerfilUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      console.log('Formulario inválido. Revise los campos.');
      this.usuarioForm.markAllAsTouched();
      return;
    }

    let estadoInicial = 'activo';
    if (this.f['perfil'].value === 'especialista') {
      estadoInicial = 'activo';
    }

    const nuevoUsuario = {
      ...this.usuarioForm.value,
      estado: estadoInicial
    };

    delete nuevoUsuario.imagenPerfil; 

    console.log('Datos del nuevo Usuario listos para guardar:', nuevoUsuario);
    alert(`Usuario de perfil ${nuevoUsuario.perfil.toUpperCase()} Creado (simulación)`);

    this.router.navigate(['/usuarios']);
  }
}
