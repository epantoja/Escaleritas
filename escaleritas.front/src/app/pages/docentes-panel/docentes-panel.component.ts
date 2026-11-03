import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AcademicoService } from '../services/academico.service';
import { LoginService } from '../services/login.service';
import {
  AsignacionDocenteModel,
  CalificacionPlanillaItemModel,
  CursoModel,
  DiaSemanaTipo,
  DocenteModel,
  HorarioClaseModel,
  MateriaModel,
} from '../models/academico.model';
import { InfoUsuarioModel } from '../../components/models/infoUsuario.model';
import { SnackBarAnnotatedComponent } from '../../components/snack-bar-annotated/snack-bar-annotated.component';

export interface BloqueHorarioConfig {
  inicio: string;
  fin: string;
  etiqueta: string;
}

@Component({
  selector: 'app-docentes-panel',
  templateUrl: './docentes-panel.component.html',
  styleUrls: ['./docentes-panel.component.css'],
})
export class DocentesPanelComponent implements OnInit {
  usuario: InfoUsuarioModel | null = null;
  esAdmin = false;

  docentesDisponibles: DocenteModel[] = [];
  docenteActivo: DocenteModel | null = null;
  cursosDirigidos: CursoModel[] = [];

  cursos: CursoModel[] = [];
  materias: MateriaModel[] = [];
  horariosDocente: HorarioClaseModel[] = [];

  salonCalificandoId = '';
  asignacionCalificando: AsignacionDocenteModel | null = null;
  planillaNotas: CalificacionPlanillaItemModel[] = [];

  vistaActiva: 'MATERIAS_HORARIO' | 'CALIFICACIONES' | 'DIRECCION_GRUPO' =
    'MATERIAS_HORARIO';

  asignacionForm!: FormGroup;
  horarioForm!: FormGroup;
  guardando = false;

  readonly diasSemana: { codigo: DiaSemanaTipo; nombre: string }[] = [
    { codigo: 'LUNES', nombre: 'Lunes' },
    { codigo: 'MARTES', nombre: 'Martes' },
    { codigo: 'MIERCOLES', nombre: 'Miércoles' },
    { codigo: 'JUEVES', nombre: 'Jueves' },
    { codigo: 'VIERNES', nombre: 'Viernes' },
  ];

  /**
   * Transición / Preescolar:
   * Jornada de 07:30 AM a 12:00 PM con 30 minutos de descanso (09:30 AM - 10:00 AM)
   */
  readonly bloquesTransicionPreescolar: BloqueHorarioConfig[] = [
    { inicio: '07:30', fin: '08:30', etiqueta: '07:30 AM - 08:30 AM (1° Bloque)' },
    { inicio: '08:30', fin: '09:30', etiqueta: '08:30 AM - 09:30 AM (2° Bloque)' },
    // Descanso de 30 minutos: 09:30 AM - 10:00 AM
    { inicio: '10:00', fin: '11:00', etiqueta: '10:00 AM - 11:00 AM (3° Bloque - Post Descanso)' },
    { inicio: '11:00', fin: '12:00', etiqueta: '11:00 AM - 12:00 PM (4° Bloque - Cierre)' },
  ];

  /**
   * Salones Superiores (1° a 5° de Primaria):
   * Jornada de 07:00 AM a 01:00 PM (13:00) con 30 minutos de descanso (10:00 AM - 10:30 AM)
   */
  readonly bloquesPrimariaSuperiores: BloqueHorarioConfig[] = [
    { inicio: '07:00', fin: '08:00', etiqueta: '07:00 AM - 08:00 AM (1° Hora)' },
    { inicio: '08:00', fin: '09:00', etiqueta: '08:00 AM - 09:00 AM (2° Hora)' },
    { inicio: '09:00', fin: '10:00', etiqueta: '09:00 AM - 10:00 AM (3° Hora)' },
    // Descanso de 30 minutos: 10:00 AM - 10:30 AM
    { inicio: '10:30', fin: '11:20', etiqueta: '10:30 AM - 11:20 AM (4° Hora - Post Descanso)' },
    { inicio: '11:20', fin: '12:10', etiqueta: '11:20 AM - 12:10 PM (5° Hora)' },
    { inicio: '12:10', fin: '13:00', etiqueta: '12:10 PM - 01:00 PM (6° Hora - Cierre)' },
  ];

  constructor(
    private fb: FormBuilder,
    private academicoService: AcademicoService,
    private loginService: LoginService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.usuario = this.loginService.informacionUsuario();
    this.esAdmin = this.usuario?.rol === 'ADMIN';
    this.inicializarFormularios();
    this.cargarCatalogosYPerfil();
  }

