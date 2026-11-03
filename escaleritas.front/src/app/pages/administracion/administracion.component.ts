import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AcademicoService } from '../services/academico.service';
import { LoginService } from '../services/login.service';
import {
  CursoModel,
  DiaSemanaTipo,
  DocenteModel,
  EstudianteModel,
  HorarioClaseModel,
  MateriaModel,
} from '../models/academico.model';
import { InfoUsuarioModel } from '../../components/models/infoUsuario.model';
import { SnackBarAnnotatedComponent } from '../../components/snack-bar-annotated/snack-bar-annotated.component';

export interface FranjaSalonSugerida {
  etiqueta: string;
  horaInicio: string;
  horaFin: string;
}

@Component({
  selector: 'app-administracion',
  templateUrl: './administracion.component.html',
  styleUrls: ['./administracion.component.css'],
})
export class AdministracionComponent implements OnInit {
  usuario: InfoUsuarioModel | null = null;

  // Pestaña activa: 'ESTUDIANTES' | 'DOCENTES' | 'CURSOS' | 'HORARIO_SALON'
  tabActiva: 'ESTUDIANTES' | 'DOCENTES' | 'CURSOS' | 'HORARIO_SALON' = 'ESTUDIANTES';

  // Catálogos y listados
  cursos: CursoModel[] = [];
  materias: MateriaModel[] = [];
  estudiantes: EstudianteModel[] = [];
  docentes: DocenteModel[] = [];

  // Estado para el Horario Único por Salón
  salonHorarioSeleccionadoId = '';
  horariosSalonActual: HorarioClaseModel[] = [];
  configSalonForm!: FormGroup;
  horarioSalonForm!: FormGroup;

  readonly diasSemana: { codigo: DiaSemanaTipo; etiqueta: string }[] = [
    { codigo: 'LUNES', etiqueta: 'Lunes' },
    { codigo: 'MARTES', etiqueta: 'Martes' },
    { codigo: 'MIERCOLES', etiqueta: 'Miércoles' },
    { codigo: 'JUEVES', etiqueta: 'Jueves' },
    { codigo: 'VIERNES', etiqueta: 'Viernes' },
  ];

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
  ocultarClaveDocente = true;
  docenteForm!: FormGroup;

  mostrarModalAsignacion = false;
  docenteSeleccionadoAsignacion: DocenteModel | null = null;
  asignacionForm!: FormGroup;

