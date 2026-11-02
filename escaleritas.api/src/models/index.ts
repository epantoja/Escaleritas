import { sequelize } from '../config/database';
import { Rol, RolCodigo } from './rol.model';
import { Permiso } from './permiso.model';
import { RolPermiso } from './rol-permiso.model';
import { Usuario } from './usuario.model';

// ============================================================================
// DEFINICIÓN DE RELACIONES (ASOCIACIONES SEQUELIZE)
// ============================================================================

// 1. Relación 1:N entre Rol y Usuario (Un Rol tiene muchos Usuarios)
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

// 2. Relación N:M entre Rol y Permiso mediante RolPermiso
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
// SEED DE SEGURIDAD BASE (ROLES Y PERMISOS DEL ERP EDUCATIVO)
// ============================================================================
export const seedSeguridadBase = async (): Promise<void> => {
  try {
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
  } catch (error) {
    console.warn(
      '[DB Seed] No se ejecutó la carga inicial de roles/permisos (verifique que las tablas existan):',
      (error as Error).message
    );
  }
};

export { sequelize, Rol, RolCodigo, Permiso, RolPermiso, Usuario };

