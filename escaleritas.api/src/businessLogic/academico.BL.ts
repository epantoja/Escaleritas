import { Op } from 'sequelize';
import {
  sequelize,
  Curso,
  Materia,
  Docente,
  DocenteCursoMateria,
  Estudiante,
  HorarioClase,
  Calificacion,
  Usuario,
} from '../models';
import { AppError } from '../middlewares/error.middleware';
import { JwtUserPayload } from '../middlewares/autenticacion';

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
  usuarioId?: string | null;
  asignaciones?: AsignacionInputDTO[];
}

export interface CrearHorarioDTO {
  asignacionId: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  aula?: string | null;
}

export interface GuardarCalificacionDTO {
  estudianteId: string;
  cursoId: string;
  materiaId: string;
  docenteId?: string | null;
  notaP1?: number | null;
  notaP2?: number | null;
  notaP3?: number | null;
  notaP4?: number | null;
  observacion?: string | null;
}

// ============================================================================
// 1. SERVICIOS DE CURSOS / SALONES Y DIRECTORA DE GRUPO
// ============================================================================

export const listarCursosBL = async () => {
  const cursos = await Curso.findAll({
    where: { estado: 1 },
    include: [
      {
        model: Docente,
        as: 'directorGrupo',
        attributes: [
          'id',
          'codigoDocente',
          'nombres',
          'apellidos',
          'email',
          'telefono',
          'especialidad',
        ],
      },
      {
        model: Estudiante,
        as: 'estudiantes',
        where: { estado: 1 },
        required: false,
        attributes: [
          'id',
          'codigoMatricula',
          'nombres',
          'apellidos',
          'documento',
          'estadoMatricula',
        ],
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
          {
            model: HorarioClase,
            as: 'horarios',
            where: { estado: 1 },
            required: false,
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

/**
 * Permite actualizar salón/curso y asignar una Docente como Directora de Grupo
 */
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
    throw new AppError('El curso o salón especificado no existe', 404);
  }

  if (datos.directorDocenteId) {
    const docente = await Docente.findByPk(datos.directorDocenteId);
    if (!docente) {
      throw new AppError('La docente seleccionada como directora de grupo no existe', 404);
    }
  }

  await curso.update({
    nombre: datos.nombre?.trim() ?? curso.nombre,
    cupoMaximo:
      datos.cupoMaximo !== undefined ? Number(datos.cupoMaximo) : curso.cupoMaximo,
    aula: datos.aula !== undefined ? datos.aula?.trim() || null : curso.aula,
    directorDocenteId:
      datos.directorDocenteId !== undefined
        ? datos.directorDocenteId || null
        : curso.directorDocenteId,
  });

  // Sincronizar marca esTitularCurso en las asignaciones del curso
  if (datos.directorDocenteId !== undefined) {
    await DocenteCursoMateria.update(
      { esTitularCurso: false },
      { where: { cursoId } }
    );
    if (datos.directorDocenteId) {
      await DocenteCursoMateria.update(
        { esTitularCurso: true },
        { where: { cursoId, docenteId: datos.directorDocenteId } }
      );
    }
  }

  const cursosActualizados = await listarCursosBL();
  return cursosActualizados.find((c) => c.id === cursoId) || curso;
};

// ============================================================================
// 2. CRUD COMPLETO DE MATERIAS (ADMINISTRACIÓN DE MATERIAS)
// ============================================================================

export const listarMateriasBL = async (busqueda?: string) => {
  const whereClause: any = { estado: 1 };
  if (busqueda?.trim()) {
    const q = `%${busqueda.trim()}%`;
    whereClause[Op.or] = [
      { codigo: { [Op.iLike]: q } },
      { nombre: { [Op.iLike]: q } },
      { area: { [Op.iLike]: q } },
    ];
  }

  return Materia.findAll({
    where: whereClause,
    order: [
      ['area', 'ASC'],
      ['nombre', 'ASC'],
    ],
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

  const existente = await Materia.findOne({
    where: { codigo: datos.codigo.trim().toUpperCase() },
  });
  if (existente) {
    throw new AppError('Ya existe una materia con ese código', 409);
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

export const actualizarMateriaBL = async (
  id: string,
  datos: Partial<{
    codigo: string;
    nombre: string;
    area: string;
    intensidadHoraria: number;
    descripcion: string;
  }>
) => {
  const materia = await Materia.findByPk(id);
  if (!materia) {
    throw new AppError('La materia especificada no existe', 404);
  }

  await materia.update({
    codigo: datos.codigo ? datos.codigo.trim().toUpperCase() : materia.codigo,
    nombre: datos.nombre ? datos.nombre.trim() : materia.nombre,
    area: datos.area !== undefined ? datos.area.trim() : materia.area,
    intensidadHoraria:
      datos.intensidadHoraria !== undefined
        ? Number(datos.intensidadHoraria)
        : materia.intensidadHoraria,
    descripcion:
      datos.descripcion !== undefined
        ? datos.descripcion?.trim() || null
        : materia.descripcion,
  });

  return materia;
};

export const eliminarMateriaBL = async (id: string) => {
  const materia = await Materia.findByPk(id);
  if (!materia) {
    throw new AppError('La materia especificada no existe', 404);
  }

  await materia.update({ estado: 0 });
  return { id, mensaje: 'Materia eliminada del catálogo activo' };
};

// ============================================================================
// 3. CRUD COMPLETO DE ESTUDIANTES Y MATRÍCULAS
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
// 4. CRUD DE DOCENTES, ASIGNACIONES N:M Y HORARIOS SEMANALES
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
            attributes: ['id', 'codigo', 'nombre', 'grado', 'grupo', 'nivel', 'aula'],
          },
          {
            model: Materia,
            as: 'materia',
            attributes: ['id', 'codigo', 'nombre', 'area', 'intensidadHoraria'],
          },
          {
            model: HorarioClase,
            as: 'horarios',
            where: { estado: 1 },
            required: false,
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
            attributes: ['id', 'codigo', 'nombre', 'grado', 'grupo', 'nivel', 'aula'],
          },
          {
            model: Materia,
            as: 'materia',
            attributes: ['id', 'codigo', 'nombre', 'area', 'intensidadHoraria'],
          },
          {
            model: HorarioClase,
            as: 'horarios',
            where: { estado: 1 },
            required: false,
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

/**
 * Obtiene (o inicializa automáticamente) el perfil Docente del usuario autenticado
 */
export const obtenerMiPerfilDocenteBL = async (userPayload: JwtUserPayload) => {
  let docente = await Docente.findOne({
    where: {
      [Op.or]: [
        { usuarioId: userPayload.user_id },
        ...(userPayload.email ? [{ email: userPayload.email.toLowerCase() }] : []),
      ],
    },
  });

  if (!docente) {
    const usuarioDb = await Usuario.findByPk(userPayload.user_id);
    const anio = new Date().getFullYear();
    const sufijo = Math.floor(100 + Math.random() * 900);

    docente = await Docente.create({
      codigoDocente: `DOC-${anio}-${sufijo}`,
      nombres: usuarioDb?.nombres || userPayload.nombre || 'Docente',
      apellidos: usuarioDb?.apellidos || userPayload.apellido || 'Institucional',
      tipoDocumento: 'CC',
      documento: usuarioDb?.documento || `DOC-${sufijo}-${Date.now().toString().slice(-4)}`,
      email:
        usuarioDb?.email ||
        userPayload.email ||
        `${userPayload.usuario.toLowerCase()}@escaleritas.edu.co`,
      especialidad: 'Docente de Planta',
      tituloAcademico: 'Licenciado(a) en Educación',
      fechaIngreso: new Date().toISOString().slice(0, 10),
      usuarioId: userPayload.user_id,
      estado: 1,
    });
  } else if (!docente.usuarioId) {
    await docente.update({ usuarioId: userPayload.user_id });
  }

  const perfilCompleto = await obtenerDocentePorIdBL(docente.id);
  const cursosDirigidos = await Curso.findAll({
    where: { directorDocenteId: docente.id, estado: 1 },
    include: [
      {
        model: Estudiante,
        as: 'estudiantes',
        where: { estado: 1 },
        required: false,
      },
    ],
  });

  return {
    docente: perfilCompleto,
    cursosDirigidos,
  };
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
        usuarioId: dto.usuarioId || null,
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
  await HorarioClase.destroy({ where: { asignacionId } });
  await asignacion.destroy();

  return obtenerDocentePorIdBL(docenteId);
};

// ============================================================================
// 5. GESTIÓN DE HORARIOS SEMANALES POR MATERIA ENSEÑADA
// ============================================================================

export const listarHorariosBL = async (filtros: {
  docenteId?: string;
  cursoId?: string;
  asignacionId?: string;
}) => {
  const whereClause: any = { estado: 1 };
  if (filtros.docenteId) {
    whereClause.docenteId = filtros.docenteId;
  }
  if (filtros.cursoId) {
    whereClause.cursoId = filtros.cursoId;
  }
  if (filtros.asignacionId) {
    whereClause.asignacionId = filtros.asignacionId;
  }

  return HorarioClase.findAll({
    where: whereClause,
    include: [
      {
        model: Curso,
        as: 'curso',
        attributes: ['id', 'codigo', 'nombre', 'grado', 'grupo', 'nivel', 'aula'],
      },
      {
        model: Materia,
        as: 'materia',
        attributes: ['id', 'codigo', 'nombre', 'area', 'intensidadHoraria'],
      },
      {
        model: Docente,
        as: 'docente',
        attributes: ['id', 'codigoDocente', 'nombres', 'apellidos', 'especialidad'],
      },
    ],
    order: [
      ['diaSemana', 'ASC'],
      ['horaInicio', 'ASC'],
    ],
  });
};

export const crearHorarioClaseBL = async (dto: CrearHorarioDTO) => {
  const asignacion = await DocenteCursoMateria.findByPk(dto.asignacionId, {
    include: [{ model: Curso, as: 'curso' }],
  });

  if (!asignacion) {
    throw new AppError('La asignación de materia y curso no existe', 404);
  }

  if (dto.horaInicio >= dto.horaFin) {
    throw new AppError('La hora de fin debe ser posterior a la hora de inicio', 422);
  }

  // Verificar que la docente no tenga otro bloque a la misma hora y día
  const conflictoDocente = await HorarioClase.findOne({
    where: {
      docenteId: asignacion.docenteId,
      diaSemana: dto.diaSemana,
      horaInicio: dto.horaInicio,
      estado: 1,
    },
  });

  if (conflictoDocente) {
    throw new AppError(
      `Ya tienes una clase programada el día ${dto.diaSemana} a las ${dto.horaInicio}`,
      409
    );
  }

  const nuevoHorario = await HorarioClase.create({
    asignacionId: asignacion.id,
    docenteId: asignacion.docenteId,
    cursoId: asignacion.cursoId,
    materiaId: asignacion.materiaId,
    diaSemana: dto.diaSemana,
    horaInicio: dto.horaInicio,
    horaFin: dto.horaFin,
    aula: dto.aula?.trim() || asignacion.curso?.aula || 'Salón Principal',
    estado: 1,
  });

  return HorarioClase.findByPk(nuevoHorario.id, {
    include: [
      { model: Curso, as: 'curso' },
      { model: Materia, as: 'materia' },
      { model: Docente, as: 'docente' },
    ],
  });
};

export const eliminarHorarioClaseBL = async (horarioId: string) => {
  const horario = await HorarioClase.findByPk(horarioId);
  if (!horario) {
    throw new AppError('El bloque de horario no existe', 404);
  }
  await horario.destroy();
  return { id: horarioId, mensaje: 'Bloque de horario eliminado correctamente' };
};

// ============================================================================
// 6. CALIFICACIONES Y PORTAL DE PADRES / ESTUDIANTES
// ============================================================================

export const listarCalificacionesPorCursoMateriaBL = async (
  cursoId: string,
  materiaId: string
) => {
  const anioActual = new Date().getFullYear();

  const estudiantes = await Estudiante.findAll({
    where: { cursoId, estado: 1, estadoMatricula: 'MATRICULADO' },
    order: [
      ['apellidos', 'ASC'],
      ['nombres', 'ASC'],
    ],
  });

  const calificaciones = await Calificacion.findAll({
    where: { cursoId, materiaId, anioLectivo: anioActual },
  });

  const mapaNotas = new Map<string, Calificacion>();
  for (const cal of calificaciones) {
    mapaNotas.set(cal.estudianteId, cal);
  }

  return estudiantes.map((est) => {
    const nota = mapaNotas.get(est.id);
    return {
      estudiante: est,
      calificacion: nota || {
        estudianteId: est.id,
        cursoId,
        materiaId,
        notaP1: null,
        notaP2: null,
        notaP3: null,
        notaP4: null,
        notaDefinitiva: null,
        observacion: '',
      },
    };
  });
};

export const guardarCalificacionBL = async (dto: GuardarCalificacionDTO) => {
  const anioActual = new Date().getFullYear();

  const notasValidas = [dto.notaP1, dto.notaP2, dto.notaP3, dto.notaP4]
    .filter((n) => n !== null && n !== undefined && !isNaN(Number(n)))
    .map((n) => Number(n));

  for (const n of notasValidas) {
    if (n < 1.0 || n > 5.0) {
      throw new AppError('Las calificaciones deben estar en la escala de 1.0 a 5.0', 422);
    }
  }

  const definitiva =
    notasValidas.length > 0
      ? Number(
          (
            notasValidas.reduce((acc, curr) => acc + curr, 0) /
            notasValidas.length
          ).toFixed(1)
        )
      : null;

  const [registro, creado] = await Calificacion.findOrCreate({
    where: {
      estudianteId: dto.estudianteId,
      materiaId: dto.materiaId,
      anioLectivo: anioActual,
    },
    defaults: {
      estudianteId: dto.estudianteId,
      cursoId: dto.cursoId,
      materiaId: dto.materiaId,
      docenteId: dto.docenteId || null,
      notaP1: dto.notaP1 ?? null,
      notaP2: dto.notaP2 ?? null,
      notaP3: dto.notaP3 ?? null,
      notaP4: dto.notaP4 ?? null,
      notaDefinitiva: definitiva,
      observacion: dto.observacion?.trim() || null,
      anioLectivo: anioActual,
    },
  });

  if (!creado) {
    await registro.update({
      cursoId: dto.cursoId,
      docenteId: dto.docenteId ?? registro.docenteId,
      notaP1: dto.notaP1 !== undefined ? dto.notaP1 : registro.notaP1,
      notaP2: dto.notaP2 !== undefined ? dto.notaP2 : registro.notaP2,
      notaP3: dto.notaP3 !== undefined ? dto.notaP3 : registro.notaP3,
      notaP4: dto.notaP4 !== undefined ? dto.notaP4 : registro.notaP4,
      notaDefinitiva: definitiva,
      observacion:
        dto.observacion !== undefined
          ? dto.observacion?.trim() || null
          : registro.observacion,
    });
  }

  return registro;
};

/**
 * Consulta exclusiva para el Portal Padre de Familia / Estudiante:
 * Retorna las Materias del grado, sus Notas por periodo y su Horario de Clases semanal.
 */
export const obtenerPortalEstudianteBL = async (
  userPayload: JwtUserPayload,
  estudianteIdQuery?: string
) => {
  let estudiante: Estudiante | null = null;

  if (estudianteIdQuery) {
    estudiante = await Estudiante.findByPk(estudianteIdQuery);
  }

  if (!estudiante) {
    const condiciones: any[] = [{ usuarioId: userPayload.user_id }];
    if (userPayload.email) {
      condiciones.push({
        acudienteEmail: { [Op.iLike]: userPayload.email.trim() },
      });
    }
    condiciones.push({
      nombres: { [Op.iLike]: `%${userPayload.nombre}%` },
    });

    estudiante = await Estudiante.findOne({
      where: {
        estado: 1,
        [Op.or]: condiciones,
      },
    });
  }

  // Si aún no hay un estudiante con ese correo, mostrar el primer estudiante activo
  if (!estudiante) {
    estudiante = await Estudiante.findOne({
      where: { estado: 1 },
      order: [['createdAt', 'DESC']],
    });
  }

  const todosEstudiantes = await Estudiante.findAll({
    where: { estado: 1 },
    include: [{ model: Curso, as: 'curso', attributes: ['id', 'nombre', 'codigo'] }],
    attributes: ['id', 'codigoMatricula', 'nombres', 'apellidos', 'documento', 'cursoId'],
    order: [['apellidos', 'ASC']],
  });

  if (!estudiante) {
    return {
      estudiante: null,
      curso: null,
      materiasYNotas: [],
      horarios: [],
      estudiantesDisponibles: todosEstudiantes,
    };
  }

  const curso = await Curso.findByPk(estudiante.cursoId, {
    include: [
      {
        model: Docente,
        as: 'directorGrupo',
        attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono', 'especialidad'],
      },
    ],
  });

  const asignacionesCurso = await DocenteCursoMateria.findAll({
    where: { cursoId: estudiante.cursoId, estado: 1 },
    include: [
      {
        model: Materia,
        as: 'materia',
      },
      {
        model: Docente,
        as: 'docente',
        attributes: ['id', 'nombres', 'apellidos', 'email', 'especialidad'],
      },
    ],
  });

  const calificacionesEstudiante = await Calificacion.findAll({
    where: { estudianteId: estudiante.id },
  });

  const mapaNotas = new Map<string, Calificacion>();
  for (const c of calificacionesEstudiante) {
    mapaNotas.set(c.materiaId, c);
  }

  const materiasYNotas = asignacionesCurso.map((asig) => {
    const cal = mapaNotas.get(asig.materiaId);
    return {
      asignacionId: asig.id,
      materia: asig.materia,
      docente: asig.docente,
      intensidadHoraria: asig.intensidadHoraria,
      notaP1: cal?.notaP1 ?? null,
      notaP2: cal?.notaP2 ?? null,
      notaP3: cal?.notaP3 ?? null,
      notaP4: cal?.notaP4 ?? null,
      notaDefinitiva: cal?.notaDefinitiva ?? null,
      observacion: cal?.observacion ?? null,
    };
  });

  const horarios = await listarHorariosBL({ cursoId: estudiante.cursoId });

  return {
    estudiante,
    curso,
    materiasYNotas,
    horarios,
    estudiantesDisponibles: todosEstudiantes,
  };
};
