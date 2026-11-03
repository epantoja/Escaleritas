import { Op, Sequelize, Transaction } from 'sequelize';
import bcrypt from 'bcrypt';
import { config } from '../config/config';
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
  Rol,
  RolCodigo,
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
  codUsuario?: string;
  clave?: string;
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
  // Desactivar perfiles docentes autogenerados anteriormente desde el registro público (documento 'DOC-...')
  await Docente.update(
    { estado: 0 },
    {
      where: {
        estado: 1,
        documento: { [Op.like]: 'DOC-%' },
      },
    }
  );

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
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'codUsuario', 'email', 'estado'],
        required: false,
      },
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
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'codUsuario', 'email', 'estado'],
        required: false,
      },
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

const obtenerRolDocente = async (transaction?: Transaction): Promise<Rol> => {
  let rolDocente = await Rol.findOne({
    where: { codigo: RolCodigo.DOCENTE },
    transaction,
  });

  if (!rolDocente) {
    rolDocente = await Rol.create(
      {
        codigo: RolCodigo.DOCENTE,
        nombre: 'Docente',
        descripcion: 'Gestión académica, horario y calificaciones (Jardín a 5° Primaria)',
        estado: 1,
      },
      { transaction }
    );
  }

  return rolDocente;
};

const resolverCodUsuarioDocente = async (
  codUsuarioInput: string | undefined,
  email: string,
  documento: string,
  ignorarUsuarioId?: string | null,
  transaction?: Transaction
): Promise<string> => {
  const basePrefijo = (
    codUsuarioInput?.trim() ||
    email.split('@')[0] ||
    `doc.${documento.trim()}`
  )
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');

  const candidatoBase = basePrefijo.length >= 3 ? basePrefijo.slice(0, 26) : `doc.${documento.trim()}`;

  const existeCandidato = async (codigo: string) => {
    const whereCond: any = {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn('UPPER', Sequelize.col('codUsuario')),
          codigo.toUpperCase()
        ),
      ],
    };
    if (ignorarUsuarioId) {
      whereCond.id = { [Op.ne]: ignorarUsuarioId };
    }
    const encontrado = await Usuario.findOne({ where: whereCond, transaction });
    return Boolean(encontrado);
  };

  if (!(await existeCandidato(candidatoBase))) {
    return candidatoBase;
  }

  if (codUsuarioInput?.trim()) {
    throw new AppError(
      `El código de usuario "${codUsuarioInput.trim()}" ya está asignado a otra cuenta en la plataforma`,
      409
    );
  }

  const sufijoDoc = documento.trim().slice(-3) || Math.floor(10 + Math.random() * 89).toString();
  return `${candidatoBase}.${sufijoDoc}`;
};

/**
 * Obtiene el perfil Docente del usuario autenticado (creado por el Administrador)
 */
