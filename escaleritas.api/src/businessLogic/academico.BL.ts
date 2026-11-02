import { Op } from 'sequelize';
import {
  sequelize,
  Curso,
  Materia,
  Docente,
  DocenteCursoMateria,
  Estudiante,
} from '../models';
import { AppError } from '../middlewares/error.middleware';

// ============================================================================
// INTERFACES Y DTOs
// ============================================================================

export interface FiltroEstudiantesDTO {
  busqueda?: string;
  cursoId?: string;
  estadoMatricula?: string;
}

export interface CrearEstudianteDTO {
  codigoMatricula?: string;
  nombres: string;
  apellidos: string;
  tipoDocumento?: string;
  documento: string;
  fechaNacimiento?: string | null;
  genero?: string | null;
  direccion?: string | null;
  eps?: string | null;
  tipoSangre?: string | null;
  acudienteNombre: string;
  acudienteTelefono: string;
  acudienteEmail?: string | null;
  acudienteParentesco?: string;
  cursoId: string;
  fechaMatricula?: string;
  estadoMatricula?: string;
  observaciones?: string | null;
}

export interface AsignacionInputDTO {
  cursoId: string;
  materiaId: string;
  intensidadHoraria?: number;
  esTitularCurso?: boolean;
}

export interface FiltroDocentesDTO {
  busqueda?: string;
  cursoId?: string;
  especialidad?: string;
}

export interface CrearDocenteDTO {
  codigoDocente?: string;
  nombres: string;
  apellidos: string;
  tipoDocumento?: string;
  documento: string;
  email: string;
  telefono?: string | null;
  especialidad: string;
  tituloAcademico?: string | null;
  fechaIngreso?: string | null;
  asignaciones?: AsignacionInputDTO[];
}

// ============================================================================
// 1. SERVICIOS DE CURSOS Y MATERIAS (Jardín a 5° de Primaria)
// ============================================================================

export const listarCursosBL = async () => {
  const cursos = await Curso.findAll({
    where: { estado: 1 },
    include: [
      {
        model: Docente,
        as: 'directorGrupo',
        attributes: ['id', 'codigoDocente', 'nombres', 'apellidos', 'email', 'especialidad'],
      },
      {
        model: Estudiante,
        as: 'estudiantes',
        where: { estado: 1 },
        required: false,
        attributes: ['id', 'codigoMatricula', 'nombres', 'apellidos', 'estadoMatricula'],
      },
      {
        model: DocenteCursoMateria,
        as: 'asignacionesDocentes',
        where: { estado: 1 },
        required: false,
        include: [
          {
            model: Docente,
            as: 'docente',
            attributes: ['id', 'codigoDocente', 'nombres', 'apellidos', 'especialidad'],
          },
          {
            model: Materia,
            as: 'materia',
            attributes: ['id', 'codigo', 'nombre', 'area', 'intensidadHoraria'],
          },
        ],
      },
    ],
    order: [
      ['ordenGrado', 'ASC'],
      ['grupo', 'ASC'],
    ],
  });

  return cursos;
};

export const actualizarCursoBL = async (
  cursoId: string,
  datos: Partial<{
    nombre: string;
    cupoMaximo: number;
    aula: string;
    directorDocenteId: string | null;
  }>
) => {
  const curso = await Curso.findByPk(cursoId);
  if (!curso) {
    throw new AppError('El curso especificado no existe', 404);
  }

  await curso.update(datos);
  return curso;
};

export const listarMateriasBL = async () => {
  return Materia.findAll({
    where: { estado: 1 },
    order: [['nombre', 'ASC']],
  });
};

