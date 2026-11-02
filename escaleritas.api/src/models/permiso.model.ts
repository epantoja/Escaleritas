import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import { config } from '../config/config';

export class Permiso extends Model<
  InferAttributes<Permiso>,
  InferCreationAttributes<Permiso>
> {
  declare id: CreationOptional<string>;
  declare codigo: string;
  declare nombre: string;
  declare modulo: string;
  declare descripcion: CreationOptional<string | null>;
  declare estado: CreationOptional<number>;
}

Permiso.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: { msg: 'El campo id del permiso es requerido' },
        isUUID: { args: 4, msg: 'El id del permiso debe ser un UUID v4 válido' },
      },
    },
    codigo: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: {
        name: 'uq_permiso_codigo',
        msg: 'El código del permiso ya se encuentra registrado',
      },
      validate: {
        notNull: { msg: 'El código del permiso es obligatorio' },
        notEmpty: { msg: 'El código del permiso no puede estar vacío' },
        len: {
          args: [3, 60],
          msg: 'El código del permiso debe tener entre 3 y 60 caracteres',
        },
      },
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'El nombre del permiso es obligatorio' },
        notEmpty: { msg: 'El nombre del permiso no puede estar vacío' },
        len: {
          args: [3, 100],
          msg: 'El nombre del permiso debe tener entre 3 y 100 caracteres',
        },
      },
    },
    modulo: {
      type: DataTypes.STRING(60),
      allowNull: false,
      validate: {
        notNull: { msg: 'El módulo del permiso es obligatorio' },
        notEmpty: { msg: 'El módulo del permiso no puede estar vacío' },
      },
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    estado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isIn: {
          args: [[0, 1]],
          msg: 'El estado del permiso debe ser 0 (Inactivo) o 1 (Activo)',
        },
      },
    },
  },
  {
    schema: config.esquema,
    sequelize,
    modelName: 'permiso',
    tableName: 'permiso',
    freezeTableName: true,
    timestamps: true,
  }
);

export default Permiso;
module.exports = Permiso;
module.exports.Permiso = Permiso;
module.exports.default = Permiso;

