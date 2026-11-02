import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AcademicoService } from '../services/academico.service';
import { LoginService } from '../services/login.service';
import {
  CursoModel,
  DocenteModel,
  EstudianteModel,
  MateriaModel,
} from '../models/academico.model';
import { InfoUsuarioModel } from '../../components/models/infoUsuario.model';
import { SnackBarAnnotatedComponent } from '../../components/snack-bar-annotated/snack-bar-annotated.component';

@Component({
  selector: 'app-administracion',
  templateUrl: './administracion.component.html',
  styleUrls: ['./administracion.component.css'],
})
export class AdministracionComponent implements OnInit {
  usuario: InfoUsuarioModel | null = null;

  // Pestaña activa: 'ESTUDIANTES' | 'DOCENTES' | 'CURSOS'
  tabActiva: 'ESTUDIANTES' | 'DOCENTES' | 'CURSOS' = 'ESTUDIANTES';

  // Catálogos y listados
  cursos: CursoModel[] = [];
  materias: MateriaModel[] = [];
  estudiantes: EstudianteModel[] = [];
  docentes: DocenteModel[] = [];

  cargandoDatos = false;
  guardando = false;

  // Filtros de búsqueda
  filtroEstudianteBusqueda = '';
  filtroEstudianteCursoId = '';
  filtroEstudianteEstado = '';

  filtroDocenteBusqueda = '';
  filtroDocenteCursoId = '';

  // Modales y Formularios Reactivos
  mostrarModalEstudiante = false;
  estudianteEditandoId: string | null = null;
  estudianteForm!: FormGroup;

  mostrarModalDocente = false;
  docenteEditandoId: string | null = null;
  docenteForm!: FormGroup;

  mostrarModalAsignacion = false;
  docenteSeleccionadoAsignacion: DocenteModel | null = null;
  asignacionForm!: FormGroup;

