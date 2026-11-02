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
import { Curso } from './curso.model';
import { Usuario } from './usuario.model';

export type EstadoMatriculaTipo =
  | 'MATRICULADO'
  | 'PREMATRICULADO'
  | 'RETIRADO'
  | 'GRADUADO';

export class Estudiante extends Model<
  InferAttributes<Estudiante, { omit: 'curso' | 'usuario' }>,
  InferCreationAttributes<Estudiante, { omit: 'curso' | 'usuario' }>
> {
  declare id: CreationOptional<string>;
  declare codigoMatricula: string;
  declare nombres: string;
  declare apellidos: string;
  declare tipoDocumento: CreationOptional<string>;
  declare documento: string;
  declare fechaNacimiento: CreationOptional<string | null>;
  declare genero: CreationOptional<string | null>;
  declare direccion: CreationOptional<string | null>;
  declare eps: CreationOptional<string | null>;
  declare tipoSangre: CreationOptional<string | null>;
  declare acudienteNombre: string;
  declare acudienteTelefono: string;
  declare acudienteEmail: CreationOptional<string | null>;
  declare acudienteParentesco: CreationOptional<string>;
  declare cursoId: ForeignKey<Curso['id']>;
  declare fechaMatricula: CreationOptional<string>;
  declare estadoMatricula: CreationOptional<EstadoMatriculaTipo | string>;
  declare observaciones: CreationOptional<string | null>;
  declare usuarioId: ForeignKey<Usuario['id'] | null>;
  declare estado: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones tipadas
  declare curso?: NonAttribute<Curso>;
  declare usuario?: NonAttribute<Usuario>;
}

Estudiante.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    codigoMatricula: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'codigo_matricula',
      unique: {
        name: 'uq_estudiante_codigo_matricula',
        msg: 'El código de matrícula ya se encuentra asignado',
      },
      validate: {
        notNull: { msg: 'El código de matrícula es obligatorio' },
        notEmpty: { msg: 'El código de matrícula no puede estar vacío' },
      },
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Los nombres del estudiante son obligatorios' },
        notEmpty: { msg: 'Los nombres no pueden estar vacíos' },
        len: { args: [2, 100], msg: 'Los nombres deben tener entre 2 y 100 caracteres' },
      },
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Los apellidos del estudiante son obligatorios' },
        notEmpty: { msg: 'Los apellidos no pueden estar vacíos' },
        len: { args: [2, 100], msg: 'Los apellidos deben tener entre 2 y 100 caracteres' },
      },
    },
    tipoDocumento: {
      type: DataTypes.STRING(15),
      allowNull: false,
      defaultValue: 'RC',
      field: 'tipo_documento',
      validate: {
        isIn: {
          args: [['RC', 'TI', 'NUIP', 'CE', 'PAS']],
          msg: 'El tipo de documento debe ser RC, TI, NUIP, CE o PAS',
        },
      },
    },
    documento: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: {
        name: 'uq_estudiante_documento',
        msg: 'Ya existe un estudiante registrado con este número de documento',
      },
      validate: {
        notNull: { msg: 'El documento de identidad del estudiante es obligatorio' },
        notEmpty: { msg: 'El documento no puede estar vacío' },
      },
    },
    fechaNacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'fecha_nacimiento',
    },
    genero: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    direccion: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    eps: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    tipoSangre: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'tipo_sangre',
    },
    acudienteNombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'acudiente_nombre',
      validate: {
        notNull: { msg: 'El nombre del padre o acudiente es obligatorio' },
        notEmpty: { msg: 'El nombre del acudiente no puede estar vacío' },
      },
    },
    acudienteTelefono: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'acudiente_telefono',
      validate: {
        notNull: { msg: 'El teléfono del acudiente es obligatorio' },
        notEmpty: { msg: 'El teléfono del acudiente no puede estar vacío' },
      },
    },
    acudienteEmail: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'acudiente_email',
    },
    acudienteParentesco: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'Madre / Padre',
      field: 'acudiente_parentesco',
    },
    cursoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'curso_id',
      validate: {
        notNull: { msg: 'Debe seleccionar el curso/grado al cual matricular al estudiante' },
        isUUID: { args: 4, msg: 'El id del curso debe ser un UUID válido' },
      },
    },
    fechaMatricula: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'fecha_matricula',
    },
    estadoMatricula: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'MATRICULADO',
      field: 'estado_matricula',
      validate: {
        isIn: {
          args: [['MATRICULADO', 'PREMATRICULADO', 'RETIRADO', 'GRADUADO']],
          msg: 'Estado de matrícula no válido',
        },
      },
    },
    observaciones: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    modelName: 'estudiante',
    tableName: 'estudiante',
    freezeTableName: true,
    timestamps: true,
  }
);

export default Estudiante;

