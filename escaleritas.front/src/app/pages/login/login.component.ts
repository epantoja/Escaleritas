import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from '../services/login.service';
import { RolCodigo } from '../models/login.model';
import { SnackBarAnnotatedComponent } from '../../components/snack-bar-annotated/snack-bar-annotated.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;

  modoRegistro = false;
  cargando = false;
  ocultarClaveLogin = true;
  ocultarClaveRegistro = true;
  returnUrl = '/pages/home';

  readonly rolesDisponibles: { codigo: RolCodigo; etiqueta: string; descripcion: string }[] = [
    {
      codigo: 'ADMIN',
      etiqueta: 'Administrador',
      descripcion: 'Dirección general, admisiones, matrículas y seguridad',
    },
    {
      codigo: 'DOCENTE',
      etiqueta: 'Docente',
      descripcion: 'Gestión académica y calificaciones (Jardín a 5° Primaria)',
    },
    {
      codigo: 'PADRE_ESTUDIANTE',
      etiqueta: 'Padre / Estudiante',
      descripcion: 'Consulta de boletines, asistencia y pensiones',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['page'] || '/pages/home';
    this.inicializarFormularios();
  }

  private inicializarFormularios(): void {
    this.loginForm = this.fb.group({
      usuario: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
      ],
      clave: ['', [Validators.required, Validators.minLength(4)]],
    });

    this.registerForm = this.fb.group({
      nombres: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      ],
      apellidos: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      ],
      codUsuario: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-zA-Z0-9._-]+$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      documento: ['', [Validators.maxLength(30)]],
      rolCodigo: ['PADRE_ESTUDIANTE' as RolCodigo, [Validators.required]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  alternarModo(esRegistro: boolean): void {
    this.modoRegistro = esRegistro;
  }

  onSubmitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const { usuario, clave } = this.loginForm.value;

    this.loginService.login({ usuario, clave }).subscribe({
      next: (res) => {
        this.cargando = false;
        this.snackBar.openFromComponent(SnackBarAnnotatedComponent, {
          data: {
            mensajes: `Bienvenido(a), ${res.usuario.nombres} (${res.usuario.rol.nombre})`,
            accion: 'Cerrar',
          },
        });
        this.redirigirSegunRol(res.usuario.rol.codigo);
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  onSubmitRegistro(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const datosRegistro = this.registerForm.value;

    this.loginService.register(datosRegistro).subscribe({
      next: (res) => {
        this.cargando = false;
        this.snackBar.openFromComponent(SnackBarAnnotatedComponent, {
          data: {
            mensajes: res.mensaje || 'Cuenta creada e iniciada correctamente',
            accion: 'Cerrar',
          },
        });
        this.redirigirSegunRol(res.usuario.rol.codigo);
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  private redirigirSegunRol(rolCodigo: string): void {
    if (rolCodigo === 'DOCENTE') {
      this.router.navigateByUrl('/pages/docentes');
      return;
    }
    if (
      rolCodigo === 'PADRE_ESTUDIANTE' ||
      rolCodigo === 'PADRE' ||
      rolCodigo === 'ESTUDIANTE'
    ) {
      this.router.navigateByUrl('/pages/portal-padres');
      return;
    }
    this.router.navigateByUrl('/pages/home');
  }

  tieneError(form: FormGroup, controlName: string, errorName: string): boolean {
    const control = form.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }
}

