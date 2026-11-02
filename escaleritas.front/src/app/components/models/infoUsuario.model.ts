import { RolCodigo } from '../../pages/models/login.model';

export interface InfoUsuarioModel {
  user_id: string;
  usuario: string;
  email?: string;
  nombre: string;
  apellido: string;
  rol: RolCodigo | string;
  rolNombre?: string;
  permisos: string[];
  iat?: number;
  exp?: number;
}