export const crearMateriaBL = async (datos: {
  codigo: string;
  nombre: string;
  area?: string;
  intensidadHoraria?: number;
  descripcion?: string;
}) => {
  if (!datos.codigo || !datos.nombre) {
    throw new AppError('El código y nombre de la materia son obligatorios', 400);
  }
  return Materia.create({
    codigo: datos.codigo.trim().toUpperCase(),
    nombre: datos.nombre.trim(),
    area: datos.area?.trim() || 'General',
    intensidadHoraria: Number(datos.intensidadHoraria) || 4,
    descripcion: datos.descripcion?.trim() || null,
    estado: 1,
  });
};

// ============================================================================
// 2. CRUD COMPLETO DE ESTUDIANTES Y MATRÍCULAS
// ============================================================================

export const listarEstudiantesBL = async (filtros: FiltroEstudiantesDTO) => {
  const whereClause: any = { estado: 1 };

  if (filtros.cursoId) {
    whereClause.cursoId = filtros.cursoId;
  }

  if (filtros.estadoMatricula) {
    whereClause.estadoMatricula = filtros.estadoMatricula;
  }

  if (filtros.busqueda?.trim()) {
    const q = `%${filtros.busqueda.trim()}%`;
    whereClause[Op.or] = [
      { nombres: { [Op.iLike]: q } },
      { apellidos: { [Op.iLike]: q } },
      { documento: { [Op.iLike]: q } },
      { codigoMatricula: { [Op.iLike]: q } },
      { acudienteNombre: { [Op.iLike]: q } },
    ];
  }

  return Estudiante.findAll({
    where: whereClause,
    include: [
      {
        model: Curso,
        as: 'curso',
        attributes: ['id', 'codigo', 'nombre', 'grado', 'grupo', 'nivel', 'aula'],
      },
    ],
    order: [
      ['apellidos', 'ASC'],
      ['nombres', 'ASC'],
    ],
  });
};

export const obtenerEstudiantePorIdBL = async (id: string) => {
  const estudiante = await Estudiante.findByPk(id, {
    include: [
      {
        model: Curso,
        as: 'curso',
      },
    ],
  });

  if (!estudiante) {
    throw new AppError('Estudiante no encontrado', 404);
  }

  return estudiante;
};

export const crearEstudianteBL = async (dto: CrearEstudianteDTO) => {
  const curso = await Curso.findByPk(dto.cursoId, {
    include: [
      {
        model: Estudiante,
        as: 'estudiantes',
        where: { estado: 1, estadoMatricula: 'MATRICULADO' },
        required: false,
      },
    ],
  });

  if (!curso) {
    throw new AppError('El curso o grado seleccionado no existe', 404);
  }

  const matriculadosActuales = curso.estudiantes?.length || 0;
  if (matriculadosActuales >= curso.cupoMaximo) {
    throw new AppError(
      `El curso ${curso.nombre} ha alcanzado su cupo máximo (${curso.cupoMaximo} estudiantes)`,
      409
    );
  }

  const docExistente = await Estudiante.findOne({
    where: { documento: dto.documento.trim() },
  });
  if (docExistente) {
    throw new AppError(
      `Ya existe un estudiante registrado con el documento ${dto.documento}`,
      409
    );
  }

  const anio = new Date().getFullYear();
  const sufijo = Math.floor(1000 + Math.random() * 9000);
  const codigoGenerado =
    dto.codigoMatricula?.trim() || `MAT-${anio}-${sufijo}`;

  const nuevo = await Estudiante.create({
    codigoMatricula: codigoGenerado,
    nombres: dto.nombres.trim(),
    apellidos: dto.apellidos.trim(),
    tipoDocumento: dto.tipoDocumento || 'RC',
    documento: dto.documento.trim(),
    fechaNacimiento: dto.fechaNacimiento || null,
    genero: dto.genero || null,
    direccion: dto.direccion?.trim() || null,
    eps: dto.eps?.trim() || null,
    tipoSangre: dto.tipoSangre || null,
    acudienteNombre: dto.acudienteNombre.trim(),
    acudienteTelefono: dto.acudienteTelefono.trim(),
    acudienteEmail: dto.acudienteEmail?.trim() || null,
    acudienteParentesco: dto.acudienteParentesco?.trim() || 'Madre / Padre',
    cursoId: dto.cursoId,
    fechaMatricula: dto.fechaMatricula || new Date().toISOString().slice(0, 10),
    estadoMatricula: dto.estadoMatricula || 'MATRICULADO',
    observaciones: dto.observaciones?.trim() || null,
    estado: 1,
  });

  return obtenerEstudiantePorIdBL(nuevo.id);
};