  // Modal para asignar Directora de Grupo a un Salón de Clase
  mostrarModalDirectora = false;
  cursoSeleccionadoDirectora: CursoModel | null = null;
  directoraSalonForm!: FormGroup;

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
      codUsuario: [
        '',
        [Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9._-]+$/)],
      ],
      clave: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.asignacionForm = this.fb.group({
      cursoId: ['', [Validators.required]],
      materiaId: ['', [Validators.required]],
      intensidadHoraria: [4, [Validators.required, Validators.min(1), Validators.max(30)]],
      esTitularCurso: [false],
    });

    this.directoraSalonForm = this.fb.group({
      directorDocenteId: [''],
      aula: ['', [Validators.required]],
      cupoMaximo: [25, [Validators.required, Validators.min(1), Validators.max(50)]],
      tipoCalificacion: ['NUMERICA', [Validators.required]],
      horaInicioDescanso: ['10:00', [Validators.required]],
      horaFinDescanso: ['10:30', [Validators.required]],
    });

    this.configSalonForm = this.fb.group({
      directorDocenteId: [''],
      horaInicioDescanso: ['10:00', [Validators.required]],
      horaFinDescanso: ['10:30', [Validators.required]],
      tipoCalificacion: ['NUMERICA', [Validators.required]],
      aula: [''],
    });

    this.horarioSalonForm = this.fb.group({
      diaSemana: ['LUNES', [Validators.required]],
      franjaIndex: [0, [Validators.required]],
      horaInicio: ['07:00', [Validators.required]],
      horaFin: ['08:00', [Validators.required]],
      materiaId: ['', [Validators.required]],
      docenteId: ['', [Validators.required]],
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
        if (this.cursos.length > 0 && !this.salonHorarioSeleccionadoId) {
          this.seleccionarSalonHorario(this.cursos[0].id);
        } else if (this.salonHorarioSeleccionadoId) {
          this.sincronizarFormularioSalonHorario();
          this.cargarHorariosDelSalon(this.salonHorarioSeleccionadoId);
        }
      },
    });

    this.academicoService.obtenerMaterias().subscribe({
      next: (res) => {
        this.materias = res.materias || [];
        if (this.materias.length > 0) {
          if (!this.asignacionForm.get('materiaId')?.value) {
            this.asignacionForm.patchValue({ materiaId: this.materias[0].id });
          }
          if (!this.horarioSalonForm.get('materiaId')?.value) {
            this.horarioSalonForm.patchValue({ materiaId: this.materias[0].id });
          }
        }
      },
    });

    this.filtrarEstudiantes();
    this.filtrarDocentes();
  }

  cambiarTab(tab: 'ESTUDIANTES' | 'DOCENTES' | 'CURSOS' | 'HORARIO_SALON'): void {
    this.tabActiva = tab;
    if (tab === 'HORARIO_SALON' && !this.salonHorarioSeleccionadoId && this.cursos.length > 0) {
      this.seleccionarSalonHorario(this.cursos[0].id);
    }
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
          if (this.docentes.length > 0 && !this.horarioSalonForm.get('docenteId')?.value) {
            this.horarioSalonForm.patchValue({ docenteId: this.docentes[0].id });
          }
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
    this.ocultarClaveDocente = true;
    const claveCtrl = this.docenteForm.get('clave');
    claveCtrl?.setValidators([Validators.required, Validators.minLength(6)]);
    claveCtrl?.updateValueAndValidity();

    this.docenteForm.reset({
      tipoDocumento: 'CC',
      fechaIngreso: new Date().toISOString().slice(0, 10),
      codUsuario: '',
      clave: '',
    });
    this.mostrarModalDocente = true;
  }

  abrirModalEditarDocente(doc: DocenteModel): void {
    this.docenteEditandoId = doc.id;
    this.ocultarClaveDocente = true;
    const claveCtrl = this.docenteForm.get('clave');
    claveCtrl?.setValidators([Validators.minLength(6)]);
    claveCtrl?.updateValueAndValidity();

    const sugeridoUsuario =
      doc.usuario?.codUsuario ||
      (doc.email ? doc.email.split('@')[0].toLowerCase() : '');

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
      codUsuario: sugeridoUsuario,
      clave: '',
    });
    this.mostrarModalDocente = true;
  }

  autocompletarUsuarioDocenteDesdeEmail(): void {
    const emailVal: string = this.docenteForm.get('email')?.value || '';
    const codUsuarioCtrl = this.docenteForm.get('codUsuario');
    if (emailVal.includes('@') && (!codUsuarioCtrl?.value || !codUsuarioCtrl.dirty)) {
      const prefijo = emailVal
        .split('@')[0]
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '');
      if (prefijo.length >= 3) {
        codUsuarioCtrl?.setValue(prefijo);
      }
    }
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
  // ASIGNAR DIRECTORA DE GRUPO Y PARAMETRIZAR HORARIO ÚNICO POR SALÓN
  // ==========================================================================

  esSalonPreescolar(curso?: CursoModel | null): boolean {
    if (!curso) {
      return false;
    }
    return (
      curso.nivel === 'PREESCOLAR' ||
      curso.grado === 'JARDIN' ||
      curso.grado === 'TRANSICION'
    );
  }

  esSalonCaritas(curso: CursoModel): boolean {
    if (curso.tipoCalificacion === 'CARITAS') {
      return true;
    }
    if (curso.tipoCalificacion === 'NUMERICA') {
      return false;
    }
    return this.esSalonPreescolar(curso);
  }

  horaEntradaSalon(curso?: CursoModel | null): string {
    if (!curso) {
      return '07:00';
    }
    return curso.horaEntrada || (this.esSalonPreescolar(curso) ? '07:30' : '07:00');
  }

  horaSalidaSalon(curso?: CursoModel | null): string {
    if (!curso) {
      return '13:00';
    }
    return curso.horaSalida || (this.esSalonPreescolar(curso) ? '12:00' : '13:00');
  }

  horaInicioDescansoSalon(curso?: CursoModel | null): string {
    if (!curso) {
      return '10:00';
    }
    return (
      curso.horaInicioDescanso ||
      (this.esSalonPreescolar(curso) ? '09:30' : '10:00')
    );
  }

  horaFinDescansoSalon(curso?: CursoModel | null): string {
    if (!curso) {
      return '10:30';
    }
    return (
      curso.horaFinDescanso ||
      (this.esSalonPreescolar(curso) ? '10:00' : '10:30')
    );
  }

  get salonHorarioActual(): CursoModel | null {
    return (
      this.cursos.find((c) => c.id === this.salonHorarioSeleccionadoId) || null
    );
  }

  irAHorarioSalon(curso: CursoModel): void {
    this.tabActiva = 'HORARIO_SALON';
    this.seleccionarSalonHorario(curso.id);
  }

  seleccionarSalonHorario(cursoId: string): void {
    this.salonHorarioSeleccionadoId = cursoId;
    this.sincronizarFormularioSalonHorario();
    this.cargarHorariosDelSalon(cursoId);
  }

  private sincronizarFormularioSalonHorario(): void {
    const salon = this.salonHorarioActual;
    if (!salon) {
      return;
    }
    this.configSalonForm.patchValue({
      directorDocenteId: salon.directorDocenteId || '',
      horaInicioDescanso: this.horaInicioDescansoSalon(salon),
      horaFinDescanso: this.horaFinDescansoSalon(salon),
      tipoCalificacion: this.esSalonCaritas(salon) ? 'CARITAS' : 'NUMERICA',
      aula: salon.aula || 'Salón Principal',
    });

    const franjas = this.franjasSugeridasSalonActual;
    if (franjas.length > 0) {
      this.horarioSalonForm.patchValue({
        franjaIndex: 0,
        horaInicio: franjas[0].horaInicio,
        horaFin: franjas[0].horaFin,
      });
    }
  }

  cargarHorariosDelSalon(cursoId: string): void {
    if (!cursoId) {
      this.horariosSalonActual = [];
      return;
    }
    this.academicoService.obtenerHorarios({ cursoId }).subscribe({
      next: (res) => {
        this.horariosSalonActual = res.horarios || [];
      },
    });
  }

  private aMinutos(hhmm: string): number {
    const [h, m] = (hhmm || '00:00').split(':').map((v) => Number(v) || 0);
    return h * 60 + m;
  }

  private aHHMM(totalMin: number): string {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private generarBloquesEnTramo(inicioHHMM: string, finHHMM: string): FranjaSalonSugerida[] {
    const resultado: FranjaSalonSugerida[] = [];
    let cursor = this.aMinutos(inicioHHMM);
    const limite = this.aMinutos(finHHMM);
    if (cursor >= limite) {
      return resultado;
    }

    while (cursor < limite) {
      const restante = limite - cursor;
      const duracion = restante >= 60 ? 60 : restante;
      const sig = cursor + duracion;
      const hIni = this.aHHMM(cursor);
      const hFin = this.aHHMM(sig);
      resultado.push({
        etiqueta: `${hIni} - ${hFin} (${duracion} min)`,
        horaInicio: hIni,
        horaFin: hFin,
      });
      cursor = sig;
    }

    return resultado;
  }

  /**
   * Genera dinámicamente las franjas horarias del salón respetando su hora de entrada/salida
   * (Jardín/Transición: 07:30-12:00 | 1° a 5°: 07:00-13:00) y el descanso parametrizado del salón.
   */
  get franjasSugeridasSalonActual(): FranjaSalonSugerida[] {
    const salon = this.salonHorarioActual;
    const entrada = this.horaEntradaSalon(salon);
    const salida = this.horaSalidaSalon(salon);
    const descIni =
      this.configSalonForm?.get('horaInicioDescanso')?.value ||
      this.horaInicioDescansoSalon(salon);
    const descFin =
      this.configSalonForm?.get('horaFinDescanso')?.value ||
      this.horaFinDescansoSalon(salon);

    const antes = this.generarBloquesEnTramo(entrada, descIni).map((b, idx) => ({
      ...b,
      etiqueta: `${idx + 1}° Bloque (Antes del descanso): ${b.horaInicio} - ${b.horaFin}`,
    }));
    const despues = this.generarBloquesEnTramo(descFin, salida).map((b, idx) => ({
      ...b,
      etiqueta: `${antes.length + idx + 1}° Bloque (Después del descanso): ${b.horaInicio} - ${b.horaFin}`,
    }));

    return [...antes, ...despues];
  }

  alCambiarFranjaSalon(indiceValor: any): void {
    const idx = Number(indiceValor);
    const franjas = this.franjasSugeridasSalonActual;
    if (!isNaN(idx) && franjas[idx]) {
      this.horarioSalonForm.patchValue({
        horaInicio: franjas[idx].horaInicio,
        horaFin: franjas[idx].horaFin,
      });
    }
  }

  guardarParametrosSalonHorario(): void {
    const salon = this.salonHorarioActual;
    if (!salon || this.configSalonForm.invalid) {
      this.configSalonForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const {
      directorDocenteId,
      horaInicioDescanso,
      horaFinDescanso,
      tipoCalificacion,
      aula,
    } = this.configSalonForm.value;

    this.academicoService
      .actualizarCurso(salon.id, {
        directorDocenteId: directorDocenteId || null,
        horaInicioDescanso,
        horaFinDescanso,
        tipoCalificacion,
        aula: aula || salon.aula || 'Salón Principal',
      })
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.notificar(
            'Parámetros de descanso, calificación y directora de grupo del salón guardados'
          );
          this.academicoService.obtenerCursos().subscribe({
            next: (cursosRes) => {
              this.cursos = cursosRes.cursos || [];
              this.sincronizarFormularioSalonHorario();
            },
          });
          this.filtrarDocentes();
        },
        error: () => {
          this.guardando = false;
        },
      });
  }

  agregarBloqueHorarioSalon(): void {
    const salon = this.salonHorarioActual;
    if (!salon || this.horarioSalonForm.invalid) {
      this.horarioSalonForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const { diaSemana, horaInicio, horaFin, materiaId, docenteId } =
      this.horarioSalonForm.value;

    this.academicoService
      .crearHorario({
        cursoId: salon.id,
        materiaId,
        docenteId,
        diaSemana,
        horaInicio,
        horaFin,
        aula: salon.aula || 'Salón Principal',
      })
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.notificar(res.mensaje);
          this.cargarHorariosDelSalon(salon.id);
          this.recargarCursos();
          this.filtrarDocentes();
        },
        error: () => {
          this.guardando = false;
        },
      });
  }

  cambiarProfesoraDeBloqueHorario(
    bloque: HorarioClaseModel,
    nuevoDocenteId: string
  ): void {
    if (!nuevoDocenteId || nuevoDocenteId === bloque.docenteId) {
      return;
    }
    this.academicoService
      .actualizarHorario(bloque.id, { docenteId: nuevoDocenteId })
      .subscribe({
        next: (res) => {
          this.notificar('Profesora asignada a la materia actualizada en el horario del salón');
          if (this.salonHorarioActual) {
            this.cargarHorariosDelSalon(this.salonHorarioActual.id);
          }
          this.recargarCursos();
          this.filtrarDocentes();
        },
      });
  }

  eliminarBloqueHorarioSalon(horarioId: string): void {
    this.academicoService.eliminarHorario(horarioId).subscribe({
      next: (res) => {
        this.notificar(res.mensaje);
        if (this.salonHorarioActual) {
          this.cargarHorariosDelSalon(this.salonHorarioActual.id);
        }
        this.recargarCursos();
      },
    });
  }

  horariosSalonPorDia(dia: DiaSemanaTipo): HorarioClaseModel[] {
    return this.horariosSalonActual
      .filter((h) => h.diaSemana === dia)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  horariosSalonAntesDescanso(dia: DiaSemanaTipo): HorarioClaseModel[] {
    const descIni = this.horaInicioDescansoSalon(this.salonHorarioActual);
    return this.horariosSalonPorDia(dia).filter((h) => h.horaInicio < descIni);
  }

  horariosSalonDespuesDescanso(dia: DiaSemanaTipo): HorarioClaseModel[] {
    const descIni = this.horaInicioDescansoSalon(this.salonHorarioActual);
    return this.horariosSalonPorDia(dia).filter((h) => h.horaInicio >= descIni);
  }

  abrirModalDirectoraGrupo(curso: CursoModel): void {
    this.cursoSeleccionadoDirectora = curso;
    this.directoraSalonForm.reset({
      directorDocenteId: curso.directorDocenteId || '',
      aula: curso.aula || 'Salón Principal',
      cupoMaximo: curso.cupoMaximo || 25,
      tipoCalificacion: this.esSalonCaritas(curso) ? 'CARITAS' : 'NUMERICA',
      horaInicioDescanso: this.horaInicioDescansoSalon(curso),
      horaFinDescanso: this.horaFinDescansoSalon(curso),
    });
    this.mostrarModalDirectora = true;
  }

  guardarDirectoraSalon(): void {
    if (this.directoraSalonForm.invalid || !this.cursoSeleccionadoDirectora) {
      this.directoraSalonForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const {
      directorDocenteId,
      aula,
      cupoMaximo,
      tipoCalificacion,
      horaInicioDescanso,
      horaFinDescanso,
    } = this.directoraSalonForm.value;

    this.academicoService
      .actualizarCurso(this.cursoSeleccionadoDirectora.id, {
        directorDocenteId: directorDocenteId || null,
        aula,
        cupoMaximo: Number(cupoMaximo),
        tipoCalificacion,
        horaInicioDescanso,
        horaFinDescanso,
      })
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.mostrarModalDirectora = false;
          this.notificar(res.mensaje);
          this.recargarCursos();
          this.filtrarDocentes();
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
        if (this.salonHorarioSeleccionadoId) {
          this.sincronizarFormularioSalonHorario();
        }
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

  private notificar(mensaje: string): void {
    this.snackBar.openFromComponent(SnackBarAnnotatedComponent, {
      data: {
        mensajes: mensaje,
        accion: 'Cerrar',
      },
    });
  }
}
