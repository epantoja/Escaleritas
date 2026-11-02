import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: string;
  SEED: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
  esquema: string;
  direccion: string;
  empresa: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 9010,
  nodeEnv: process.env.NODE_ENV || 'development',
  database:
    process.env.DB_URI ||
    'postgres://postgres:erwin860214@localhost:5432/Escalerita_dev',
  SEED: process.env.JWT_SECRET || 'bac@tApp2023',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '20h',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  esquema: process.env.DB_SCHEMA || 'public',
  direccion: process.env.EMPRESA_DIRECCION || 'Cll 47A #34D - 04',
  empresa: process.env.EMPRESA_NOMBRE || 'COLEGIO ESCALERITAS ERP',
};

export default config;
module.exports = config;
module.exports.config = config;
module.exports.default = config;