  private inicializarFormularios(): void {
    this.asignacionForm = this.fb.group({
      cursoId: ['', [Validators.required]],
      materiaId: ['', [Validators.required]],
      intensidadHoraria: [
        4,
        [Validators.required, Validators.min(1), Validators.max(25)],
      ],
    });

    this.horarioForm = this.fb.group({
      asignacionId: ['', [Validators.required]],
      diaSemana: ['LUNES', [Validators.required]],
      bloqueIndice: [0, [Validators.required]],
      aula: [''],
    });
  }

  /**
   * Retorna la asignación actualmente seleccionada en el formulario de horario
   */
  get asignacionHorarioSeleccionada(): AsignacionDocenteModel | undefined {
    const id = this.horarioForm?.get('asignacionId')?.value;
    return (this.docenteActivo?.asignaciones || []).find((a) => a.id === id);
  }

  /**
   * Determina si el salón seleccionado en el formulario de horario es Transición/Preescolar
   */
  get esAsignacionPreescolar(): boolean {
    const curso = this.asignacionHorarioSeleccionada?.curso;
    if (!curso) {
      return false;
    }
    return (
      curso.nivel === 'PREESCOLAR' ||
      curso.grado === 'TRANSICION' ||
      curso.grado === 'JARDIN'
    );
  }

  /**
   * Devuelve los bloques horarios según si el salón seleccionado es Transición/Preescolar (7:30-12:00)
   * o Salones Superiores de Primaria (7:00-13:00)
   */
  get bloquesHoraDisponibles(): BloqueHorarioConfig[] {
    return this.esAsignacionPreescolar
      ? this.bloquesTransicionPreescolar
      : this.bloquesPrimariaSuperiores;
  }

  onCambioAsignacionHorario(): void {
    const asig = this.asignacionHorarioSeleccionada;
    this.horarioForm.patchValue({
      bloqueIndice: 0,
      aula: asig?.curso?.aula || '',
    });
  }

  cargarCatalogosYPerfil(): void {
    this.academicoService.obtenerCursos().subscribe({
      next: (res) => {
        this.cursos = res.cursos || [];
        if (this.cursos.length > 0) {
          this.asignacionForm.patchValue({ cursoId: this.cursos[0].id });
        }
        this.actualizarCursosDirigidos();
      },
    });

    this.academicoService.obtenerMaterias().subscribe({
      next: (res) => {
        this.materias = res.materias || [];
        if (this.materias.length > 0) {
          this.asignacionForm.patchValue({ materiaId: this.materias[0].id });
        }
      },
    });

    if (this.esAdmin) {
      this.academicoService.obtenerDocentes().subscribe({
        next: (res) => {
          this.docentesDisponibles = res.docentes || [];
          if (this.docentesDisponibles.length > 0) {
            this.seleccionarDocente(this.docentesDisponibles[0]);
          } else {
            this.cargarMiPerfilDocente();
          }
        },
      });
    } else {
      this.cargarMiPerfilDocente();
    }
  }

  private cargarMiPerfilDocente(): void {
    this.academicoService.obtenerMiPerfilDocente().subscribe({
      next: (res) => {
        this.docenteActivo = res.docente;
        this.cursosDirigidos = res.cursosDirigidos || [];
        this.sincronizarFormularioHorario();
        this.cargarHorariosDocente();
      },
    });
  }

  seleccionarDocentePorId(docenteId: string): void {
    const doc = this.docentesDisponibles.find((d) => d.id === docenteId);
    if (doc) {
      this.seleccionarDocente(doc);
    }
  }

  seleccionarDocente(doc: DocenteModel): void {
    this.docenteActivo = doc;
    this.actualizarCursosDirigidos();
    this.sincronizarFormularioHorario();
    this.cargarHorariosDocente();
  }

  private actualizarCursosDirigidos(): void {
    if (!this.docenteActivo) {
      return;
    }
    this.cursosDirigidos = this.cursos.filter(
      (c) => c.directorDocenteId === this.docenteActivo?.id
    );
  }

  private sincronizarFormularioHorario(): void {
    const asignaciones = this.docenteActivo?.asignaciones || [];
    if (asignaciones.length > 0) {
      this.horarioForm.patchValue({
        asignacionId: asignaciones[0].id,
        bloqueIndice: 0,
        aula: asignaciones[0].curso?.aula || '',
      });
      const salonExiste = asignaciones.some(
        (a) => a.cursoId === this.salonCalificandoId
      );
      if (!this.salonCalificandoId || !salonExiste) {
        this.salonCalificandoId = asignaciones[0].cursoId;
      }
      const primeraDelSalon =
        asignaciones.find((a) => a.cursoId === this.salonCalificandoId) ||
        asignaciones[0];
      this.seleccionarAsignacionParaCalificar(primeraDelSalon);
    } else {
      this.salonCalificandoId = '';
      this.asignacionCalificando = null;
      this.planillaNotas = [];
    }
  }

