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

export enum GradoEscolar {
  JARDIN = 'JARDIN',
  TRANSICION = 'TRANSICION',
  PRIMERO = 'PRIMERO',
  SEGUNDO = 'SEGUNDO',
  TERCERO = 'TERCERO',
  CUARTO = 'CUARTO',
  QUINTO = 'QUINTO',
}

export class Curso extends Model<
  InferAttributes<Curso, { omit: 'estudiantes' | 'docentes' | 'directorGrupo' }>,
  InferCreationAttributes<Curso, { omit: 'estudiantes' | 'docentes' | 'directorGrupo' }>
> {
  declare id: CreationOptional<string>;
  declare codigo: string;
  declare nombre: string;
  declare grado: GradoEscolar | string;
  declare ordenGrado: CreationOptional<number>;
  declare grupo: CreationOptional<string>;
  declare nivel: CreationOptional<'PREESCOLAR' | 'PRIMARIA' | string>;
  declare anioLectivo: CreationOptional<number>;
  declare cupoMaximo: CreationOptional<number>;
  declare aula: CreationOptional<string | null>;
  declare directorDocenteId: ForeignKey<string | null>;
  declare estado: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Asociaciones virtuales para tipado
  declare estudiantes?: NonAttribute<any[]>;
  declare docentes?: NonAttribute<any[]>;
  declare directorGrupo?: NonAttribute<any>;
}

Curso.init(
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
        name: 'uq_curso_codigo',
        msg: 'El código del curso ya se encuentra registrado',
      },
      validate: {
        notNull: { msg: 'El código del curso es obligatorio' },
        notEmpty: { msg: 'El código del curso no puede estar vacío' },
      },
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: {
        notNull: { msg: 'El nombre del curso es obligatorio' },
        notEmpty: { msg: 'El nombre del curso no puede estar vacío' },
      },
    },
    grado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: {
          args: [[
            GradoEscolar.JARDIN,
            GradoEscolar.TRANSICION,
            GradoEscolar.PRIMERO,
            GradoEscolar.SEGUNDO,
            GradoEscolar.TERCERO,
            GradoEscolar.CUARTO,
            GradoEscolar.QUINTO,
          ]],
          msg: 'El grado debe estar entre Jardín y 5° de Primaria',
        },
      },
    },
    ordenGrado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'orden_grado',
    },
    grupo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'A',
    },
    nivel: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'PRIMARIA',
      validate: {
        isIn: {
          args: [['PREESCOLAR', 'PRIMARIA']],
          msg: 'El nivel educativo debe ser PREESCOLAR o PRIMARIA',
        },
      },
    },
    anioLectivo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: new Date().getFullYear(),
      field: 'anio_lectivo',
    },
    cupoMaximo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25,
      field: 'cupo_maximo',
      validate: {
        min: { args: [1], msg: 'El cupo máximo debe ser al menos 1 estudiante' },
      },
    },
    aula: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    directorDocenteId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'director_docente_id',
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
    modelName: 'curso',
    tableName: 'curso',
    freezeTableName: true,
    timestamps: true,
  }
);

export default Curso;