export const actualizarEstudianteBL = async (
  id: string,
  dto: Partial<CrearEstudianteDTO>
) => {
  const estudiante = await Estudiante.findByPk(id);
  if (!estudiante) {
    throw new AppError('Estudiante no encontrado', 404);
  }

  if (dto.cursoId && dto.cursoId !== estudiante.cursoId) {
    const nuevoCurso = await Curso.findByPk(dto.cursoId);
    if (!nuevoCurso) {
      throw new AppError('El nuevo curso seleccionado no existe', 404);
    }
  }

  await estudiante.update({
    nombres: dto.nombres?.trim() ?? estudiante.nombres,
    apellidos: dto.apellidos?.trim() ?? estudiante.apellidos,
    tipoDocumento: dto.tipoDocumento ?? estudiante.tipoDocumento,
    documento: dto.documento?.trim() ?? estudiante.documento,
    fechaNacimiento:
      dto.fechaNacimiento !== undefined
        ? dto.fechaNacimiento || null
        : estudiante.fechaNacimiento,
    genero: dto.genero !== undefined ? dto.genero : estudiante.genero,
    direccion:
      dto.direccion !== undefined
        ? dto.direccion?.trim() || null
        : estudiante.direccion,
    eps: dto.eps !== undefined ? dto.eps?.trim() || null : estudiante.eps,
    tipoSangre:
      dto.tipoSangre !== undefined ? dto.tipoSangre : estudiante.tipoSangre,
    acudienteNombre:
      dto.acudienteNombre?.trim() ?? estudiante.acudienteNombre,
    acudienteTelefono:
      dto.acudienteTelefono?.trim() ?? estudiante.acudienteTelefono,
    acudienteEmail:
      dto.acudienteEmail !== undefined
        ? dto.acudienteEmail?.trim() || null
        : estudiante.acudienteEmail,
    acudienteParentesco:
      dto.acudienteParentesco ?? estudiante.acudienteParentesco,
    cursoId: dto.cursoId ?? estudiante.cursoId,
    estadoMatricula: dto.estadoMatricula ?? estudiante.estadoMatricula,
    observaciones:
      dto.observaciones !== undefined
        ? dto.observaciones?.trim() || null
        : estudiante.observaciones,
  });

  return obtenerEstudiantePorIdBL(estudiante.id);
};

export const eliminarEstudianteBL = async (id: string) => {
  const estudiante = await Estudiante.findByPk(id);
  if (!estudiante) {
    throw new AppError('Estudiante no encontrado', 404);
  }

  await estudiante.update({
    estado: 0,
    estadoMatricula: 'RETIRADO',
  });

  return { id, mensaje: 'Estudiante retirado correctamente del directorio activo' };
};

// ============================================================================
// 3. CRUD COMPLETO DE DOCENTES Y ASIGNACIÓN N:M (CURSOS Y MATERIAS)
// ============================================================================

