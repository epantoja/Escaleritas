import { Sequelize } from 'sequelize';
import { config } from './config';

export const sequelize = new Sequelize(config.database, {
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  define: {
    schema: config.esquema,
    freezeTableName: true,
  },
  pool: {
    max: 10,       // máximo número de conexiones abiertas
    min: 0,        // mínimo de conexiones en el pool
    acquire: 30000,// tiempo máximo para intentar conseguir una conexión (ms)
    idle: 10000,   // tiempo máximo para cerrar una conexión inactiva (ms)
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('[DB] Conexión a PostgreSQL establecida correctamente.');
  } catch (error) {
    console.error('[DB] Error al conectar con la base de datos PostgreSQL:', error);
  }
};

export default sequelize;
module.exports = sequelize;
module.exports.sequelize = sequelize;
module.exports.connectDatabase = connectDatabase;
module.exports.default = sequelize;
