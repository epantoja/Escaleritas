import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/database';
import { config } from '../config/config';
import { Curso } from './curso.model';

export class ConfiguracionSalon extends Model<
  InferAttributes<ConfiguracionSalon>,
  InferCreationAttributes<ConfiguracionSalon>
> {
  declare id: CreationOptional<string>;
  declare cursoId: ForeignKey<Curso['id']>;
  declare horaEntrada: string;
  declare horaSalida: string;
  declare horaInicioDescanso: string;
  declare horaFinDescanso: string;
  declare tipoCalificacion: 'CARITAS' | 'NUMERICA' | string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ConfiguracionSalon.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    cursoId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'curso_id',
      references: {
        model: 'curso',
        key: 'id',
      },
    },
    horaEntrada: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '07:00',
      field: 'hora_entrada',
    },
    horaSalida: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '13:00',
      field: 'hora_salida',
    },
    horaInicioDescanso: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '10:00',
      field: 'hora_inicio_descanso',
    },
    horaFinDescanso: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '10:30',
      field: 'hora_fin_descanso',
    },
    tipoCalificacion: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'NUMERICA',
      field: 'tipo_calificacion',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    schema: config.esquema,
    sequelize,
    modelName: 'configuracion_salon',
    tableName: 'configuracion_salon',
    freezeTableName: true,
    timestamps: true,
  }
);

export default ConfiguracionSalon;

