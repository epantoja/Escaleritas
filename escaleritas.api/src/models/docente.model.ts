import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';
import { config } from '../config/config';
import { Usuario } from './usuario.model';

export class Docente extends Model<
  InferAttributes<Docente, { omit: 'usuario' | 'asignaciones' | 'cursosAsignados' }>,
  InferCreationAttributes<Docente, { omit: 'usuario' | 'asignaciones' | 'cursosAsignados' }>
> {
  declare id: CreationOptional<string>;
  declare codigoDocente: string;
  declare nombres: string;
  declare apellidos: string;
  declare tipoDocumento: CreationOptional<string>;
  declare documento: string;
  declare email: string;
  declare telefono: CreationOptional<string | null>;
  declare especialidad: string;
  declare tituloAcademico: CreationOptional<string | null>;
  declare fechaIngreso: CreationOptional<string | null>;
  declare usuarioId: ForeignKey<Usuario['id'] | null>;
  declare estado: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones tipadas
  declare usuario?: NonAttribute<Usuario>;
  declare asignaciones?: NonAttribute<any[]>;
  declare cursosAsignados?: NonAttribute<any[]>;
}

Docente.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    codigoDocente: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'codigo_docente',
      unique: {
        name: 'uq_docente_codigo',
        msg: 'El código del docente ya está registrado',
      },
      validate: {
        notNull: { msg: 'El código del docente es obligatorio' },
        notEmpty: { msg: 'El código del docente no puede estar vacío' },
      },
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Los nombres del docente son obligatorios' },
        notEmpty: { msg: 'Los nombres del docente no pueden estar vacíos' },
        len: { args: [2, 100], msg: 'Los nombres deben tener entre 2 y 100 caracteres' },
      },
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Los apellidos del docente son obligatorios' },
        notEmpty: { msg: 'Los apellidos del docente no pueden estar vacíos' },
        len: { args: [2, 100], msg: 'Los apellidos deben tener entre 2 y 100 caracteres' },
      },
    },
    tipoDocumento: {
      type: DataTypes.STRING(15),
      allowNull: false,
      defaultValue: 'CC',
      field: 'tipo_documento',
    },
    documento: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: {
        name: 'uq_docente_documento',
        msg: 'Ya existe un docente registrado con este número de documento',
      },
      validate: {
        notNull: { msg: 'El número de documento del docente es obligatorio' },
        notEmpty: { msg: 'El documento no puede estar vacío' },
      },
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: {
        name: 'uq_docente_email',
        msg: 'El correo electrónico ya está asociado a otro docente',
      },
      validate: {
        isEmail: { msg: 'El formato del correo electrónico no es válido' },
      },
    },
    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    especialidad: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'La especialidad del docente es obligatoria' },
        notEmpty: { msg: 'La especialidad no puede estar vacía' },
      },
    },
    tituloAcademico: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'titulo_academico',
    },
    fechaIngreso: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'fecha_ingreso',
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'usuario_id',
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
    modelName: 'docente',
    tableName: 'docente',
    freezeTableName: true,
    timestamps: true,
  }
);

export default Docente;

