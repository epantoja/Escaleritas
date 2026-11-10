import { Op, Sequelize } from 'sequelize';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config/config';
import { Usuario, Rol, RolCodigo, Permiso, Docente } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { JwtUserPayload } from '../middlewares/autenticacion';

export interface LoginRequestDTO {
  usuario: string;
  clave: string;
}

export interface RegisterRequestDTO {
  nombres: string;
  apellidos?: string;
  codUsuario: string;
  email?: string;
  documento?: string;
  clave: string;
  rolCodigo?: RolCodigo | string;
  rolId?: string;
}

export interface ActualizarPerfilDTO {
  nombres?: string;
  apellidos?: string | null;
  codUsuario?: string;
  email?: string | null;
  documento?: string | null;
  telefono?: string | null;
  tituloAcademico?: string | null;
  claveActual?: string;
  nuevaClave?: string;
  confirmarClave?: string;
}

export interface AuthResponseDTO {
  ok: boolean;
  mensaje: string;
  token: string;
  usuario: {
    id: string;
    codUsuario: string;
    nombres: string;
    apellidos: string | null;
    email: string | null;
    documento: string | null;
    estado: number;
    rol: {
      id: string;
      codigo: string;
      nombre: string;
    };
    permisos: string[];
  };
}

const construirRespuestaAuth = (
  usuario: Usuario,
  mensaje: string
): AuthResponseDTO => {
  const rol = usuario.rol;
  const codigoRol = rol?.codigo || RolCodigo.PADRE_ESTUDIANTE;
  const nombreRol = rol?.nombre || 'Padre/Estudiante';
  const codigosPermisos = (rol?.permisos || []).map((p) => p.codigo);

  const payload: JwtUserPayload = {
    user_id: usuario.id,
    usuario: usuario.codUsuario,
    email: usuario.email,
    nombre: usuario.nombres,
    apellido: usuario.apellidos,
    rol: codigoRol,
    rolNombre: nombreRol,
    permisos: codigosPermisos,
  };

  const signOptions: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };

  const token = jwt.sign(payload, config.SEED, signOptions);

  return {
    ok: true,
    mensaje,
    token,
    usuario: {
      id: usuario.id,
      codUsuario: usuario.codUsuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos ?? null,
      email: usuario.email ?? null,
      documento: usuario.documento ?? null,
      estado: usuario.estado,
      rol: {
        id: rol?.id || usuario.rolId,
        codigo: codigoRol,
        nombre: nombreRol,
      },
      permisos: codigosPermisos,
    },
  };
};

/**
 * Servicio de Autenticación (Login) con verificación Bcrypt y generación de JWT con Rol y Permisos
 */
