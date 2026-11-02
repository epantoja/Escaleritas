import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { RolCodigo } from '../models/rol.model';

export interface JwtUserPayload {
  user_id: string;
  usuario: string;
  email?: string | null;
  nombre: string;
  apellido?: string | null;
  rol: RolCodigo | string;
  rolNombre?: string;
  permisos: string[];
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
  userid?: string;
  codusuario?: string;
}

/**
 * Middleware para verificar la validez del token JWT en el header Authorization (Bearer <token>)
 */
export const verificaToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      ok: false,
      status: 'error',
      error: 'No se proporcionó un token de autenticación válido (Bearer)',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.SEED) as JwtUserPayload;
    req.user = decoded;
    req.userid = decoded.user_id;
    req.codusuario = decoded.usuario;
    next();
  } catch (err) {
    res.status(401).json({
      ok: false,
      status: 'error',
      error: 'Token inválido o expirado',
    });
  }
};

/**
 * Middleware para restringir el acceso a rutas según el Rol del usuario (Admin, Docente, Padre/Estudiante)
 */
export const autorizarRoles = (...rolesPermitidos: (RolCodigo | string)[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        ok: false,
        status: 'error',
        error: 'Usuario no autenticado',
      });
      return;
    }

    const tieneRol = rolesPermitidos.includes(req.user.rol);
    if (!tieneRol) {
      res.status(403).json({
        ok: false,
        status: 'error',
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para restringir el acceso a rutas según Permisos granulares del usuario
 */
export const autorizarPermisos = (...permisosRequeridos: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        ok: false,
        status: 'error',
        error: 'Usuario no autenticado',
      });
      return;
    }

    const permisosUsuario = req.user.permisos || [];
    const poseeTodos = permisosRequeridos.every((p) =>
      permisosUsuario.includes(p)
    );

    if (!poseeTodos) {
      res.status(403).json({
        ok: false,
        status: 'error',
        error: `Acceso insuficiente. Permisos requeridos: ${permisosRequeridos.join(', ')}`,
      });
      return;
    }

    next();
  };
};

module.exports = {
  verificaToken,
  autorizarRoles,
  autorizarPermisos,
};
