import { Component, OnInit } from '@angular/core';
import { AcademicoService } from '../services/academico.service';
import { LoginService } from '../services/login.service';
import {
  CursoModel,
  DiaSemanaTipo,
  EstudianteModel,
  HorarioClaseModel,
  MateriaYNotaEstudianteModel,
} from '../models/academico.model';
import { InfoUsuarioModel } from '../../components/models/infoUsuario.model';

@Component({
  selector: 'app-portal-estudiante',
  templateUrl: './portal-estudiante.component.html',
  styleUrls: ['./portal-estudiante.component.css'],
})
export class PortalEstudianteComponent implements OnInit {
  usuario: InfoUsuarioModel | null = null;
  estudiante: EstudianteModel | null = null;
  curso: CursoModel | null = null;
  materiasYNotas: MateriaYNotaEstudianteModel[] = [];
  horarios: HorarioClaseModel[] = [];
  estudiantesDisponibles: {
    id: string;
    codigoMatricula: string;
    nombres: string;
    apellidos: string;
    documento: string;
    curso?: { id: string; nombre: string; codigo: string };
  }[] = [];

  cargando = false;
  vistaActiva: 'BOLETIN' | 'HORARIO' = 'BOLETIN';

  readonly diasSemana: { codigo: DiaSemanaTipo; nombre: string }[] = [
    { codigo: 'LUNES', nombre: 'Lunes' },
    { codigo: 'MARTES', nombre: 'Martes' },
    { codigo: 'MIERCOLES', nombre: 'Miércoles' },
    { codigo: 'JUEVES', nombre: 'Jueves' },
    { codigo: 'VIERNES', nombre: 'Viernes' },
  ];

  constructor(
    private academicoService: AcademicoService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.usuario = this.loginService.informacionUsuario();
    this.cargarPortal();
  }

  cargarPortal(estudianteId?: string): void {
    this.cargando = true;
    this.academicoService.obtenerPortalEstudiante(estudianteId).subscribe({
      next: (res) => {
        this.estudiante = res.estudiante;
        this.curso = res.curso;
        this.materiasYNotas = res.materiasYNotas || [];
        this.horarios = res.horarios || [];
        this.estudiantesDisponibles = res.estudiantesDisponibles || [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  horariosPorDia(dia: DiaSemanaTipo): HorarioClaseModel[] {
    return this.horarios
      .filter((h) => h.diaSemana === dia)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  get esCursoPreescolar(): boolean {
    if (!this.curso) {
      return false;
    }
    const cod = (this.curso.codigo || '').toUpperCase();
    return (
      this.curso.nivel === 'PREESCOLAR' ||
      this.curso.grado === 'JARDIN' ||
      this.curso.grado === 'TRANSICION' ||
      cod.includes('TRANS') ||
      cod.includes('JAR')
    );
  }

  get esCalificacionCaritas(): boolean {
    if (!this.curso) {
      return false;
    }
    if (this.curso.tipoCalificacion === 'CARITAS') {
      return true;
    }
    if (this.curso.tipoCalificacion === 'NUMERICA') {
      return false;
    }
    return this.esCursoPreescolar;
  }

  formatearCarita(nota: number | null | undefined): {
    simbolo: string;
    texto: string;
    clase: string;
  } | null {
    if (nota === null || nota === undefined) {
      return null;
    }
    const val = Number(nota);
    if (val >= 4.0) {
      return { simbolo: '😊 :)', texto: 'Bien', clase: 'carita-pill-bien' };
    }
    return { simbolo: '😐 :|', texto: 'Normal', clase: 'carita-pill-normal' };
  }

  horariosAntesDescanso(dia: DiaSemanaTipo): HorarioClaseModel[] {
    const horaCorte = this.esCursoPreescolar ? '09:30' : '10:00';
    return this.horariosPorDia(dia).filter((h) => h.horaFin <= horaCorte);
  }

  horariosDespuesDescanso(dia: DiaSemanaTipo): HorarioClaseModel[] {
    const horaCorte = this.esCursoPreescolar ? '09:30' : '10:00';
    return this.horariosPorDia(dia).filter((h) => h.horaFin > horaCorte);
  }

  nivelDesempeno(nota: number | null): { etiqueta: string; clase: string } {
    if (nota === null || nota === undefined) {
      return { etiqueta: 'En curso', clase: 'perf-pending' };
    }
    const valor = Number(nota);
    if (this.esCalificacionCaritas) {
      if (valor >= 4.0) {
        return { etiqueta: '😊 :) Bien', clase: 'perf-sup' };
      }
      return { etiqueta: '😐 :| Normal', clase: 'perf-basic' };
    }
    if (valor >= 4.6) {
      return { etiqueta: 'Superior', clase: 'perf-sup' };
    }
    if (valor >= 4.0) {
      return { etiqueta: 'Alto', clase: 'perf-high' };
    }
    if (valor >= 3.0) {
      return { etiqueta: 'Básico', clase: 'perf-basic' };
    }
    return { etiqueta: 'Bajo', clase: 'perf-low' };
  }

  get promedioGeneral(): string {
    const validas = this.materiasYNotas
      .map((m) => m.notaDefinitiva)
      .filter((n) => n !== null && n !== undefined)
      .map((n) => Number(n));
    if (validas.length === 0) {
      return '—';
    }
    const suma = validas.reduce((a, b) => a + b, 0);
    const prom = suma / validas.length;
    if (this.esCalificacionCaritas) {
      return prom >= 4.0 ? '😊 :) Bien' : '😐 :| Normal';
    }
    return prom.toFixed(2);
  }
}

