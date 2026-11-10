import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from '../services/login.service';
import { UsuarioAuthModel } from '../models/login.model';
import { InfoUsuarioModel } from '../../components/models/infoUsuario.model';
import { SnackBarAnnotatedComponent } from '../../components/snack-bar-annotated/snack-bar-annotated.component';

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.css'],
})
export class PerfilUsuarioComponent implements OnInit {
  infoJwt: InfoUsuarioModel | null = null;
  perfilCompleto: UsuarioAuthModel | null = null;

  perfilForm!: FormGroup;
  claveForm!: FormGroup;

  cargando = false;
  guardandoDatos = false;
  guardandoClave = false;

  ocultarClaveActual = true;
  ocultarNuevaClave = true;
  ocultarConfirmarClave = true;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.infoJwt = this.loginService.informacionUsuario();
    this.inicializarFormularios();
    this.cargarMiPerfil();
  }

  private inicializarFormularios(): void {
    this.perfilForm = this.fb.group({
      nombres: [
        this.infoJwt?.nombre || '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      ],
      apellidos: [this.infoJwt?.apellido || '', [Validators.maxLength(100)]],
      codUsuario: [
        this.infoJwt?.usuario || '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-zA-Z0-9._-]+$/),
        ],
      ],
      email: [this.infoJwt?.email || '', [Validators.email]],
      documento: ['', [Validators.maxLength(30)]],
      telefono: [''],
      tituloAcademico: [''],
    });

    this.claveForm = this.fb.group({
      claveActual: ['', [Validators.required]],
      nuevaClave: ['', [Validators.required, Validators.minLength(6)]],
      confirmarClave: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  cargarMiPerfil(): void {
    this.cargando = true;
    this.loginService.obtenerPerfil().subscribe({
      next: (res) => {
        this.cargando = false;
        this.perfilCompleto = res.usuario;
        this.perfilForm.patchValue({
          nombres: res.usuario.nombres || '',
          apellidos: res.usuario.apellidos || '',
          codUsuario: res.usuario.codUsuario || '',
          email: res.usuario.email || '',
          documento: res.usuario.documento || '',
          telefono: res.usuario.perfilDocente?.telefono || '',
          tituloAcademico: res.usuario.perfilDocente?.tituloAcademico || '',
        });
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  get inicialesUsuario(): string {
    const nom = (
      this.perfilForm.get('nombres')?.value ||
      this.infoJwt?.nombre ||
      'U'
    ).trim();
    const ape = (
      this.perfilForm.get('apellidos')?.value ||
      this.infoJwt?.apellido ||
      ''
    ).trim();
    return `${nom.charAt(0)}${ape.charAt(0)}`.toUpperCase();
  }

  get esDocente(): boolean {
    return (
      this.infoJwt?.rol === 'DOCENTE' ||
      Boolean(this.perfilCompleto?.perfilDocente)
    );
  }

  get clavesNoCoinciden(): boolean {
    const nueva = this.claveForm.get('nuevaClave')?.value || '';
    const confirmar = this.claveForm.get('confirmarClave')?.value || '';
    return (
      Boolean(confirmar) &&
      Boolean(this.claveForm.get('confirmarClave')?.touched) &&
      nueva !== confirmar
    );
  }

  guardarDatosPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.guardandoDatos = true;
    const {
      nombres,
      apellidos,
      codUsuario,
      email,
      documento,
      telefono,
      tituloAcademico,
    } = this.perfilForm.value;

    this.loginService
      .actualizarMiPerfil({
        nombres,
        apellidos,
        codUsuario,
        email,
        documento,
        telefono,
        tituloAcademico,
      })
      .subscribe({
        next: (res) => {
          this.guardandoDatos = false;
          this.infoJwt = this.loginService.informacionUsuario();
          this.notificar(res.mensaje);
          this.cargarMiPerfil();
        },
        error: () => {
          this.guardandoDatos = false;
        },
      });
  }

  cambiarContrasena(): void {
    if (this.claveForm.invalid) {
      this.claveForm.markAllAsTouched();
      return;
    }

    const { claveActual, nuevaClave, confirmarClave } = this.claveForm.value;
    if (nuevaClave !== confirmarClave) {
      this.claveForm.get('confirmarClave')?.markAsTouched();
      this.notificar('La nueva contraseña y su confirmación no coinciden');
      return;
    }

    this.guardandoClave = true;
    this.loginService
      .actualizarMiPerfil({
        claveActual,
        nuevaClave,
        confirmarClave,
      })
      .subscribe({
        next: (res) => {
          this.guardandoClave = false;
          this.claveForm.reset();
          this.notificar(res.mensaje);
        },
        error: () => {
          this.guardandoClave = false;
        },
      });
  }

  tieneError(form: FormGroup, controlName: string, errorName: string): boolean {
    const control = form.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  private notificar(mensaje: string): void {
    this.snackBar.openFromComponent(SnackBarAnnotatedComponent, {
      data: {
        mensajes: mensaje,
        accion: 'Cerrar',
      },
    });
  }
}

