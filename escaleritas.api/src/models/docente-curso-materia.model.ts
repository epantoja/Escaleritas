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
import { Docente } from './docente.model';
import { Curso } from './curso.model';
import { Materia } from './materia.model';

/**
 * Modelo relacional Muchos a Muchos (N:M) que permite que un Docente
 * imparta múltiples Materias en múltiples Cursos (desde Jardín hasta 5° de Primaria).
 */
export class DocenteCursoMateria extends Model<
  InferAttributes<DocenteCursoMateria, { omit: 'docente' | 'curso' | 'materia' }>,
  InferCreationAttributes<DocenteCursoMateria, { omit: 'docente' | 'curso' | 'materia' }>
> {
  declare id: CreationOptional<string>;
  declare docenteId: ForeignKey<Docente['id']>;
  declare cursoId: ForeignKey<Curso['id']>;
  declare materiaId: ForeignKey<Materia['id']>;
  declare intensidadHoraria: CreationOptional<number>;
  declare anioLectivo: CreationOptional<number>;
  declare esTitularCurso: CreationOptional<boolean>;
  declare estado: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare docente?: NonAttribute<Docente>;
  declare curso?: NonAttribute<Curso>;
  declare materia?: NonAttribute<Materia>;
}

DocenteCursoMateria.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    docenteId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'docente_id',
      references: {
        model: 'docente',
        key: 'id',
      },
    },
    cursoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'curso_id',
      references: {
        model: 'curso',
        key: 'id',
      },
    },
    materiaId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'materia_id',
      references: {
        model: 'materia',
        key: 'id',
      },
    },
    intensidadHoraria: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
      field: 'intensidad_horaria',
      validate: {
        min: { args: [1], msg: 'La intensidad horaria debe ser al menos 1 hora semanal' },
        max: { args: [30], msg: 'La intensidad horaria no puede superar 30 horas semanales' },
      },
    },
    anioLectivo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: new Date().getFullYear(),
      field: 'anio_lectivo',
    },
    esTitularCurso: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'es_titular_curso',
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
    modelName: 'docente_curso_materia',
    tableName: 'docente_curso_materia',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['docente_id', 'curso_id', 'materia_id', 'anio_lectivo'],
        name: 'uq_docente_curso_materia_anio',
      },
    ],
  }
);

export default DocenteCursoMateria;

