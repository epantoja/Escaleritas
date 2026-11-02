import { Router } from 'express';
import {
  getCursosController,
  putCursoController,
  getMateriasController,
  postMateriaController,
  getEstudiantesController,
  getEstudianteByIdController,
  postEstudianteController,
  putEstudianteController,
  deleteEstudianteController,
  getDocentesController,
  getDocenteByIdController,
  postDocenteController,
  putDocenteController,
  deleteDocenteController,
  postAsignarDocenteCursoController,
  deleteAsignacionDocenteController,
} from '../controller/academico.controller';
import { verificaToken } from '../middlewares/autenticacion';

const router = Router();

// Todas las rutas académicas requieren sesión autenticada JWT
router.use(verificaToken);

// 1. Cursos (Jardín a 5° de Primaria) y Materias
router.get('/cursos', getCursosController);
router.put('/cursos/:id', putCursoController);
router.get('/materias', getMateriasController);
router.post('/materias', postMateriaController);

// 2. CRUD Completo de Estudiantes (Matrículas)
router.get('/estudiantes', getEstudiantesController);
router.get('/estudiantes/:id', getEstudianteByIdController);
router.post('/estudiantes', postEstudianteController);
router.put('/estudiantes/:id', putEstudianteController);
router.delete('/estudiantes/:id', deleteEstudianteController);

// 3. CRUD Completo de Docentes y Asignación Académica (Relación N:M Cursos/Materias)
router.get('/docentes', getDocentesController);
router.get('/docentes/:id', getDocenteByIdController);
router.post('/docentes', postDocenteController);
router.put('/docentes/:id', putDocenteController);
router.delete('/docentes/:id', deleteDocenteController);
router.post('/docentes/:id/asignaciones', postAsignarDocenteCursoController);
router.delete('/asignaciones/:asignacionId', deleteAsignacionDocenteController);

export default router;
module.exports = router;