export const loginUsuarioBL = async (
  dto: LoginRequestDTO
): Promise<AuthResponseDTO> => {
  const identificador = dto.usuario?.trim();
  const clave = dto.clave;

  if (!identificador || !clave) {
    throw new AppError(
      'Debe proporcionar el usuario (o correo) y la contraseña',
      400
    );
  }

  const usuario = await Usuario.findOne({
    where: {
      [Op.or]: [
        Sequelize.where(
          Sequelize.fn('UPPER', Sequelize.col('usuario.codUsuario')),
          identificador.toUpperCase()
        ),
        Sequelize.where(
          Sequelize.fn('UPPER', Sequelize.col('usuario.email')),
          identificador.toUpperCase()
        ),
        Sequelize.where(
          Sequelize.fn('UPPER', Sequelize.col('usuario.documento')),
          identificador.toUpperCase()
        ),
      ],
    },
    include: [
      {
        model: Rol,
        as: 'rol',
        include: [
          {
            model: Permiso,
            as: 'permisos',
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  if (!usuario) {
    throw new AppError(
      'El usuario no existe o las credenciales no son válidas',
      401
    );
  }

  if (usuario.estado !== 1) {
    throw new AppError(
      'La cuenta de usuario se encuentra inactiva. Contacte al administrador del colegio',
      403
    );
  }

  const claveValida = await usuario.compararClave(clave);
  if (!claveValida) {
    throw new AppError(
      'El usuario no existe o las credenciales no son válidas',
      401
    );
  }

  // Si el usuario tiene rol DOCENTE, verificar que corresponda a un Docente activo creado por el Administrador
  if (usuario.rol?.codigo === RolCodigo.DOCENTE) {
    const condicionesDocente: any[] = [{ usuarioId: usuario.id }];
    if (usuario.email) {
      condicionesDocente.push({ email: usuario.email.trim().toLowerCase() });
    }
    if (usuario.documento) {
      condicionesDocente.push({ documento: usuario.documento.trim() });
    }

    const perfilDocente = await Docente.findOne({
      where: {
        estado: 1,
        [Op.or]: condicionesDocente,
      },
    });

    if (!perfilDocente) {
      throw new AppError(
        'Esta cuenta no corresponde a un docente activo registrado por el Administrador en el menú de Docentes',
        403
      );
    }

    if (perfilDocente.usuarioId !== usuario.id) {
      await perfilDocente.update({ usuarioId: usuario.id });
    }
  }

  return construirRespuestaAuth(usuario, 'Inicio de sesión exitoso');
};

/**
 * Servicio de Registro de Usuario con encriptación Bcrypt y asignación de Rol
 */
export const registrarUsuarioBL = async (
  dto: RegisterRequestDTO
): Promise<AuthResponseDTO> => {
  const {
    nombres,
    apellidos,
    codUsuario,
    email,
    documento,
    clave,
    rolCodigo,
    rolId,
  } = dto;

  if (!nombres || !codUsuario || !clave) {
    throw new AppError(
      'Los campos nombres, código de usuario y clave son obligatorios',
      400
    );
  }

  if (clave.length < 6) {
    throw new AppError(
      'La contraseña debe tener al menos 6 caracteres por seguridad',
      422
    );
  }

  // Bloquear el registro inicial público con rol DOCENTE:
  // Los docentes solo pueden ser creados por el Administrador desde el menú de Docentes
  if ((rolCodigo || '').trim().toUpperCase() === RolCodigo.DOCENTE) {
    throw new AppError(
      'El registro de usuarios con rol Docente debe realizarse exclusivamente desde el rol Administrador en el módulo de Docentes',
      403
    );
  }

  // Verificar si el código de usuario o email ya existen
  const condicionesBusqueda: any[] = [
    Sequelize.where(
      Sequelize.fn('UPPER', Sequelize.col('codUsuario')),
      codUsuario.trim().toUpperCase()
    ),
  ];

  if (email?.trim()) {
    condicionesBusqueda.push(
      Sequelize.where(
        Sequelize.fn('UPPER', Sequelize.col('email')),
        email.trim().toUpperCase()
      )
    );
  }

  const usuarioExistente = await Usuario.findOne({
    where: {
      [Op.or]: condicionesBusqueda,
    },
  });

  if (usuarioExistente) {
    throw new AppError(
      'El código de usuario o correo electrónico ya se encuentra registrado',
      409
    );
  }

  // Resolver Rol asignado (por rolId o rolCodigo, por defecto PADRE_ESTUDIANTE)
  let rolAsignado: Rol | null = null;
  if (rolId) {
    rolAsignado = await Rol.findByPk(rolId);
  } else {
    const codigoBuscado = (rolCodigo || RolCodigo.PADRE_ESTUDIANTE).toUpperCase();
    rolAsignado = await Rol.findOne({ where: { codigo: codigoBuscado } });

    if (!rolAsignado) {
      const nombresPorDefecto: Record<string, string> = {
        [RolCodigo.ADMIN]: 'Administrador',
        [RolCodigo.DOCENTE]: 'Docente',
        [RolCodigo.PADRE_ESTUDIANTE]: 'Padre/Estudiante',
        [RolCodigo.PADRE]: 'Padre de Familia',
        [RolCodigo.ESTUDIANTE]: 'Estudiante',
      };

      rolAsignado = await Rol.create({
        codigo: codigoBuscado,
        nombre: nombresPorDefecto[codigoBuscado] || codigoBuscado,
        descripcion: `Rol ${codigoBuscado} del ERP Educativo`,
        estado: 1,
      });
    }
  }

  if (!rolAsignado) {
    throw new AppError('El rol especificado no existe en el sistema', 404);
  }

  // Encriptar contraseña con Bcrypt
  const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
  const claveHash = await bcrypt.hash(clave, salt);

  const nuevoUsuario = await Usuario.create({
    nombres: nombres.trim(),
    apellidos: apellidos?.trim() || null,
    codUsuario: codUsuario.trim(),
    email: email?.trim().toLowerCase() || null,
    documento: documento?.trim() || null,
    clave: claveHash,
    rolId: rolAsignado.id,
    estado: 1,
  });

  // Recargar con relaciones de Rol y Permisos
  const usuarioCompleto = await Usuario.findByPk(nuevoUsuario.id, {
    include: [
      {
        model: Rol,
        as: 'rol',
        include: [
          {
            model: Permiso,
            as: 'permisos',
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  return construirRespuestaAuth(
    usuarioCompleto || nuevoUsuario,
    'Usuario registrado exitosamente'
  );
};

/**
 * Obtiene el perfil del usuario autenticado junto con su rol y permisos vigentes
 */
export const obtenerPerfilUsuarioBL = async (userId: string) => {
  const usuario = await Usuario.findByPk(userId, {
    include: [
      {
        model: Rol,
        as: 'rol',
        include: [
          {
            model: Permiso,
            as: 'permisos',
            through: { attributes: [] },
          },
        ],
      },
      {
        model: Docente,
        as: 'perfilDocente',
        required: false,
      },
    ],
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return usuario.toJSON();
};

/**
 * Permite al usuario autenticado editar los datos de su perfil y/o cambiar su contraseña
 */
export const actualizarMiPerfilBL = async (
  userId: string,
  dto: ActualizarPerfilDTO
): Promise<AuthResponseDTO> => {
  const usuario = await Usuario.findByPk(userId, {
    include: [
      {
        model: Rol,
        as: 'rol',
        include: [
          {
            model: Permiso,
            as: 'permisos',
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const camposActualizar: any = {};

  if (dto.nombres !== undefined) {
    if (!dto.nombres.trim()) {
      throw new AppError('El nombre no puede estar vacío', 400);
    }
    camposActualizar.nombres = dto.nombres.trim();
  }

  if (dto.apellidos !== undefined) {
    camposActualizar.apellidos = dto.apellidos?.trim() || null;
  }

  if (dto.codUsuario !== undefined) {
    const nuevoCod = dto.codUsuario.trim();
    if (nuevoCod.length < 3) {
      throw new AppError('El código de usuario debe tener al menos 3 caracteres', 422);
    }
    const duplicadoCod = await Usuario.findOne({
      where: {
        id: { [Op.ne]: usuario.id },
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('UPPER', Sequelize.col('codUsuario')),
            nuevoCod.toUpperCase()
          ),
        ],
      },
    });
    if (duplicadoCod) {
      throw new AppError(
        `El código de usuario "${nuevoCod}" ya está siendo utilizado por otra cuenta`,
        409
      );
    }
    camposActualizar.codUsuario = nuevoCod;
  }

  if (dto.email !== undefined) {
    const nuevoEmail = dto.email?.trim().toLowerCase() || null;
    if (nuevoEmail) {
      const duplicadoEmail = await Usuario.findOne({
        where: {
          id: { [Op.ne]: usuario.id },
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn('UPPER', Sequelize.col('email')),
              nuevoEmail.toUpperCase()
            ),
          ],
        },
      });
      if (duplicadoEmail) {
        throw new AppError(
          `El correo electrónico "${nuevoEmail}" ya está registrado en otra cuenta`,
          409
        );
      }
    }
    camposActualizar.email = nuevoEmail;
  }

  if (dto.documento !== undefined) {
    const nuevoDoc = dto.documento?.trim() || null;
    if (nuevoDoc) {
      const duplicadoDoc = await Usuario.findOne({
        where: {
          id: { [Op.ne]: usuario.id },
          documento: nuevoDoc,
        },
      });
      if (duplicadoDoc) {
        throw new AppError(
          `El documento "${nuevoDoc}" ya está registrado en otra cuenta`,
          409
        );
      }
    }
    camposActualizar.documento = nuevoDoc;
  }

  // Cambio de contraseña si el usuario envía nuevaClave
  if (dto.nuevaClave && dto.nuevaClave.trim() !== '') {
    if (!dto.claveActual || !dto.claveActual.trim()) {
      throw new AppError(
        'Debes ingresar tu contraseña actual para poder cambiarla',
        400
      );
    }

    const claveActualValida = await usuario.compararClave(dto.claveActual);
    if (!claveActualValida) {
      throw new AppError('La contraseña actual ingresada no es correcta', 401);
    }

    if (dto.nuevaClave.trim().length < 6) {
      throw new AppError(
        'La nueva contraseña debe tener al menos 6 caracteres',
        422
      );
    }

    if (
      dto.confirmarClave !== undefined &&
      dto.nuevaClave.trim() !== dto.confirmarClave.trim()
    ) {
      throw new AppError(
        'La confirmación de la nueva contraseña no coincide',
        422
      );
    }

    const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
    camposActualizar.clave = await bcrypt.hash(dto.nuevaClave.trim(), salt);
  }

  await usuario.update(camposActualizar);

  // Si el usuario tiene perfil en public.docente, mantener sincronizados sus datos básicos
  const docenteVinculado = await Docente.findOne({
    where: { usuarioId: usuario.id },
  });
  if (docenteVinculado) {
    await docenteVinculado.update({
      nombres: camposActualizar.nombres ?? docenteVinculado.nombres,
      apellidos:
        camposActualizar.apellidos !== undefined
          ? camposActualizar.apellidos || docenteVinculado.apellidos
          : docenteVinculado.apellidos,
      email: camposActualizar.email ?? docenteVinculado.email,
      documento: camposActualizar.documento ?? docenteVinculado.documento,
      telefono:
        dto.telefono !== undefined
          ? dto.telefono?.trim() || null
          : docenteVinculado.telefono,
      tituloAcademico:
        dto.tituloAcademico !== undefined
          ? dto.tituloAcademico?.trim() || null
          : docenteVinculado.tituloAcademico,
    });
  }

  const usuarioActualizado = await Usuario.findByPk(usuario.id, {
    include: [
      {
        model: Rol,
        as: 'rol',
        include: [
          {
            model: Permiso,
            as: 'permisos',
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  const mensajeRespuesta =
    dto.nuevaClave && dto.nuevaClave.trim() !== ''
      ? 'Contraseña y perfil actualizados correctamente'
      : 'Datos de tu perfil actualizados correctamente';

  return construirRespuestaAuth(
    usuarioActualizado || usuario,
    mensajeRespuesta
  );
};

/**
 * Lista los roles activos del sistema (para formularios de administración/registro)
 */
export const listarRolesActivosBL = async () => {
  return Rol.findAll({
    where: { estado: 1 },
    include: [
      {
        model: Permiso,
        as: 'permisos',
        through: { attributes: [] },
      },
    ],
    order: [['nombre', 'ASC']],
  });
};

