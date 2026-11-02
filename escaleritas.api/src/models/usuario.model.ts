import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
  BelongsToGetAssociationMixin,
} from 'sequelize';
import bcrypt from 'bcrypt';
import { sequelize } from '../config/database';
import { config } from '../config/config';
import { Rol } from './rol.model';

export class Usuario extends Model<
  InferAttributes<Usuario, { omit: 'rol' }>,
  InferCreationAttributes<Usuario, { omit: 'rol' }>
> {
  declare id: CreationOptional<string>;
  declare nombres: string;
  declare apellidos: CreationOptional<string | null>;
  declare codUsuario: string;
  declare email: CreationOptional<string | null>;
  declare documento: CreationOptional<string | null>;
  declare clave: string;
  declare rolId: ForeignKey<Rol['id']>;
  declare estado: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociación tipada con Rol
  declare rol?: NonAttribute<Rol>;
  declare getRol: BelongsToGetAssociationMixin<Rol>;

  /**
   * Compara una contraseña en texto plano con el hash bcrypt almacenado.
   */
  public async compararClave(clavePlana: string): Promise<boolean> {
    if (this.clave.startsWith('$2a$') || this.clave.startsWith('$2b$')) {
      return bcrypt.compare(clavePlana, this.clave);
    }
    // Soporte de retrocompatibilidad para usuarios previos en base64
    return Buffer.from(clavePlana).toString('base64') === this.clave;
  }

  /**
   * Oculta el hash de la contraseña al serializar el modelo a JSON.
   */
  public override toJSON(): Record<string, unknown> {
    const values = { ...this.get() } as Record<string, unknown>;
    delete values.clave;
    return values;
  }
}

const hashPasswordIfNeeded = async (usuario: Usuario): Promise<void> => {
  if (usuario.changed('clave') && usuario.clave) {
    const isAlreadyHashed =
      usuario.clave.startsWith('$2a$') || usuario.clave.startsWith('$2b$');
    if (!isAlreadyHashed) {
      const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
      usuario.clave = await bcrypt.hash(usuario.clave, salt);
    }
  }
};

Usuario.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El campo id es requerido',
        },
        isUUID: {
          args: 4,
          msg: 'El campo id no es de tipo UUID',
        },
      },
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El campo nombres es requerido',
        },
        notEmpty: {
          msg: 'El campo nombres no puede estar vacío',
        },
        len: {
          args: [2, 100],
          msg: 'El nombre debe tener entre 2 y 100 caracteres',
        },
      },
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [2, 100],
          msg: 'El apellido debe tener entre 2 y 100 caracteres',
        },
      },
    },
    codUsuario: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: {
        name: 'uq_usuario_cod_usuario',
        msg: 'El código de usuario ya se encuentra en uso',
      },
      validate: {
        notNull: {
          msg: 'El campo código de usuario es requerido',
        },
        notEmpty: {
          msg: 'El código de usuario no puede estar vacío',
        },
        len: {
          args: [3, 30],
          msg: 'El código de usuario debe tener entre 3 y 30 caracteres',
        },
      },
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: true,
      unique: {
        name: 'uq_usuario_email',
        msg: 'El correo electrónico ya está registrado',
      },
      validate: {
        isEmail: {
          msg: 'El formato del correo electrónico no es válido',
        },
      },
    },
    documento: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    clave: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'El campo clave es requerido',
        },
        notEmpty: {
          msg: 'El campo clave no puede estar vacío',
        },
      },
    },
    rolId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'rol_id',
      validate: {
        notNull: {
          msg: 'El rol del usuario es obligatorio',
        },
        isUUID: {
          args: 4,
          msg: 'El identificador de rol debe ser un UUID válido',
        },
      },
    },
    estado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        notNull: {
          msg: 'El campo estado es requerido',
        },
        isIn: {
          args: [[0, 1]],
          msg: 'El estado del usuario debe ser 0 (Inactivo) o 1 (Activo)',
        },
      },
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
    modelName: 'usuario',
    tableName: 'usuario',
    freezeTableName: true,
    timestamps: true,
    hooks: {
      beforeCreate: hashPasswordIfNeeded,
      beforeUpdate: hashPasswordIfNeeded,
    },
  }
);

export default Usuario;
module.exports = Usuario;
module.exports.Usuario = Usuario;
module.exports.default = Usuario;
