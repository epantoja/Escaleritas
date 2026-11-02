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
import { Estudiante } from './estudiante.model';
import { Curso } from './curso.model';
import { Materia } from './materia.model';
import { Docente } from './docente.model';

export class Calificacion extends Model<
  InferAttributes<Calificacion, { omit: 'estudiante' | 'curso' | 'materia' | 'docente' }>,
  InferCreationAttributes<Calificacion, { omit: 'estudiante' | 'curso' | 'materia' | 'docente' }>
> {
  declare id: CreationOptional<string>;
  declare estudianteId: ForeignKey<Estudiante['id']>;
  declare cursoId: ForeignKey<Curso['id']>;
  declare materiaId: ForeignKey<Materia['id']>;
  declare docenteId: ForeignKey<Docente['id'] | null>;
  declare notaP1: CreationOptional<number | null>;
  declare notaP2: CreationOptional<number | null>;
  declare notaP3: CreationOptional<number | null>;
  declare notaP4: CreationOptional<number | null>;
  declare notaDefinitiva: CreationOptional<number | null>;
  declare observacion: CreationOptional<string | null>;
  declare anioLectivo: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare estudiante?: NonAttribute<Estudiante>;
  declare curso?: NonAttribute<Curso>;
  declare materia?: NonAttribute<Materia>;
  declare docente?: NonAttribute<Docente>;
}

Calificacion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    estudianteId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'estudiante_id',
      references: {
        model: 'estudiante',
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
    docenteId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'docente_id',
    },
    notaP1: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      field: 'nota_p1',
    },
    notaP2: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      field: 'nota_p2',
    },
    notaP3: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      field: 'nota_p3',
    },
    notaP4: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      field: 'nota_p4',
    },
    notaDefinitiva: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      field: 'nota_definitiva',
    },
    observacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    anioLectivo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: new Date().getFullYear(),
      field: 'anio_lectivo',
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
    modelName: 'calificacion',
    tableName: 'calificacion',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['estudiante_id', 'materia_id', 'anio_lectivo'],
        name: 'uq_calificacion_estudiante_materia_anio',
      },
    ],
  }
);

export default Calificacion;