export const obtenerMiPerfilDocenteBL = async (userPayload: JwtUserPayload) => {
  const usuarioDb = await Usuario.findByPk(userPayload.user_id);

  const condicionesBusqueda: any[] = [{ usuarioId: userPayload.user_id }];
  if (userPayload.email) {
    condicionesBusqueda.push({ email: userPayload.email.trim().toLowerCase() });
  }
  if (usuarioDb?.email) {
    condicionesBusqueda.push({ email: usuarioDb.email.trim().toLowerCase() });
  }
  if (usuarioDb?.documento) {
    condicionesBusqueda.push({ documento: usuarioDb.documento.trim() });
  }

  const docente = await Docente.findOne({
    where: {
      estado: 1,
      [Op.or]: condicionesBusqueda,
    },
  });

  if (!docente) {
    throw new AppError(
      'Tu usuario no tiene un perfil activo en la Planta Docente. Solicita al Administrador tu registro desde el menú de Docentes.',
      403
    );
  }

  if (docente.usuarioId !== userPayload.user_id) {
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
  if (!dto.clave || dto.clave.trim().length < 6) {
    throw new AppError(
      'Debe asignar una contraseña de al menos 6 caracteres para que el docente ingrese a la plataforma',
      422
    );
  }

  const emailNormalizado = dto.email.trim().toLowerCase();
  const documentoNormalizado = dto.documento.trim();

  const existente = await Docente.findOne({
    where: {
      [Op.or]: [
        { documento: documentoNormalizado },
        { email: emailNormalizado },
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
    const rolDocente = await obtenerRolDocente(transaccion);
    const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
    const claveHash = await bcrypt.hash(dto.clave.trim(), salt);

    // Verificar si ya existe un usuario en public.usuario con el mismo correo o documento
    let usuarioDocente = await Usuario.findOne({
      where: {
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn('UPPER', Sequelize.col('email')),
            emailNormalizado.toUpperCase()
          ),
          { documento: documentoNormalizado },
        ],
      },
      transaction: transaccion,
    });

    const codUsuarioFinal = await resolverCodUsuarioDocente(
      dto.codUsuario,
      emailNormalizado,
      documentoNormalizado,
      usuarioDocente?.id,
      transaccion
    );

    if (usuarioDocente) {
      await usuarioDocente.update(
        {
          nombres: dto.nombres.trim(),
          apellidos: dto.apellidos.trim(),
          codUsuario: codUsuarioFinal,
          email: emailNormalizado,
          documento: documentoNormalizado,
          clave: claveHash,
          rolId: rolDocente.id,
          estado: 1,
        },
        { transaction: transaccion }
      );
    } else {
      usuarioDocente = await Usuario.create(
        {
          nombres: dto.nombres.trim(),
          apellidos: dto.apellidos.trim(),
          codUsuario: codUsuarioFinal,
          email: emailNormalizado,
          documento: documentoNormalizado,
          clave: claveHash,
          rolId: rolDocente.id,
          estado: 1,
        },
        { transaction: transaccion }
      );
    }

    const nuevoDocente = await Docente.create(
      {
        codigoDocente: codigoGenerado,
        nombres: dto.nombres.trim(),
        apellidos: dto.apellidos.trim(),
        tipoDocumento: dto.tipoDocumento || 'CC',
        documento: documentoNormalizado,
        email: emailNormalizado,
        telefono: dto.telefono?.trim() || null,
        especialidad: dto.especialidad.trim(),
        tituloAcademico: dto.tituloAcademico?.trim() || null,
        fechaIngreso: dto.fechaIngreso || new Date().toISOString().slice(0, 10),
        usuarioId: usuarioDocente.id,
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

  if (dto.clave !== undefined && dto.clave.trim() !== '' && dto.clave.trim().length < 6) {
    throw new AppError(
      'La nueva contraseña del docente debe tener al menos 6 caracteres',
      422
    );
  }

  const transaccion = await sequelize.transaction();
  try {
    const nombresFinal = dto.nombres?.trim() ?? docente.nombres;
    const apellidosFinal = dto.apellidos?.trim() ?? docente.apellidos;
    const documentoFinal = dto.documento?.trim() ?? docente.documento;
    const emailFinal = dto.email?.trim().toLowerCase() ?? docente.email;

    const rolDocente = await obtenerRolDocente(transaccion);

    let usuarioDocente: Usuario | null = null;
    if (docente.usuarioId) {
      usuarioDocente = await Usuario.findByPk(docente.usuarioId, {
        transaction: transaccion,
      });
    }

    if (!usuarioDocente) {
      usuarioDocente = await Usuario.findOne({
        where: {
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn('UPPER', Sequelize.col('email')),
              emailFinal.toUpperCase()
            ),
            { documento: documentoFinal },
          ],
        },
        transaction: transaccion,
      });
    }

    const codUsuarioFinal = await resolverCodUsuarioDocente(
      dto.codUsuario || usuarioDocente?.codUsuario,
      emailFinal,
      documentoFinal,
      usuarioDocente?.id,
      transaccion
    );

    if (usuarioDocente) {
      const camposActualizarUsuario: any = {
        nombres: nombresFinal,
        apellidos: apellidosFinal,
        codUsuario: codUsuarioFinal,
        email: emailFinal,
        documento: documentoFinal,
        rolId: rolDocente.id,
        estado: 1,
      };

      if (dto.clave && dto.clave.trim().length >= 6) {
        const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
        camposActualizarUsuario.clave = await bcrypt.hash(dto.clave.trim(), salt);
      }

      await usuarioDocente.update(camposActualizarUsuario, {
        transaction: transaccion,
      });
    } else {
      // El docente fue creado previamente sin cuenta en public.usuario: formalizar su cuenta ahora
      const claveInicial =
        dto.clave && dto.clave.trim().length >= 6
          ? dto.clave.trim()
          : documentoFinal;
      const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
      const claveHash = await bcrypt.hash(claveInicial, salt);

      usuarioDocente = await Usuario.create(
        {
          nombres: nombresFinal,
          apellidos: apellidosFinal,
          codUsuario: codUsuarioFinal,
          email: emailFinal,
          documento: documentoFinal,
          clave: claveHash,
          rolId: rolDocente.id,
          estado: 1,
        },
        { transaction: transaccion }
      );
    }

    await docente.update(
      {
        nombres: nombresFinal,
        apellidos: apellidosFinal,
        tipoDocumento: dto.tipoDocumento ?? docente.tipoDocumento,
        documento: documentoFinal,
        email: emailFinal,
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
        usuarioId: usuarioDocente.id,
      },
      { transaction: transaccion }
    );

    await transaccion.commit();
    return obtenerDocentePorIdBL(docente.id);
  } catch (error) {
    await transaccion.rollback();
    throw error;
  }
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
  if (docente.usuarioId) {
    await Usuario.update(
      { estado: 0 },
      { where: { id: docente.usuarioId } }
    );
  }
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

  const curso = asignacion.curso;
  const esPreescolar =
    curso?.nivel === 'PREESCOLAR' ||
    curso?.grado === 'TRANSICION' ||
    curso?.grado === 'JARDIN';

  // Reglas de jornada escolar según nivel (Transición/Preescolar vs Salones Superiores)
  if (esPreescolar) {
    // Transición / Jardín: 07:30 AM a 12:00 PM con descanso de 09:30 a 10:00 (30 min)
    if (dto.horaInicio < '07:30' || dto.horaFin > '12:00') {
      throw new AppError(
        `El horario para ${curso?.nombre || 'Transición/Preescolar'} es de 07:30 AM a 12:00 PM`,
        422
      );
    }
    if (dto.horaInicio < '10:00' && dto.horaFin > '09:30') {
      throw new AppError(
        'No se puede programar clase durante los 30 minutos de descanso de Preescolar (09:30 AM - 10:00 AM)',
        422
      );
    }
  } else {
    // Salones superiores (1° a 5° de Primaria): 07:00 AM a 01:00 PM (13:00) con descanso de 10:00 a 10:30 (30 min)
    if (dto.horaInicio < '07:00' || dto.horaFin > '13:00') {
      throw new AppError(
        `El horario para ${curso?.nombre || 'Primaria'} es de 07:00 AM a 01:00 PM`,
        422
      );
    }
    if (dto.horaInicio < '10:30' && dto.horaFin > '10:00') {
      throw new AppError(
        'No se puede programar clase durante los 30 minutos de descanso de Primaria (10:00 AM - 10:30 AM)',
        422
      );
    }
  }

  // Verificar que la docente no tenga cruce de horario el mismo día
  const horariosDocenteDia = await HorarioClase.findAll({
    where: {
      docenteId: asignacion.docenteId,
      diaSemana: dto.diaSemana,
      estado: 1,
    },
  });

  const cruceDocente = horariosDocenteDia.find(
    (h) => dto.horaInicio < h.horaFin && dto.horaFin > h.horaInicio
  );
  if (cruceDocente) {
    throw new AppError(
      `La docente ya tiene una clase programada el ${dto.diaSemana} de ${cruceDocente.horaInicio} a ${cruceDocente.horaFin}`,
      409
    );
  }

  // Verificar que el salón de clase no tenga otra materia a la misma hora el mismo día
  const horariosSalonDia = await HorarioClase.findAll({
    where: {
      cursoId: asignacion.cursoId,
      diaSemana: dto.diaSemana,
      estado: 1,
    },
  });

  const cruceSalon = horariosSalonDia.find(
    (h) => dto.horaInicio < h.horaFin && dto.horaFin > h.horaInicio
  );
  if (cruceSalon) {
    throw new AppError(
      `El salón ${curso?.nombre || ''} ya tiene una materia asignada el ${dto.diaSemana} de ${cruceSalon.horaInicio} a ${cruceSalon.horaFin}`,
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
