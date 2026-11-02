import { Request, Response, NextFunction } from 'express';
import {
  loginUsuarioBL,
  registrarUsuarioBL,
  obtenerPerfilUsuarioBL,
  listarRolesActivosBL,
} from '../businessLogic/auth.BL';
import { AuthenticatedRequest } from '../middlewares/autenticacion';

/**
 * POST /api/auth/login
 * Autentica un usuario del ERP y retorna su JWT junto con su rol y permisos.
 */
export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { usuario, clave } = req.body;
    const resultado = await loginUsuarioBL({ usuario, clave });
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 * Registra un nuevo usuario con contraseña encriptada con bcrypt y rol asignado.
 */
export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      nombres,
      apellidos,
      codUsuario,
      email,
      documento,
      clave,
      rolCodigo,
      rolId,
    } = req.body;

    const resultado = await registrarUsuarioBL({
      nombres,
      apellidos,
      codUsuario,
      email,
      documento,
      clave,
      rolCodigo,
      rolId,
    });

    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Retorna el perfil del usuario autenticado a partir del JWT.
 */
export const meController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.user_id || req.userid;
    const perfil = await obtenerPerfilUsuarioBL(userId as string);
    res.status(200).json({
      ok: true,
      usuario: perfil,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/roles
 * Retorna el catálogo de roles activos y sus permisos.
 */
export const rolesController = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roles = await listarRolesActivosBL();
    res.status(200).json({
      ok: true,
      roles,
    });
  } catch (error) {
    next(error);
  }
};

