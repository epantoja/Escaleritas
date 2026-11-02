export type RolCodigo =
  | 'ADMIN'
  | 'DOCENTE'
  | 'PADRE_ESTUDIANTE'
  | 'PADRE'
  | 'ESTUDIANTE';

export interface LoginModel {
  usuario: string;
  clave: string;
}

export interface RegisterModel {
  nombres: string;
  apellidos?: string;
  codUsuario: string;
  email?: string;
  documento?: string;
  clave: string;
  rolCodigo: RolCodigo;
}

export interface RolModel {
  id: string;
  codigo: RolCodigo | string;
  nombre: string;
  descripcion?: string;
}

export interface UsuarioAuthModel {
  id: string;
  codUsuario: string;
  nombres: string;
  apellidos: string | null;
  email: string | null;
  documento: string | null;
  estado: number;
  rol: RolModel;
  permisos: string[];
}

export interface AuthResponseModel {
  ok: boolean;
  mensaje: string;
  token: string;
  usuario: UsuarioAuthModel;
}
