import { sequelize } from '../config/database';
import { Rol, RolCodigo } from './rol.model';
import { Permiso } from './permiso.model';
import { RolPermiso } from './rol-permiso.model';
import { Usuario } from './usuario.model';
import { Curso, GradoEscolar } from './curso.model';
import { Materia } from './materia.model';
import { Docente } from './docente.model';
import { DocenteCursoMateria } from './docente-curso-materia.model';
import { Estudiante } from './estudiante.model';
import { HorarioClase } from './horario-clase.model';
import { Calificacion } from './calificacion.model';

// ============================================================================
// 1. DEFINICIÓN DE RELACIONES DE SEGURIDAD RBAC
// ============================================================================

Rol.hasMany(Usuario, {
  sourceKey: 'id',
  foreignKey: 'rolId',
  as: 'usuarios',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Usuario.belongsTo(Rol, {
  targetKey: 'id',
  foreignKey: 'rolId',
  as: 'rol',
});

Rol.belongsToMany(Permiso, {
  through: RolPermiso,
  foreignKey: 'rolId',
  otherKey: 'permisoId',
  as: 'permisos',
});

Permiso.belongsToMany(Rol, {
  through: RolPermiso,
  foreignKey: 'permisoId',
  otherKey: 'rolId',
  as: 'roles',
});

// ============================================================================
// 2. DEFINICIÓN DE RELACIONES DE ESTRUCTURA ACADÉMICA
// ============================================================================

// Un Curso tiene muchos Estudiantes matriculados (1:N)
Curso.hasMany(Estudiante, {
  sourceKey: 'id',
  foreignKey: 'cursoId',
  as: 'estudiantes',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Estudiante.belongsTo(Curso, {
  targetKey: 'id',
  foreignKey: 'cursoId',
  as: 'curso',
});

// Un Curso tiene una Docente Directora de Grupo (1:N opcional)
Docente.hasMany(Curso, {
  sourceKey: 'id',
  foreignKey: 'directorDocenteId',
  as: 'cursosDirigidos',
});

Curso.belongsTo(Docente, {
  targetKey: 'id',
  foreignKey: 'directorDocenteId',
  as: 'directorGrupo',
});

// Vinculación opcional de Docente y Estudiante con Usuario del ERP
Usuario.hasOne(Docente, {
  sourceKey: 'id',
  foreignKey: 'usuarioId',
  as: 'perfilDocente',
});
Docente.belongsTo(Usuario, {
  targetKey: 'id',
  foreignKey: 'usuarioId',
  as: 'usuario',
});

Usuario.hasOne(Estudiante, {
  sourceKey: 'id',
  foreignKey: 'usuarioId',
  as: 'perfilEstudiante',
});
Estudiante.belongsTo(Usuario, {
  targetKey: 'id',
  foreignKey: 'usuarioId',
  as: 'usuario',
});

// Relación Muchos a Muchos (N:M): Un Docente imparte varias Materias a varios Cursos
Docente.belongsToMany(Curso, {
  through: { model: DocenteCursoMateria, unique: false },
  foreignKey: 'docenteId',
  otherKey: 'cursoId',
  as: 'cursosAsignados',
});

Curso.belongsToMany(Docente, {
  through: { model: DocenteCursoMateria, unique: false },
  foreignKey: 'cursoId',
  otherKey: 'docenteId',
  as: 'docentes',
});

Docente.belongsToMany(Materia, {
  through: { model: DocenteCursoMateria, unique: false },
  foreignKey: 'docenteId',
  otherKey: 'materiaId',
  as: 'materiasImpartidas',
});

Materia.belongsToMany(Docente, {
  through: { model: DocenteCursoMateria, unique: false },
  foreignKey: 'materiaId',
  otherKey: 'docenteId',
  as: 'docentes',
});

// Relaciones directas sobre la tabla puente DocenteCursoMateria
Docente.hasMany(DocenteCursoMateria, {
  sourceKey: 'id',
  foreignKey: 'docenteId',
  as: 'asignaciones',
  onDelete: 'CASCADE',
});
DocenteCursoMateria.belongsTo(Docente, {
  targetKey: 'id',
  foreignKey: 'docenteId',
  as: 'docente',
});

Curso.hasMany(DocenteCursoMateria, {
  sourceKey: 'id',
  foreignKey: 'cursoId',
  as: 'asignacionesDocentes',
  onDelete: 'CASCADE',
});
DocenteCursoMateria.belongsTo(Curso, {
  targetKey: 'id',
  foreignKey: 'cursoId',
  as: 'curso',
});

Materia.hasMany(DocenteCursoMateria, {
  sourceKey: 'id',
  foreignKey: 'materiaId',
  as: 'asignacionesCurso',
  onDelete: 'CASCADE',
});
DocenteCursoMateria.belongsTo(Materia, {
  targetKey: 'id',
  foreignKey: 'materiaId',
  as: 'materia',
});

// ============================================================================
// 3. RELACIONES DE HORARIOS DE CLASE Y CALIFICACIONES
// ============================================================================

DocenteCursoMateria.hasMany(HorarioClase, {
  sourceKey: 'id',
  foreignKey: 'asignacionId',
  as: 'horarios',
  onDelete: 'CASCADE',
});
HorarioClase.belongsTo(DocenteCursoMateria, {
  targetKey: 'id',
  foreignKey: 'asignacionId',
  as: 'asignacion',
});

Docente.hasMany(HorarioClase, {
  sourceKey: 'id',
  foreignKey: 'docenteId',
  as: 'horarios',
  onDelete: 'CASCADE',
});
HorarioClase.belongsTo(Docente, {
  targetKey: 'id',
  foreignKey: 'docenteId',
  as: 'docente',
});

Curso.hasMany(HorarioClase, {
  sourceKey: 'id',
  foreignKey: 'cursoId',
  as: 'horarios',
  onDelete: 'CASCADE',
});
HorarioClase.belongsTo(Curso, {
  targetKey: 'id',
  foreignKey: 'cursoId',
  as: 'curso',
});

Materia.hasMany(HorarioClase, {
  sourceKey: 'id',
  foreignKey: 'materiaId',
  as: 'horarios',
  onDelete: 'CASCADE',
});
HorarioClase.belongsTo(Materia, {
  targetKey: 'id',
  foreignKey: 'materiaId',
  as: 'materia',
});

Estudiante.hasMany(Calificacion, {
  sourceKey: 'id',
  foreignKey: 'estudianteId',
  as: 'calificaciones',
  onDelete: 'CASCADE',
});
Calificacion.belongsTo(Estudiante, {
  targetKey: 'id',
  foreignKey: 'estudianteId',
  as: 'estudiante',
});

Materia.hasMany(Calificacion, {
  sourceKey: 'id',
  foreignKey: 'materiaId',
  as: 'calificaciones',
  onDelete: 'CASCADE',
});
Calificacion.belongsTo(Materia, {
  targetKey: 'id',
  foreignKey: 'materiaId',
  as: 'materia',
});

Curso.hasMany(Calificacion, {
  sourceKey: 'id',
  foreignKey: 'cursoId',
  as: 'calificaciones',
  onDelete: 'CASCADE',
});
Calificacion.belongsTo(Curso, {
  targetKey: 'id',
  foreignKey: 'cursoId',
  as: 'curso',
});

Docente.hasMany(Calificacion, {
  sourceKey: 'id',
  foreignKey: 'docenteId',
  as: 'calificaciones',
});
Calificacion.belongsTo(Docente, {
  targetKey: 'id',
  foreignKey: 'docenteId',
  as: 'docente',
});

// ============================================================================
// 4. SEED DE SEGURIDAD Y ESTRUCTURA ACADÉMICA BASE (Jardín a 5° de Primaria)
// ============================================================================
export const seedSeguridadBase = async (): Promise<void> => {
  try {
    await Curso.sync();
    await Materia.sync();
    await Docente.sync();
    await DocenteCursoMateria.sync();
    await Estudiante.sync();
    await HorarioClase.sync();
    await Calificacion.sync();

    const permisosBase = [
      {
        codigo: 'USUARIOS_GESTIONAR',
        nombre: 'Gestionar Usuarios y Roles',
        modulo: 'SEGURIDAD',
        descripcion: 'Crear, editar y cambiar estado de usuarios y roles del ERP',
      },
      {
        codigo: 'MATRICULAS_GESTIONAR',
        nombre: 'Gestionar Matrículas',
        modulo: 'ADMISIONES',
        descripcion: 'Gestión de matrículas desde Jardín hasta 5to de Primaria',
      },
      {
        codigo: 'CALIFICACIONES_EDITAR',
        nombre: 'Registrar y Editar Calificaciones',
        modulo: 'ACADEMICO',
        descripcion: 'Ingreso de notas, logros y boletines por periodo',
      },
      {
        codigo: 'CALIFICACIONES_VER',
        nombre: 'Consultar Boletines y Calificaciones',
        modulo: 'ACADEMICO',
        descripcion: 'Visualización de boletines, asistencia y observador del alumno',
      },
      {
        codigo: 'ASISTENCIA_REGISTRAR',
        nombre: 'Control de Asistencia Diaria',
        modulo: 'ACADEMICO',
        descripcion: 'Registro de asistencia por grado y curso',
      },
      {
        codigo: 'PENSIONES_CONSULTAR',
        nombre: 'Consultar Estado de Cuenta y Pensiones',
        modulo: 'FINANCIERO',
        descripcion: 'Consulta de recibos de pago y pensiones escolares',
      },
    ];

    const permisosCreados: Record<string, Permiso> = {};
    for (const p of permisosBase) {
      const [permiso] = await Permiso.findOrCreate({
        where: { codigo: p.codigo },
        defaults: { ...p, estado: 1 },
      });
      permisosCreados[p.codigo] = permiso;
    }

    const rolesBase = [
      {
        codigo: RolCodigo.ADMIN,
        nombre: 'Administrador',
        descripcion: 'Acceso total a la administración académica, financiera y seguridad del colegio',
        permisos: Object.keys(permisosCreados),
      },
      {
        codigo: RolCodigo.DOCENTE,
        nombre: 'Docente',
        descripcion: 'Gestión de cursos, planeación, asistencia y calificaciones (Jardín a 5° Primaria)',
        permisos: [
          'CALIFICACIONES_EDITAR',
          'CALIFICACIONES_VER',
          'ASISTENCIA_REGISTRAR',
        ],
      },
      {
        codigo: RolCodigo.PADRE_ESTUDIANTE,
        nombre: 'Padre/Estudiante',
        descripcion: 'Consulta de boletines, tareas, asistencia y estado de cuenta del estudiante',
        permisos: ['CALIFICACIONES_VER', 'PENSIONES_CONSULTAR'],
      },
    ];

    for (const r of rolesBase) {
      const [rol] = await Rol.findOrCreate({
        where: { codigo: r.codigo },
        defaults: {
          codigo: r.codigo,
          nombre: r.nombre,
          descripcion: r.descripcion,
          estado: 1,
        },
      });

      const instanciasPermisos = r.permisos
        .map((cod) => permisosCreados[cod])
        .filter(Boolean);
      await rol.setPermisos(instanciasPermisos);
    }

    // Semilla de los 7 grados escolares: desde Jardín hasta 5° de Primaria
    const anioActual = new Date().getFullYear();
    const cursosIniciales = [
      {
        codigo: 'JAR-A',
        nombre: 'Jardín',
        grado: GradoEscolar.JARDIN,
        ordenGrado: 1,
        grupo: 'A',
        nivel: 'PREESCOLAR',
        cupoMaximo: 20,
        aula: 'Salón 101 - Preescolar',
      },
      {
        codigo: 'TRA-A',
        nombre: 'Transición',
        grado: GradoEscolar.TRANSICION,
        ordenGrado: 2,
        grupo: 'A',
        nivel: 'PREESCOLAR',
        cupoMaximo: 22,
        aula: 'Salón 102 - Preescolar',
      },
      {
        codigo: 'PRI-1A',
        nombre: '1° de Primaria',
        grado: GradoEscolar.PRIMERO,
        ordenGrado: 3,
        grupo: 'A',
        nivel: 'PRIMARIA',
        cupoMaximo: 25,
        aula: 'Salón 201 - Primaria',
      },
      {
        codigo: 'PRI-2A',
        nombre: '2° de Primaria',
        grado: GradoEscolar.SEGUNDO,
        ordenGrado: 4,
        grupo: 'A',
        nivel: 'PRIMARIA',
        cupoMaximo: 25,
        aula: 'Salón 202 - Primaria',
      },
      {
        codigo: 'PRI-3A',
        nombre: '3° de Primaria',
        grado: GradoEscolar.TERCERO,
        ordenGrado: 5,
        grupo: 'A',
        nivel: 'PRIMARIA',
        cupoMaximo: 25,
        aula: 'Salón 203 - Primaria',
      },
      {
        codigo: 'PRI-4A',
        nombre: '4° de Primaria',
        grado: GradoEscolar.CUARTO,
        ordenGrado: 6,
        grupo: 'A',
        nivel: 'PRIMARIA',
        cupoMaximo: 28,
        aula: 'Salón 301 - Primaria',
      },
      {
        codigo: 'PRI-5A',
        nombre: '5° de Primaria',
        grado: GradoEscolar.QUINTO,
        ordenGrado: 7,
        grupo: 'A',
        nivel: 'PRIMARIA',
        cupoMaximo: 28,
        aula: 'Salón 302 - Primaria',
      },
    ];

    for (const c of cursosIniciales) {
      await Curso.findOrCreate({
        where: { codigo: c.codigo },
        defaults: {
          ...c,
          anioLectivo: anioActual,
          estado: 1,
        },
      });
    }

    // Semilla de Materias / Asignaturas base del colegio
    const materiasIniciales = [
      {
        codigo: 'MAT-01',
        nombre: 'Matemáticas y Pensamiento Lógico',
        area: 'Matemáticas',
        intensidadHoraria: 5,
        descripcion: 'Aritmética, geometría y resolución de problemas',
      },
      {
        codigo: 'LEN-01',
        nombre: 'Lengua Castellana y Lectoescritura',
        area: 'Humanidades',
        intensidadHoraria: 5,
        descripcion: 'Comprensión lectora, gramática y expresión oral/escrita',
      },
      {
        codigo: 'CIE-01',
        nombre: 'Ciencias Naturales y Educación Ambiental',
        area: 'Ciencias Naturales',
        intensidadHoraria: 4,
        descripcion: 'Entorno vivo, medio ambiente y método científico',
      },
      {
        codigo: 'SOC-01',
        nombre: 'Ciencias Sociales, Historia y Democracia',
        area: 'Ciencias Sociales',
        intensidadHoraria: 4,
        descripcion: 'Historia, geografía, convivencia y competencias ciudadanas',
      },
      {
        codigo: 'ING-01',
        nombre: 'Inglés (Foreign Language)',
        area: 'Idiomas',
        intensidadHoraria: 4,
        descripcion: 'Listening, speaking, reading y vocabulario bilingüe',
      },
      {
        codigo: 'ART-01',
        nombre: 'Educación Artística y Expresión Corporal',
        area: 'Artes',
        intensidadHoraria: 2,
        descripcion: 'Música, artes plásticas y motricidad fina',
      },
      {
        codigo: 'EDF-01',
        nombre: 'Educación Física, Recreación y Deportes',
        area: 'Educación Física',
        intensidadHoraria: 2,
        descripcion: 'Motricidad gruesa, coordinación y hábitos saludables',
      },
      {
        codigo: 'DIM-01',
        nombre: 'Dimensión Socioafectiva y Cognitiva (Preescolar)',
        area: 'Preescolar Integral',
        intensidadHoraria: 6,
        descripcion: 'Desarrollo integral para grados Jardín y Transición',
      },
    ];

    for (const m of materiasIniciales) {
      await Materia.findOrCreate({
        where: { codigo: m.codigo },
        defaults: {
          ...m,
          estado: 1,
        },
      });
    }

    console.log('[DB Seed] Estructura académica, horarios y calificaciones verificada.');
  } catch (error) {
    console.warn(
      '[DB Seed] Advertencia durante la inicialización de datos base:',
      (error as Error).message
    );
  }
};

export {
  sequelize,
  Rol,
  RolCodigo,
  Permiso,
  RolPermiso,
  Usuario,
  Curso,
  GradoEscolar,
  Materia,
  Docente,
  DocenteCursoMateria,
  Estudiante,
  HorarioClase,
  Calificacion,
};
