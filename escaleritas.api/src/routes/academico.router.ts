import { Router } from 'express';
import {
  getCursosController,
  putCursoController,
  getMateriasController,
  postMateriaController,
  putMateriaController,
  deleteMateriaController,
  getEstudiantesController,
  getEstudianteByIdController,
  postEstudianteController,
  putEstudianteController,
  deleteEstudianteController,
  getDocentesController,
  getMiPerfilDocenteController,
  getDocenteByIdController,
  postDocenteController,
  putDocenteController,
  deleteDocenteController,
  postAsignarDocenteCursoController,
  deleteAsignacionDocenteController,
  getHorariosController,
  postHorarioController,
  deleteHorarioController,
  getCalificacionesCursoMateriaController,
  postCalificacionController,
  getPortalEstudianteController,
} from '../controller/academico.controller';
import { verificaToken, autorizarRoles } from '../middlewares/autenticacion';

const router = Router();

// Todas las rutas académicas requieren sesión autenticada JWT
router.use(verificaToken);

// 1. Cursos (Jardín a 5° de Primaria) y Directora de Grupo
router.get('/cursos', getCursosController);
router.put('/cursos/:id', autorizarRoles('ADMIN'), putCursoController);

// 2. Administración del Catálogo de Materias (Lectura para todos, escritura solo ADMIN)
router.get('/materias', getMateriasController);
router.post('/materias', autorizarRoles('ADMIN'), postMateriaController);
router.put('/materias/:id', autorizarRoles('ADMIN'), putMateriaController);
router.delete('/materias/:id', autorizarRoles('ADMIN'), deleteMateriaController);

// 3. CRUD de Estudiantes / Matrículas (Configuración exclusiva de ADMIN, lectura ADMIN/DOCENTE)
router.get('/estudiantes', autorizarRoles('ADMIN', 'DOCENTE'), getEstudiantesController);
router.get('/estudiantes/:id', autorizarRoles('ADMIN', 'DOCENTE'), getEstudianteByIdController);
router.post('/estudiantes', autorizarRoles('ADMIN'), postEstudianteController);
router.put('/estudiantes/:id', autorizarRoles('ADMIN'), putEstudianteController);
router.delete('/estudiantes/:id', autorizarRoles('ADMIN'), deleteEstudianteController);

// 4. CRUD de Docentes y Configuración de Materias que enseña la Docente
router.get('/mi-perfil-docente', autorizarRoles('ADMIN', 'DOCENTE'), getMiPerfilDocenteController);
router.get('/docentes', autorizarRoles('ADMIN', 'DOCENTE'), getDocentesController);
router.get('/docentes/:id', autorizarRoles('ADMIN', 'DOCENTE'), getDocenteByIdController);
router.post('/docentes', autorizarRoles('ADMIN'), postDocenteController);
router.put('/docentes/:id', autorizarRoles('ADMIN', 'DOCENTE'), putDocenteController);
router.delete('/docentes/:id', autorizarRoles('ADMIN'), deleteDocenteController);
router.post('/docentes/:id/asignaciones', autorizarRoles('ADMIN', 'DOCENTE'), postAsignarDocenteCursoController);
router.delete('/asignaciones/:asignacionId', autorizarRoles('ADMIN', 'DOCENTE'), deleteAsignacionDocenteController);

// 5. Horarios Semanales por Materia Enseñada (Docente / Admin)
router.get('/horarios', getHorariosController);
router.post('/horarios', autorizarRoles('ADMIN', 'DOCENTE'), postHorarioController);
router.delete('/horarios/:id', autorizarRoles('ADMIN', 'DOCENTE'), deleteHorarioController);

// 6. Calificaciones y Portal Padre de Familia / Estudiante
router.get('/calificaciones', autorizarRoles('ADMIN', 'DOCENTE'), getCalificacionesCursoMateriaController);
router.post('/calificaciones', autorizarRoles('ADMIN', 'DOCENTE'), postCalificacionController);
router.get('/portal-estudiante', getPortalEstudianteController);

export default router;
module.exports = router;