  cargarHorariosDocente(): void {
    if (!this.docenteActivo) {
      return;
    }
    this.academicoService
      .obtenerHorarios({ docenteId: this.docenteActivo.id })
      .subscribe({
        next: (res) => {
          this.horariosDocente = res.horarios || [];
        },
      });
  }

  // ==========================================================================
  // 1. CONFIGURAR MATERIAS QUE ENSEÑA LA DOCENTE
  // ==========================================================================

  agregarMateriaQueEnsena(): void {
    if (this.asignacionForm.invalid || !this.docenteActivo) {
      this.asignacionForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const { cursoId, materiaId, intensidadHoraria } = this.asignacionForm.value;

    this.academicoService
      .asignarDocenteCursoMateria(this.docenteActivo.id, {
        cursoId,
        materiaId,
        intensidadHoraria: Number(intensidadHoraria),
        esTitularCurso: false,
      })
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.docenteActivo = res.docente;
          this.sincronizarFormularioHorario();
          this.notificar(res.mensaje);
        },
        error: () => {
          this.guardando = false;
        },
      });
  }

  quitarMateriaQueEnsena(asignacionId: string): void {
    this.academicoService.eliminarAsignacionDocente(asignacionId).subscribe({
      next: (res) => {
        this.docenteActivo = res.docente;
        this.cargarHorariosDocente();
        this.notificar(res.mensaje);
      },
    });
  }

  // ==========================================================================
  // 2. CONFIGURAR HORARIO SEMANAL POR CADA MATERIA ENSEÑADA
  // ==========================================================================

  agregarBloqueHorario(): void {
    if (this.horarioForm.invalid) {
      this.horarioForm.markAllAsTouched();
      return;
    }

    const { asignacionId, diaSemana, bloqueIndice, aula } =
      this.horarioForm.value;
    const bloques = this.bloquesHoraDisponibles;
    const bloque = bloques[Number(bloqueIndice)] || bloques[0];

    this.guardando = true;
    this.academicoService
      .crearHorario({
        asignacionId,
        diaSemana,
        horaInicio: bloque.inicio,
        horaFin: bloque.fin,
        aula,
      })
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.notificar(res.mensaje);
          this.cargarHorariosDocente();
        },
        error: () => {
          this.guardando = false;
        },
      });
  }

  eliminarBloqueHorario(horarioId: string): void {
    this.academicoService.eliminarHorario(horarioId).subscribe({
      next: (res) => {
        this.notificar(res.mensaje);
        this.cargarHorariosDocente();
      },
    });
  }

  horariosAntesDescanso(dia: DiaSemanaTipo): HorarioClaseModel[] {
    const limiteDescanso = this.esAsignacionPreescolar ? '09:30' : '10:00';
    return this.horariosDocente
      .filter((h) => h.diaSemana === dia && h.horaInicio < limiteDescanso)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  horariosDespuesDescanso(dia: DiaSemanaTipo): HorarioClaseModel[] {
    const limiteDescanso = this.esAsignacionPreescolar ? '09:30' : '10:00';
    return this.horariosDocente
      .filter((h) => h.diaSemana === dia && h.horaInicio >= limiteDescanso)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  horariosPorDia(dia: DiaSemanaTipo): HorarioClaseModel[] {
    return this.horariosDocente
      .filter((h) => h.diaSemana === dia)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  // ==========================================================================
  // 3. CALIFICACIONES / NOTAS POR SALÓN Y MATERIA (CARITAS vs 1.0-5.0)
  // ==========================================================================

  /**
   * Lista única de Salones / Cursos donde la docente tiene materias asignadas
   */
  get salonesAsignadosDocente(): NonNullable<AsignacionDocenteModel['curso']>[] {
    const mapa = new Map<string, NonNullable<AsignacionDocenteModel['curso']>>();
    for (const asig of this.docenteActivo?.asignaciones || []) {
      if (asig.curso && !mapa.has(asig.curso.id)) {
        mapa.set(asig.curso.id, asig.curso);
      }
    }
    return Array.from(mapa.values());
  }

  /**
   * Materias que la docente enseña dentro del Salón actualmente seleccionado
   */
  get asignacionesDelSalonCalificando(): AsignacionDocenteModel[] {
    if (!this.salonCalificandoId) {
      return this.docenteActivo?.asignaciones || [];
    }
    return (this.docenteActivo?.asignaciones || []).filter(
      (a) => a.cursoId === this.salonCalificandoId
    );
  }

  esSalonCaritas(curso?: AsignacionDocenteModel['curso'] | null): boolean {
    if (!curso) {
      return false;
    }
    if (curso.tipoCalificacion === 'CARITAS') {
      return true;
    }
    if (curso.tipoCalificacion === 'NUMERICA') {
      return false;
    }
    return (
      curso.nivel === 'PREESCOLAR' ||
      curso.grado === 'JARDIN' ||
      curso.grado === 'TRANSICION'
    );
  }

  get esCalificacionCaritas(): boolean {
    return this.esSalonCaritas(this.asignacionCalificando?.curso);
  }

  onCambioSalonCalificar(cursoId: string): void {
    this.salonCalificandoId = cursoId;
    const materiasSalon = this.asignacionesDelSalonCalificando;
    if (materiasSalon.length > 0) {
      this.seleccionarAsignacionParaCalificar(materiasSalon[0]);
    } else {
      this.asignacionCalificando = null;
      this.planillaNotas = [];
    }
  }

  onCambioAsignacionCalificarId(asignacionId: string): void {
    const encontrada = (this.docenteActivo?.asignaciones || []).find(
      (a) => a.id === asignacionId
    );
    if (encontrada) {
      this.salonCalificandoId = encontrada.cursoId;
      this.seleccionarAsignacionParaCalificar(encontrada);
    }
  }

  esCaritaBien(valor: number | null | undefined): boolean {
    return valor !== null && valor !== undefined && Number(valor) >= 4.0;
  }

  esCaritaNormal(valor: number | null | undefined): boolean {
    return (
      valor !== null &&
      valor !== undefined &&
      Number(valor) > 0 &&
      Number(valor) < 4.0
    );
  }

  seleccionarCaritaPeriodo(
    item: CalificacionPlanillaItemModel,
    periodo: 'notaP1' | 'notaP2' | 'notaP3' | 'notaP4',
    tipo: 'BIEN' | 'NORMAL'
  ): void {
    const valorObjetivo = tipo === 'BIEN' ? 5.0 : 3.0;
    const valorActual = item.calificacion[periodo];
    const coincideActual =
      tipo === 'BIEN'
        ? this.esCaritaBien(valorActual)
        : this.esCaritaNormal(valorActual);

    item.calificacion[periodo] = coincideActual ? null : valorObjetivo;

    // Recalcular vista previa de definitiva con carita
    const notas = [
      item.calificacion.notaP1,
      item.calificacion.notaP2,
      item.calificacion.notaP3,
      item.calificacion.notaP4,
    ]
      .filter((n) => n !== null && n !== undefined && !isNaN(Number(n)))
      .map((n) => Number(n));

    if (notas.length === 0) {
      item.calificacion.notaDefinitiva = null;
    } else {
      const prom = notas.reduce((a, b) => a + b, 0) / notas.length;
      item.calificacion.notaDefinitiva = prom >= 4.0 ? 5.0 : 3.0;
    }
  }

  seleccionarAsignacionParaCalificar(asig: AsignacionDocenteModel): void {
    this.asignacionCalificando = asig;
    this.academicoService
      .obtenerPlanillaCalificaciones(asig.cursoId, asig.materiaId)
      .subscribe({
        next: (res) => {
          this.planillaNotas = res.planilla || [];
        },
      });
  }

  guardarNotaEstudiante(item: CalificacionPlanillaItemModel): void {
    if (!this.asignacionCalificando) {
      return;
    }

    this.academicoService
      .guardarCalificacion({
        estudianteId: item.estudiante.id,
        cursoId: this.asignacionCalificando.cursoId,
        materiaId: this.asignacionCalificando.materiaId,
        docenteId: this.docenteActivo?.id || null,
        notaP1: item.calificacion.notaP1,
        notaP2: item.calificacion.notaP2,
        notaP3: item.calificacion.notaP3,
        notaP4: item.calificacion.notaP4,
        observacion: item.calificacion.observacion,
      })
      .subscribe({
        next: (res) => {
          item.calificacion.notaDefinitiva = res.calificacion.notaDefinitiva;
          this.notificar(
            `Nota actualizada para ${item.estudiante.nombres} ${item.estudiante.apellidos}`
          );
        },
      });
  }

  private notificar(mensaje: string): void {
    this.snackBar.openFromComponent(SnackBarAnnotatedComponent, {
      data: { mensajes: mensaje, accion: 'Cerrar' },
    });
  }
}
