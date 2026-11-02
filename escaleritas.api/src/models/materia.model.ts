import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import { config } from '../config/config';

export class Materia extends Model<
  InferAttributes<Materia>,
  InferCreationAttributes<Materia>
> {
  declare id: CreationOptional<string>;
  declare codigo: string;
  declare nombre: string;
  declare area: CreationOptional<string | null>;
  declare intensidadHoraria: CreationOptional<number>;
  declare descripcion: CreationOptional<string | null>;
  declare estado: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Materia.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: {
        name: 'uq_materia_codigo',
        msg: 'El código de la materia ya existe',
      },
      validate: {
        notNull: { msg: 'El código de la materia es obligatorio' },
        notEmpty: { msg: 'El código de la materia no puede estar vacío' },
      },
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'El nombre de la materia es obligatorio' },
        notEmpty: { msg: 'El nombre de la materia no puede estar vacío' },
      },
    },
    area: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    intensidadHoraria: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
      field: 'intensidad_horaria',
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    estado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    modelName: 'materia',
    tableName: 'materia',
    freezeTableName: true,
    timestamps: true,
  }
);

export default Materia;

