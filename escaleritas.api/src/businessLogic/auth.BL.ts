import { Op, Sequelize } from 'sequelize';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config/config';
import { Usuario, Rol, RolCodigo, Permiso } from '../models';
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
    ],
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return usuario.toJSON();
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

