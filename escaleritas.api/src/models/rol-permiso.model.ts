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
import { Rol } from './rol.model';
import { Permiso } from './permiso.model';

export class RolPermiso extends Model<
  InferAttributes<RolPermiso>,
  InferCreationAttributes<RolPermiso>
> {
  declare id: CreationOptional<string>;
  declare rolId: ForeignKey<Rol['id']>;
  declare permisoId: ForeignKey<Permiso['id']>;
}

RolPermiso.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    rolId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'rol_id',
      references: {
        model: 'rol',
        key: 'id',
      },
    },
    permisoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'permiso_id',
      references: {
        model: 'permiso',
        key: 'id',
      },
    },
  },
  {
    schema: config.esquema,
    sequelize,
    modelName: 'rol_permiso',
    tableName: 'rol_permiso',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['rol_id', 'permiso_id'],
        name: 'uq_rol_permiso',
      },
    ],
  }
);

export default RolPermiso;
module.exports = RolPermiso;
module.exports.RolPermiso = RolPermiso;
module.exports.default = RolPermiso;