export const listarDocentesBL = async (filtros: FiltroDocentesDTO) => {
  const whereClause: any = { estado: 1 };

  if (filtros.especialidad?.trim()) {
    whereClause.especialidad = { [Op.iLike]: `%${filtros.especialidad.trim()}%` };
  }

  if (filtros.busqueda?.trim()) {
    const q = `%${filtros.busqueda.trim()}%`;
    whereClause[Op.or] = [
      { nombres: { [Op.iLike]: q } },
      { apellidos: { [Op.iLike]: q } },
      { documento: { [Op.iLike]: q } },
      { codigoDocente: { [Op.iLike]: q } },
      { email: { [Op.iLike]: q } },
      { especialidad: { [Op.iLike]: q } },
    ];
  }

  const whereAsignacion: any = { estado: 1 };
  if (filtros.cursoId) {
    whereAsignacion.cursoId = filtros.cursoId;
  }

  return Docente.findAll({
    where: whereClause,
    include: [
      {
        model: DocenteCursoMateria,
        as: 'asignaciones',
        where: whereAsignacion,
        required: Boolean(filtros.cursoId),
        include: [
          {
            model: Curso,
            as: 'curso',
            attributes: ['id', 'codigo', 'nombre', 'grado', 'grupo', 'nivel'],
          },
          {
            model: Materia,
            as: 'materia',
            attributes: ['id', 'codigo', 'nombre', 'area', 'intensidadHoraria'],
          },
        ],
      },
    ],
    order: [
      ['apellidos', 'ASC'],
      ['nombres', 'ASC'],
    ],
  });
};

export const obtenerDocentePorIdBL = async (id: string) => {
  const docente = await Docente.findByPk(id, {
    include: [
      {
        model: DocenteCursoMateria,
        as: 'asignaciones',
        where: { estado: 1 },
        required: false,
        include: [
          {
            model: Curso,
            as: 'curso',
            attributes: ['id', 'codigo', 'nombre', 'grado', 'grupo', 'nivel'],
          },
          {
            model: Materia,
            as: 'materia',
            attributes: ['id', 'codigo', 'nombre', 'area', 'intensidadHoraria'],
          },
        ],
      },
    ],
  });

  if (!docente) {
    throw new AppError('Docente no encontrado', 404);
  }

  return docente;
};

export const crearDocenteBL = async (dto: CrearDocenteDTO) => {
  const existente = await Docente.findOne({
    where: {
      [Op.or]: [
        { documento: dto.documento.trim() },
        { email: dto.email.trim().toLowerCase() },
      ],
    },
  });

  if (existente) {
    throw new AppError(
      'Ya existe un docente registrado con ese documento o correo electrónico',
      409
    );
  }

  const anio = new Date().getFullYear();
  const sufijo = Math.floor(100 + Math.random() * 900);
  const codigoGenerado =
    dto.codigoDocente?.trim() || `DOC-${anio}-${sufijo}`;

  const transaccion = await sequelize.transaction();
  try {
    const nuevoDocente = await Docente.create(
      {
        codigoDocente: codigoGenerado,
        nombres: dto.nombres.trim(),
        apellidos: dto.apellidos.trim(),
        tipoDocumento: dto.tipoDocumento || 'CC',
        documento: dto.documento.trim(),
        email: dto.email.trim().toLowerCase(),
        telefono: dto.telefono?.trim() || null,
        especialidad: dto.especialidad.trim(),
        tituloAcademico: dto.tituloAcademico?.trim() || null,
        fechaIngreso: dto.fechaIngreso || new Date().toISOString().slice(0, 10),
        estado: 1,
      },
      { transaction: transaccion }
    );

    if (Array.isArray(dto.asignaciones) && dto.asignaciones.length > 0) {
      for (const asig of dto.asignaciones) {
        await DocenteCursoMateria.create(
          {
            docenteId: nuevoDocente.id,
            cursoId: asig.cursoId,
            materiaId: asig.materiaId,
            intensidadHoraria: Number(asig.intensidadHoraria) || 4,
            anioLectivo: anio,
            esTitularCurso: Boolean(asig.esTitularCurso),
            estado: 1,
          },
          { transaction: transaccion }
        );

        if (asig.esTitularCurso) {
          await Curso.update(
            { directorDocenteId: nuevoDocente.id },
            { where: { id: asig.cursoId }, transaction: transaccion }
          );
        }
      }
    }

    await transaccion.commit();
    return obtenerDocentePorIdBL(nuevoDocente.id);
  } catch (error) {
    await transaccion.rollback();
    throw error;
  }
};

