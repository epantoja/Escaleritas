export type GradoEscolarTipo =
  | 'JARDIN'
  | 'TRANSICION'
  | 'PRIMERO'
  | 'SEGUNDO'
  | 'TERCERO'
  | 'CUARTO'
  | 'QUINTO';

export type EstadoMatriculaTipo =
  | 'MATRICULADO'
  | 'PREMATRICULADO'
  | 'RETIRADO'
  | 'GRADUADO';

export type DiaSemanaTipo =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES';

export interface MateriaModel {
  id: string;
  codigo: string;
  nombre: string;
  area?: string | null;
  intensidadHoraria: number;
  descripcion?: string | null;
}

export interface HorarioClaseModel {
  id: string;
  asignacionId: string;
  docenteId: string;
  cursoId: string;
  materiaId: string;
  diaSemana: DiaSemanaTipo | string;
  horaInicio: string;
  horaFin: string;
  aula?: string | null;
  curso?: {
    id: string;
    codigo: string;
    nombre: string;
    grado: string;
    grupo: string;
    nivel: string;
    aula?: string | null;
  };
  materia?: MateriaModel;
  docente?: {
    id: string;
    codigoDocente: string;
    nombres: string;
    apellidos: string;
    especialidad: string;
  };
}

export interface AsignacionDocenteModel {
  id: string;
  docenteId: string;
  cursoId: string;
  materiaId: string;
  intensidadHoraria: number;
  anioLectivo: number;
  esTitularCurso: boolean;
  curso?: {
    id: string;
    codigo: string;
    nombre: string;
    grado: GradoEscolarTipo | string;
    grupo: string;
    nivel: string;
    aula?: string | null;
  };
  materia?: MateriaModel;
  docente?: {
    id: string;
    codigoDocente: string;
    nombres: string;
    apellidos: string;
    especialidad: string;
  };
  horarios?: HorarioClaseModel[];
}

export interface DocenteModel {
  id: string;
  codigoDocente: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  email: string;
  telefono?: string | null;
  especialidad: string;
  tituloAcademico?: string | null;
  fechaIngreso?: string | null;
  usuarioId?: string | null;
  estado: number;
  usuario?: {
    id: string;
    codUsuario: string;
    email: string;
    estado: number;
  } | null;
  asignaciones?: AsignacionDocenteModel[];
}

export interface CursoModel {
  id: string;
  codigo: string;
  nombre: string;
  grado: GradoEscolarTipo | string;
  ordenGrado: number;
  grupo: string;
  nivel: 'PREESCOLAR' | 'PRIMARIA' | string;
  anioLectivo: number;
  cupoMaximo: number;
  aula?: string | null;
  directorDocenteId?: string | null;
  directorGrupo?: {
    id: string;
    codigoDocente: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string | null;
    especialidad: string;
  } | null;
  estudiantes?: {
    id: string;
    codigoMatricula: string;
    nombres: string;
    apellidos: string;
    documento?: string;
    estadoMatricula: EstadoMatriculaTipo;
  }[];
  asignacionesDocentes?: AsignacionDocenteModel[];
}

export interface EstudianteModel {
  id: string;
  codigoMatricula: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  fechaNacimiento?: string | null;
  genero?: string | null;
  direccion?: string | null;
  eps?: string | null;
  tipoSangre?: string | null;
  acudienteNombre: string;
  acudienteTelefono: string;
  acudienteEmail?: string | null;
  acudienteParentesco: string;
  cursoId: string;
  fechaMatricula: string;
  estadoMatricula: EstadoMatriculaTipo | string;
  observaciones?: string | null;
  estado: number;
  curso?: {
    id: string;
    codigo: string;
    nombre: string;
    grado: string;
    grupo: string;
    nivel: string;
    aula?: string | null;
  };
}

export interface CalificacionPlanillaItemModel {
  estudiante: EstudianteModel;
  calificacion: {
    id?: string;
    estudianteId: string;
    cursoId: string;
    materiaId: string;
    notaP1: number | null;
    notaP2: number | null;
    notaP3: number | null;
    notaP4: number | null;
    notaDefinitiva: number | null;
    observacion: string | null;
  };
}

export interface MateriaYNotaEstudianteModel {
  asignacionId: string;
  materia: MateriaModel;
  docente: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    especialidad: string;
  };
  intensidadHoraria: number;
  notaP1: number | null;
  notaP2: number | null;
  notaP3: number | null;
  notaP4: number | null;
  notaDefinitiva: number | null;
  observacion: string | null;
}

export interface PortalEstudianteResponseModel {
  ok: boolean;
  estudiante: EstudianteModel | null;
  curso: CursoModel | null;
  materiasYNotas: MateriaYNotaEstudianteModel[];
  horarios: HorarioClaseModel[];
  estudiantesDisponibles: {
    id: string;
    codigoMatricula: string;
    nombres: string;
    apellidos: string;
    documento: string;
    cursoId: string;
    curso?: { id: string; nombre: string; codigo: string };
  }[];
}
