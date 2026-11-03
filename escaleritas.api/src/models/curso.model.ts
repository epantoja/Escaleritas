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

export interface ConfiguracionSalonCache {
  horaEntrada: string;
  horaSalida: string;
  horaInicioDescanso: string;
  horaFinDescanso: string;
  tipoCalificacion: 'CARITAS' | 'NUMERICA';
}

export const cacheConfiguracionSalon = new Map<string, ConfiguracionSalonCache>();
export const overridesTipoCalificacion = new Map<string, 'CARITAS' | 'NUMERICA'>();

export const obtenerConfigDefaultsCurso = (
  nivel?: string,
  grado?: string
): ConfiguracionSalonCache => {
  const esPreescolar =
    nivel === 'PREESCOLAR' ||
    grado === GradoEscolar.JARDIN ||
    grado === GradoEscolar.TRANSICION;
  return {
    horaEntrada: esPreescolar ? '07:30' : '07:00',
    horaSalida: esPreescolar ? '12:00' : '13:00',
    horaInicioDescanso: esPreescolar ? '09:30' : '10:00',
    horaFinDescanso: esPreescolar ? '10:00' : '10:30',
    tipoCalificacion: esPreescolar ? 'CARITAS' : 'NUMERICA',
  };
};

export class Curso extends Model<
  InferAttributes<
    Curso,
    { omit: 'estudiantes' | 'docentes' | 'directorGrupo' | 'configuracionHorario' }
  >,
  InferCreationAttributes<
    Curso,
    { omit: 'estudiantes' | 'docentes' | 'directorGrupo' | 'configuracionHorario' }
  >
> {
  declare id: CreationOptional<string>;
  declare codigo: string;
  declare nombre: string;
  declare grado: GradoEscolar | string;
  declare ordenGrado: CreationOptional<number>;
  declare grupo: CreationOptional<string>;
  declare nivel: CreationOptional<'PREESCOLAR' | 'PRIMARIA' | string>;
  declare horaEntrada: CreationOptional<string>;
  declare horaSalida: CreationOptional<string>;
  declare horaInicioDescanso: CreationOptional<string>;
  declare horaFinDescanso: CreationOptional<string>;
  declare tipoCalificacion: CreationOptional<'CARITAS' | 'NUMERICA' | string>;
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
  declare configuracionHorario?: NonAttribute<any>;
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
    horaEntrada: {
      type: DataTypes.VIRTUAL(DataTypes.STRING, ['id', 'nivel', 'grado']),
      get() {
        const id = this.getDataValue('id');
        if (id && cacheConfiguracionSalon.has(id)) {
          return cacheConfiguracionSalon.get(id)!.horaEntrada;
        }
        return obtenerConfigDefaultsCurso(
          this.getDataValue('nivel'),
          this.getDataValue('grado')
        ).horaEntrada;
      },
      set(valor: string) {
        const id = this.getDataValue('id');
        if (id && valor) {
          const actual =
            cacheConfiguracionSalon.get(id) ||
            obtenerConfigDefaultsCurso(
              this.getDataValue('nivel'),
              this.getDataValue('grado')
            );
          cacheConfiguracionSalon.set(id, { ...actual, horaEntrada: valor });
        }
      },
    },
    horaSalida: {
      type: DataTypes.VIRTUAL(DataTypes.STRING, ['id', 'nivel', 'grado']),
      get() {
        const id = this.getDataValue('id');
        if (id && cacheConfiguracionSalon.has(id)) {
          return cacheConfiguracionSalon.get(id)!.horaSalida;
        }
        return obtenerConfigDefaultsCurso(
          this.getDataValue('nivel'),
          this.getDataValue('grado')
        ).horaSalida;
      },
      set(valor: string) {
        const id = this.getDataValue('id');
        if (id && valor) {
          const actual =
            cacheConfiguracionSalon.get(id) ||
            obtenerConfigDefaultsCurso(
              this.getDataValue('nivel'),
              this.getDataValue('grado')
            );
          cacheConfiguracionSalon.set(id, { ...actual, horaSalida: valor });
        }
      },
    },
    horaInicioDescanso: {
      type: DataTypes.VIRTUAL(DataTypes.STRING, ['id', 'nivel', 'grado']),
      get() {
        const id = this.getDataValue('id');
        if (id && cacheConfiguracionSalon.has(id)) {
          return cacheConfiguracionSalon.get(id)!.horaInicioDescanso;
        }
        return obtenerConfigDefaultsCurso(
          this.getDataValue('nivel'),
          this.getDataValue('grado')
        ).horaInicioDescanso;
      },
      set(valor: string) {
        const id = this.getDataValue('id');
        if (id && valor) {
          const actual =
            cacheConfiguracionSalon.get(id) ||
            obtenerConfigDefaultsCurso(
              this.getDataValue('nivel'),
              this.getDataValue('grado')
            );
          cacheConfiguracionSalon.set(id, { ...actual, horaInicioDescanso: valor });
        }
      },
    },
    horaFinDescanso: {
      type: DataTypes.VIRTUAL(DataTypes.STRING, ['id', 'nivel', 'grado']),
      get() {
        const id = this.getDataValue('id');
        if (id && cacheConfiguracionSalon.has(id)) {
          return cacheConfiguracionSalon.get(id)!.horaFinDescanso;
        }
        return obtenerConfigDefaultsCurso(
          this.getDataValue('nivel'),
          this.getDataValue('grado')
        ).horaFinDescanso;
      },
      set(valor: string) {
        const id = this.getDataValue('id');
        if (id && valor) {
          const actual =
            cacheConfiguracionSalon.get(id) ||
            obtenerConfigDefaultsCurso(
              this.getDataValue('nivel'),
              this.getDataValue('grado')
            );
          cacheConfiguracionSalon.set(id, { ...actual, horaFinDescanso: valor });
        }
      },
    },
    tipoCalificacion: {
      type: DataTypes.VIRTUAL(DataTypes.STRING, ['id', 'nivel', 'grado']),
      get() {
        const id = this.getDataValue('id');
        if (id && cacheConfiguracionSalon.has(id)) {
          return cacheConfiguracionSalon.get(id)!.tipoCalificacion;
        }
        if (id && overridesTipoCalificacion.has(id)) {
          return overridesTipoCalificacion.get(id)!;
        }
        return obtenerConfigDefaultsCurso(
          this.getDataValue('nivel'),
          this.getDataValue('grado')
        ).tipoCalificacion;
      },
      set(valor: 'CARITAS' | 'NUMERICA' | string) {
        const id = this.getDataValue('id');
        if (id && (valor === 'CARITAS' || valor === 'NUMERICA')) {
          overridesTipoCalificacion.set(id, valor);
          const actual =
            cacheConfiguracionSalon.get(id) ||
            obtenerConfigDefaultsCurso(
              this.getDataValue('nivel'),
              this.getDataValue('grado')
            );
          cacheConfiguracionSalon.set(id, { ...actual, tipoCalificacion: valor });
        }
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

