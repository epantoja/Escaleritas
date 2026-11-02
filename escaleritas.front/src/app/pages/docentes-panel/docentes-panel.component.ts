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

@Component({
  selector: 'app-docentes-panel',
  templateUrl: './docentes-panel.component.html',
  styleUrls: ['./docentes-panel.component.css'],
})
export class DocentesPanelComponent implements OnInit {
  usuario: InfoUsuarioModel | null = null;
  esAdmin = false;

  // Si es Admin puede elegir cualquier docente; si es Docente carga su propio perfil
  docentesDisponibles: DocenteModel[] = [];
  docenteActivo: DocenteModel | null = null;
  cursosDirigidos: CursoModel[] = [];

  cursos: CursoModel[] = [];
  materias: MateriaModel[] = [];
  horariosDocente: HorarioClaseModel[] = [];

  // Planilla de notas de la materia seleccionada
  asignacionCalificando: AsignacionDocenteModel | null = null;
  planillaNotas: CalificacionPlanillaItemModel[] = [];

  // Pestaña activa: 'MATERIAS_HORARIO' | 'CALIFICACIONES' | 'DIRECCION_GRUPO'
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

  readonly bloquesHora: { inicio: string; fin: string; etiqueta: string }[] = [
    { inicio: '07:00', fin: '08:00', etiqueta: '07:00 AM - 08:00 AM' },
    { inicio: '08:00', fin: '09:00', etiqueta: '08:00 AM - 09:00 AM' },
    { inicio: '09:00', fin: '10:00', etiqueta: '09:00 AM - 10:00 AM' },
    { inicio: '10:30', fin: '11:30', etiqueta: '10:30 AM - 11:30 AM' },
    { inicio: '11:30', fin: '12:30', etiqueta: '11:30 AM - 12:30 PM' },
    { inicio: '12:30', fin: '13:30', etiqueta: '12:30 PM - 01:30 PM' },
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
        aula: asignaciones[0].curso?.aula || '',
      });
      if (!this.asignacionCalificando) {
        this.seleccionarAsignacionParaCalificar(asignaciones[0]);
      }
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
    const bloque = this.bloquesHora[Number(bloqueIndice)] || this.bloquesHora[0];

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

  horariosPorDia(dia: DiaSemanaTipo): HorarioClaseModel[] {
    return this.horariosDocente
      .filter((h) => h.diaSemana === dia)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  // ==========================================================================
  // 3. CALIFICACIONES / NOTAS POR MATERIA
  // ==========================================================================

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