export const actualizarDocenteBL = async (
  id: string,
  dto: Partial<CrearDocenteDTO>
) => {
  const docente = await Docente.findByPk(id);
  if (!docente) {
    throw new AppError('Docente no encontrado', 404);
  }

  await docente.update({
    nombres: dto.nombres?.trim() ?? docente.nombres,
    apellidos: dto.apellidos?.trim() ?? docente.apellidos,
    tipoDocumento: dto.tipoDocumento ?? docente.tipoDocumento,
    documento: dto.documento?.trim() ?? docente.documento,
    email: dto.email?.trim().toLowerCase() ?? docente.email,
    telefono:
      dto.telefono !== undefined
        ? dto.telefono?.trim() || null
        : docente.telefono,
    especialidad: dto.especialidad?.trim() ?? docente.especialidad,
    tituloAcademico:
      dto.tituloAcademico !== undefined
        ? dto.tituloAcademico?.trim() || null
        : docente.tituloAcademico,
    fechaIngreso:
      dto.fechaIngreso !== undefined
        ? dto.fechaIngreso || null
        : docente.fechaIngreso,
  });

  return obtenerDocentePorIdBL(docente.id);
};

export const eliminarDocenteBL = async (id: string) => {
  const docente = await Docente.findByPk(id);
  if (!docente) {
    throw new AppError('Docente no encontrado', 404);
  }

  await DocenteCursoMateria.update(
    { estado: 0 },
    { where: { docenteId: id } }
  );
  await Curso.update(
    { directorDocenteId: null },
    { where: { directorDocenteId: id } }
  );
  await docente.update({ estado: 0 });

  return { id, mensaje: 'Docente desvinculado correctamente del directorio activo' };
};

/**
 * Asigna un Docente a un Curso (Jardín a 5°) y una Materia específica (Relación N:M)
 */
export const asignarDocenteCursoMateriaBL = async (
  docenteId: string,
  dto: AsignacionInputDTO
) => {
  const docente = await Docente.findByPk(docenteId);
  if (!docente) {
    throw new AppError('El docente especificado no existe', 404);
  }

  const curso = await Curso.findByPk(dto.cursoId);
  if (!curso) {
    throw new AppError('El curso o grado especificado no existe', 404);
  }

  const materia = await Materia.findByPk(dto.materiaId);
  if (!materia) {
    throw new AppError('La materia especificada no existe', 404);
  }

  const anioActual = new Date().getFullYear();

  const [asignacion, creada] = await DocenteCursoMateria.findOrCreate({
    where: {
      docenteId,
      cursoId: dto.cursoId,
      materiaId: dto.materiaId,
      anioLectivo: anioActual,
    },
    defaults: {
      docenteId,
      cursoId: dto.cursoId,
      materiaId: dto.materiaId,
      intensidadHoraria: Number(dto.intensidadHoraria) || materia.intensidadHoraria || 4,
      anioLectivo: anioActual,
      esTitularCurso: Boolean(dto.esTitularCurso),
      estado: 1,
    },
  });

  if (!creada) {
    await asignacion.update({
      intensidadHoraria: Number(dto.intensidadHoraria) || asignacion.intensidadHoraria,
      esTitularCurso: Boolean(dto.esTitularCurso),
      estado: 1,
    });
  }

  if (dto.esTitularCurso) {
    await curso.update({ directorDocenteId: docenteId });
  }

  return obtenerDocentePorIdBL(docenteId);
};

export const eliminarAsignacionDocenteBL = async (asignacionId: string) => {
  const asignacion = await DocenteCursoMateria.findByPk(asignacionId);
  if (!asignacion) {
    throw new AppError('La asignación académica no existe', 404);
  }

  const docenteId = asignacion.docenteId;
  await asignacion.destroy();

  return obtenerDocentePorIdBL(docenteId);
};

