import { loginUsuarioBL } from './auth.BL';

export const postLoginBL = async ({
  usuario,
  clave,
}: {
  usuario: string;
  clave: string;
}): Promise<any> => {
  return loginUsuarioBL({ usuario, clave });
};