  mostrarModalMateria = false;
  materiaForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private academicoService: AcademicoService,
    public loginService: LoginService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.usuario = this.loginService.informacionUsuario();
    this.inicializarFormularios();
    this.cargarTodo();
  }

  private inicializarFormularios(): void {
    this.estudianteForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      tipoDocumento: ['RC', [Validators.required]],
      documento: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(30)]],
      fechaNacimiento: [''],
      genero: ['F'],
      eps: [''],
      tipoSangre: ['O+'],
      direccion: [''],
      cursoId: ['', [Validators.required]],
      estadoMatricula: ['MATRICULADO', [Validators.required]],
      acudienteNombre: ['', [Validators.required, Validators.minLength(3)]],
      acudienteTelefono: ['', [Validators.required, Validators.minLength(7)]],
      acudienteEmail: ['', [Validators.email]],
      acudienteParentesco: ['Madre / Padre', [Validators.required]],
      observaciones: [''],
    });

    this.docenteForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      tipoDocumento: ['CC', [Validators.required]],
      documento: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      especialidad: ['', [Validators.required, Validators.minLength(3)]],
      tituloAcademico: [''],
      fechaIngreso: [new Date().toISOString().slice(0, 10)],
    });

    this.asignacionForm = this.fb.group({
      cursoId: ['', [Validators.required]],
      materiaId: ['', [Validators.required]],
      intensidadHoraria: [4, [Validators.required, Validators.min(1), Validators.max(30)]],
      esTitularCurso: [false],
    });

    this.materiaForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3)]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      area: ['Matemáticas', [Validators.required]],
      intensidadHoraria: [4, [Validators.required, Validators.min(1), Validators.max(20)]],
      descripcion: [''],
    });
  }

  cargarTodo(): void {
    this.cargandoDatos = true;
    this.academicoService.obtenerCursos().subscribe({
      next: (res) => {
        this.cursos = res.cursos || [];
        if (this.cursos.length > 0 && !this.estudianteForm.get('cursoId')?.value) {
          this.estudianteForm.patchValue({ cursoId: this.cursos[0].id });
          this.asignacionForm.patchValue({ cursoId: this.cursos[0].id });
        }
      },
    });

    this.academicoService.obtenerMaterias().subscribe({
      next: (res) => {
        this.materias = res.materias || [];
        if (this.materias.length > 0 && !this.asignacionForm.get('materiaId')?.value) {
          this.asignacionForm.patchValue({ materiaId: this.materias[0].id });
        }
      },
    });

    this.filtrarEstudiantes();
    this.filtrarDocentes();
  }

  cambiarTab(tab: 'ESTUDIANTES' | 'DOCENTES' | 'CURSOS'): void {
    this.tabActiva = tab;
  }

  // ==========================================================================
  // LÓGICA DE ESTUDIANTES Y MATRÍCULAS
  // ==========================================================================

  filtrarEstudiantes(): void {
    this.cargandoDatos = true;
    this.academicoService
      .obtenerEstudiantes({
        busqueda: this.filtroEstudianteBusqueda,
        cursoId: this.filtroEstudianteCursoId,
        estadoMatricula: this.filtroEstudianteEstado,
      })
      .subscribe({
        next: (res) => {
          this.estudiantes = res.estudiantes || [];
          this.cargandoDatos = false;
        },
        error: () => {
          this.cargandoDatos = false;
        },
      });
  }

  limpiarFiltrosEstudiantes(): void {
    this.filtroEstudianteBusqueda = '';
    this.filtroEstudianteCursoId = '';
    this.filtroEstudianteEstado = '';
    this.filtrarEstudiantes();
  }

  abrirModalNuevoEstudiante(cursoPreseleccionadoId?: string): void {
    this.estudianteEditandoId = null;
    this.estudianteForm.reset({
      tipoDocumento: 'RC',
      genero: 'F',
      tipoSangre: 'O+',
      cursoId: cursoPreseleccionadoId || this.cursos[0]?.id || '',
      estadoMatricula: 'MATRICULADO',
      acudienteParentesco: 'Madre / Padre',
    });
    this.mostrarModalEstudiante = true;
  }

  abrirModalEditarEstudiante(est: EstudianteModel): void {
    this.estudianteEditandoId = est.id;
    this.estudianteForm.patchValue({
      nombres: est.nombres,
      apellidos: est.apellidos,
      tipoDocumento: est.tipoDocumento || 'RC',
      documento: est.documento,
      fechaNacimiento: est.fechaNacimiento || '',
      genero: est.genero || 'F',
      eps: est.eps || '',
      tipoSangre: est.tipoSangre || 'O+',
      direccion: est.direccion || '',
      cursoId: est.cursoId,
      estadoMatricula: est.estadoMatricula || 'MATRICULADO',
      acudienteNombre: est.acudienteNombre,
      acudienteTelefono: est.acudienteTelefono,
      acudienteEmail: est.acudienteEmail || '',
      acudienteParentesco: est.acudienteParentesco || 'Madre / Padre',
      observaciones: est.observaciones || '',
    });
    this.mostrarModalEstudiante = true;
  }

  guardarEstudiante(): void {
    if (this.estudianteForm.invalid) {
      this.estudianteForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const payload = this.estudianteForm.value;

    const peticion$ = this.estudianteEditandoId
      ? this.academicoService.actualizarEstudiante(this.estudianteEditandoId, payload)
      : this.academicoService.crearEstudiante(payload);

    peticion$.subscribe({
      next: (res) => {
        this.guardando = false;
        this.mostrarModalEstudiante = false;
        this.notificar(res.mensaje);
        this.filtrarEstudiantes();
        this.recargarCursos();
      },
      error: () => {
        this.guardando = false;
      },
    });
  }

  retirarEstudiante(est: EstudianteModel): void {
    this.academicoService.eliminarEstudiante(est.id).subscribe({
      next: (res) => {
        this.notificar(res.mensaje);
        this.filtrarEstudiantes();
        this.recargarCursos();
      },
    });
  }

  // ==========================================================================
  // LÓGICA DE DOCENTES Y ASIGNACIÓN ACADÉMICA N:M
  // ==========================================================================

  filtrarDocentes(): void {
    this.academicoService
      .obtenerDocentes({
        busqueda: this.filtroDocenteBusqueda,
        cursoId: this.filtroDocenteCursoId,
      })
      .subscribe({
        next: (res) => {
          this.docentes = res.docentes || [];
        },
      });
  }

  limpiarFiltrosDocentes(): void {
    this.filtroDocenteBusqueda = '';
    this.filtroDocenteCursoId = '';
    this.filtrarDocentes();
  }

  abrirModalNuevoDocente(): void {
    this.docenteEditandoId = null;
    this.docenteForm.reset({
      tipoDocumento: 'CC',
      fechaIngreso: new Date().toISOString().slice(0, 10),
    });
    this.mostrarModalDocente = true;
  }

  abrirModalEditarDocente(doc: DocenteModel): void {
    this.docenteEditandoId = doc.id;
    this.docenteForm.patchValue({
      nombres: doc.nombres,
      apellidos: doc.apellidos,
      tipoDocumento: doc.tipoDocumento || 'CC',
      documento: doc.documento,
      email: doc.email,
      telefono: doc.telefono || '',
      especialidad: doc.especialidad,
      tituloAcademico: doc.tituloAcademico || '',
      fechaIngreso: doc.fechaIngreso || '',
    });
    this.mostrarModalDocente = true;
  }

  guardarDocente(): void {
    if (this.docenteForm.invalid) {
      this.docenteForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const payload = this.docenteForm.value;

    const peticion$ = this.docenteEditandoId
      ? this.academicoService.actualizarDocente(this.docenteEditandoId, payload)
      : this.academicoService.crearDocente(payload);

    peticion$.subscribe({
      next: (res) => {
        this.guardando = false;
        this.mostrarModalDocente = false;
        this.notificar(res.mensaje);
        this.filtrarDocentes();
        this.recargarCursos();
      },
      error: () => {
        this.guardando = false;
      },
    });
  }

  desvincularDocente(doc: DocenteModel): void {
    this.academicoService.eliminarDocente(doc.id).subscribe({
      next: (res) => {
        this.notificar(res.mensaje);
        this.filtrarDocentes();
        this.recargarCursos();
      },
    });
  }

  abrirModalAsignarGradoMateria(doc: DocenteModel): void {
    this.docenteSeleccionadoAsignacion = doc;
    this.asignacionForm.reset({
      cursoId: this.cursos[0]?.id || '',
      materiaId: this.materias[0]?.id || '',
      intensidadHoraria: 4,
      esTitularCurso: false,
    });
    this.mostrarModalAsignacion = true;
  }

  guardarAsignacionDocente(): void {
    if (this.asignacionForm.invalid || !this.docenteSeleccionadoAsignacion) {
      this.asignacionForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const docenteId = this.docenteSeleccionadoAsignacion.id;
    const datos = this.asignacionForm.value;

    this.academicoService.asignarDocenteCursoMateria(docenteId, datos).subscribe({
      next: (res) => {
        this.guardando = false;
        this.docenteSeleccionadoAsignacion = res.docente;
        this.notificar(res.mensaje);
        this.filtrarDocentes();
        this.recargarCursos();
      },
      error: () => {
        this.guardando = false;
      },
    });
  }

  quitarAsignacion(asignacionId: string): void {
    this.academicoService.eliminarAsignacionDocente(asignacionId).subscribe({
      next: (res) => {
        if (this.docenteSeleccionadoAsignacion?.id === res.docente.id) {
          this.docenteSeleccionadoAsignacion = res.docente;
        }
        this.notificar(res.mensaje);
        this.filtrarDocentes();
        this.recargarCursos();
      },
    });
  }

  // ==========================================================================
  // LÓGICA DE MATERIAS Y CURSOS
  // ==========================================================================

  abrirModalNuevaMateria(): void {
    this.materiaForm.reset({
      area: 'Matemáticas',
      intensidadHoraria: 4,
    });
    this.mostrarModalMateria = true;
  }

  guardarMateria(): void {
    if (this.materiaForm.invalid) {
      this.materiaForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.academicoService.crearMateria(this.materiaForm.value).subscribe({
      next: (res) => {
        this.guardando = false;
        this.mostrarModalMateria = false;
        this.materias.push(res.materia);
        this.notificar(res.mensaje);
      },
      error: () => {
        this.guardando = false;
      },
    });
  }

  private recargarCursos(): void {
    this.academicoService.obtenerCursos().subscribe({
      next: (res) => {
        this.cursos = res.cursos || [];
      },
    });
  }

  tieneError(form: FormGroup, controlName: string, errorName: string): boolean {
    const control = form.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  porcentajeCupo(curso: CursoModel): number {
    const ocupados = curso.estudiantes?.length || 0;
    const max = curso.cupoMaximo || 25;
    return Math.min(100, Math.round((ocupados / max) * 100));
  }

  cerrarSesion(): void {
    this.loginService.logout();
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

