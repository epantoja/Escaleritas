import { loginUsuarioBL } from '../businessLogic/auth.BL';

export const postLogin = async ({
  usuario,
  clave,
}: {
  usuario: string;
  clave: string;
}) => {
  return loginUsuarioBL({ usuario, clave });
};
