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
import { DocenteCursoMateria } from './docente-curso-materia.model';
import { Curso } from './curso.model';
import { Materia } from './materia.model';
import { Docente } from './docente.model';

export type DiaSemanaTipo =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES';

export class HorarioClase extends Model<
  InferAttributes<HorarioClase, { omit: 'asignacion' | 'curso' | 'materia' | 'docente' }>,
  InferCreationAttributes<HorarioClase, { omit: 'asignacion' | 'curso' | 'materia' | 'docente' }>
> {
  declare id: CreationOptional<string>;
  declare asignacionId: ForeignKey<DocenteCursoMateria['id']>;
  declare docenteId: ForeignKey<Docente['id']>;
  declare cursoId: ForeignKey<Curso['id']>;
  declare materiaId: ForeignKey<Materia['id']>;
  declare diaSemana: DiaSemanaTipo | string;
  declare horaInicio: string;
  declare horaFin: string;
  declare aula: CreationOptional<string | null>;
  declare estado: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare asignacion?: NonAttribute<DocenteCursoMateria>;
  declare curso?: NonAttribute<Curso>;
  declare materia?: NonAttribute<Materia>;
  declare docente?: NonAttribute<Docente>;
}

HorarioClase.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    asignacionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'asignacion_id',
      references: {
        model: 'docente_curso_materia',
        key: 'id',
      },
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
    diaSemana: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: 'dia_semana',
      validate: {
        isIn: {
          args: [['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']],
          msg: 'El día de la semana debe ser de LUNES a VIERNES',
        },
      },
    },
    horaInicio: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'hora_inicio',
      validate: {
        notNull: { msg: 'La hora de inicio es obligatoria' },
        notEmpty: { msg: 'La hora de inicio no puede estar vacía' },
      },
    },
    horaFin: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'hora_fin',
      validate: {
        notNull: { msg: 'La hora de finalización es obligatoria' },
        notEmpty: { msg: 'La hora de finalización no puede estar vacía' },
      },
    },
    aula: {
      type: DataTypes.STRING(50),
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
    modelName: 'horario_clase',
    tableName: 'horario_clase',
    freezeTableName: true,
    timestamps: true,
  }
);

export default HorarioClase;

