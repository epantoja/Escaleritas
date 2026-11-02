import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  BelongsToManyGetAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  BelongsToManyAddAssociationsMixin,
} from 'sequelize';
import { sequelize } from '../config/database';
import { config } from '../config/config';
import { Permiso } from './permiso.model';

export enum RolCodigo {
  ADMIN = 'ADMIN',
  DOCENTE = 'DOCENTE',
  PADRE_ESTUDIANTE = 'PADRE_ESTUDIANTE',
  PADRE = 'PADRE',
  ESTUDIANTE = 'ESTUDIANTE',
}

export class Rol extends Model<
  InferAttributes<Rol, { omit: 'permisos' }>,
  InferCreationAttributes<Rol, { omit: 'permisos' }>
> {
  declare id: CreationOptional<string>;
  declare codigo: RolCodigo | string;
  declare nombre: string;
  declare descripcion: CreationOptional<string | null>;
  declare estado: CreationOptional<number>;

  // Asociaciones tipadas
  declare permisos?: NonAttribute<Permiso[]>;
  declare getPermisos: BelongsToManyGetAssociationsMixin<Permiso>;
  declare setPermisos: BelongsToManySetAssociationsMixin<Permiso, string>;
  declare addPermisos: BelongsToManyAddAssociationsMixin<Permiso, string>;
}

Rol.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: { msg: 'El campo id del rol es requerido' },
        isUUID: { args: 4, msg: 'El id del rol debe ser un UUID v4 válido' },
      },
    },
    codigo: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: {
        name: 'uq_rol_codigo',
        msg: 'El código del rol ya existe',
      },
      validate: {
        notNull: { msg: 'El código del rol es obligatorio' },
        notEmpty: { msg: 'El código del rol no puede estar vacío' },
        isIn: {
          args: [[
            RolCodigo.ADMIN,
            RolCodigo.DOCENTE,
            RolCodigo.PADRE_ESTUDIANTE,
            RolCodigo.PADRE,
            RolCodigo.ESTUDIANTE,
          ]],
          msg: 'El rol debe ser ADMIN, DOCENTE, PADRE_ESTUDIANTE, PADRE o ESTUDIANTE',
        },
      },
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: {
        notNull: { msg: 'El nombre del rol es obligatorio' },
        notEmpty: { msg: 'El nombre del rol no puede estar vacío' },
        len: {
          args: [3, 80],
          msg: 'El nombre del rol debe tener entre 3 y 80 caracteres',
        },
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
          msg: 'El estado del rol debe ser 0 (Inactivo) o 1 (Activo)',
        },
      },
    },
  },
  {
    schema: config.esquema,
    sequelize,
    modelName: 'rol',
    tableName: 'rol',
    freezeTableName: true,
    timestamps: true,
  }
);

export default Rol;
module.exports = Rol;
module.exports.Rol = Rol;
module.exports.RolCodigo = RolCodigo;
module.exports.default = Rol;

