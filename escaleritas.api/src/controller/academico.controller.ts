import { Request, Response, NextFunction } from 'express';
import {
  listarCursosBL,
  actualizarCursoBL,
  listarMateriasBL,
  crearMateriaBL,
  listarEstudiantesBL,
  obtenerEstudiantePorIdBL,
  crearEstudianteBL,
  actualizarEstudianteBL,
  eliminarEstudianteBL,
  listarDocentesBL,
  obtenerDocentePorIdBL,
  crearDocenteBL,
  actualizarDocenteBL,
  eliminarDocenteBL,
  asignarDocenteCursoMateriaBL,
  eliminarAsignacionDocenteBL,
} from '../businessLogic/academico.BL';

// ============================================================================
// CONTROLADORES DE CURSOS Y MATERIAS
// ============================================================================

export const getCursosController = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cursos = await listarCursosBL();
    res.status(200).json({ ok: true, cursos });
  } catch (error) {
    next(error);
  }
};

export const putCursoController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const curso = await actualizarCursoBL(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      mensaje: 'Curso actualizado correctamente',
      curso,
    });
  } catch (error) {
    next(error);
  }
};

export const getMateriasController = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const materias = await listarMateriasBL();
    res.status(200).json({ ok: true, materias });
  } catch (error) {
    next(error);
  }
};

export const postMateriaController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const materia = await crearMateriaBL(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Materia creada exitosamente',
      materia,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CONTROLADORES DE ESTUDIANTES (MATRÍCULAS CRUD)
// ============================================================================

export const getEstudiantesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { busqueda, cursoId, estadoMatricula } = req.query;
    const estudiantes = await listarEstudiantesBL({
      busqueda: busqueda as string,
      cursoId: cursoId as string,
      estadoMatricula: estadoMatricula as string,
    });
    res.status(200).json({ ok: true, estudiantes });
  } catch (error) {
    next(error);
  }
};

export const getEstudianteByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const estudiante = await obtenerEstudiantePorIdBL(req.params.id);
    res.status(200).json({ ok: true, estudiante });
  } catch (error) {
    next(error);
  }
};

export const postEstudianteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const estudiante = await crearEstudianteBL(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Estudiante matriculado exitosamente',
      estudiante,
    });
  } catch (error) {
    next(error);
  }
};

export const putEstudianteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const estudiante = await actualizarEstudianteBL(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      mensaje: 'Información del estudiante actualizada correctamente',
      estudiante,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEstudianteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resultado = await eliminarEstudianteBL(req.params.id);
    res.status(200).json({ ok: true, ...resultado });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CONTROLADORES DE DOCENTES Y ASIGNACIÓN DE GRADOS/MATERIAS (CRUD + N:M)
// ============================================================================

export const getDocentesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { busqueda, cursoId, especialidad } = req.query;
    const docentes = await listarDocentesBL({
      busqueda: busqueda as string,
      cursoId: cursoId as string,
      especialidad: especialidad as string,
    });
    res.status(200).json({ ok: true, docentes });
  } catch (error) {
    next(error);
  }
};

export const getDocenteByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const docente = await obtenerDocentePorIdBL(req.params.id);
    res.status(200).json({ ok: true, docente });
  } catch (error) {
    next(error);
  }
};

export const postDocenteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const docente = await crearDocenteBL(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Docente registrado exitosamente',
      docente,
    });
  } catch (error) {
    next(error);
  }
};

export const putDocenteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const docente = await actualizarDocenteBL(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      mensaje: 'Datos del docente actualizados correctamente',
      docente,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocenteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resultado = await eliminarDocenteBL(req.params.id);
    res.status(200).json({ ok: true, ...resultado });
  } catch (error) {
    next(error);
  }
};

export const postAsignarDocenteCursoController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const docente = await asignarDocenteCursoMateriaBL(req.params.id, req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Asignación académica registrada correctamente',
      docente,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAsignacionDocenteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const docente = await eliminarAsignacionDocenteBL(req.params.asignacionId);
    res.status(200).json({
      ok: true,
      mensaje: 'Asignación académica eliminada correctamente',
      docente,
    });
  } catch (error) {
    next(error);
  }
};

