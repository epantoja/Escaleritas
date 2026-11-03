import { Request, Response, NextFunction } from 'express';
import {
  listarCursosBL,
  actualizarCursoBL,
  listarMateriasBL,
  crearMateriaBL,
  actualizarMateriaBL,
  eliminarMateriaBL,
  listarEstudiantesBL,
  obtenerEstudiantePorIdBL,
  crearEstudianteBL,
  actualizarEstudianteBL,
  eliminarEstudianteBL,
  listarDocentesBL,
  obtenerDocentePorIdBL,
  obtenerMiPerfilDocenteBL,
  crearDocenteBL,
  actualizarDocenteBL,
  eliminarDocenteBL,
  asignarDocenteCursoMateriaBL,
  eliminarAsignacionDocenteBL,
  listarHorariosBL,
  crearHorarioClaseBL,
  actualizarHorarioClaseBL,
  eliminarHorarioClaseBL,
  listarCalificacionesPorCursoMateriaBL,
  guardarCalificacionBL,
  obtenerPortalEstudianteBL,
} from '../businessLogic/academico.BL';
import { AuthenticatedRequest } from '../middlewares/autenticacion';

// ============================================================================
// 1. CONTROLADORES DE CURSOS / SALONES Y DIRECTORA DE GRUPO
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
      mensaje: 'Salón de clase y directora de grupo actualizados correctamente',
      curso,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. CONTROLADORES DE MATERIAS (ADMINISTRACIÓN DE MATERIAS)
// ============================================================================

export const getMateriasController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { busqueda } = req.query;
    const materias = await listarMateriasBL(busqueda as string);
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

export const putMateriaController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const materia = await actualizarMateriaBL(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      mensaje: 'Materia actualizada correctamente',
      materia,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMateriaController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resultado = await eliminarMateriaBL(req.params.id);
    res.status(200).json({ ok: true, ...resultado });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. CONTROLADORES DE ESTUDIANTES (MATRÍCULAS CRUD)
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
// 4. CONTROLADORES DE DOCENTES Y ASIGNACIÓN DE GRADOS/MATERIAS (CRUD + N:M)
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

export const getMiPerfilDocenteController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ ok: false, error: 'Usuario no autenticado' });
      return;
    }
    const data = await obtenerMiPerfilDocenteBL(req.user);
    res.status(200).json({ ok: true, ...data });
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
      mensaje: 'Docente y cuenta de acceso a la plataforma creados exitosamente',
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
      mensaje: 'Datos y credenciales del docente actualizados correctamente',
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
      mensaje: 'Materia y salón asignados correctamente a la docente',
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

// ============================================================================
// 5. CONTROLADORES DE HORARIOS DE CLASE Y CALIFICACIONES / PORTAL ESTUDIANTE
// ============================================================================

export const getHorariosController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { docenteId, cursoId, asignacionId } = req.query;
    const horarios = await listarHorariosBL({
      docenteId: docenteId as string,
      cursoId: cursoId as string,
      asignacionId: asignacionId as string,
    });
    res.status(200).json({ ok: true, horarios });
  } catch (error) {
    next(error);
  }
};

export const postHorarioController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const horario = await crearHorarioClaseBL(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Bloque de horario semanal registrado correctamente',
      horario,
    });
  } catch (error) {
    next(error);
  }
};

export const putHorarioController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const horario = await actualizarHorarioClaseBL(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      mensaje: 'Bloque de horario del salón actualizado correctamente',
      horario,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHorarioController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resultado = await eliminarHorarioClaseBL(req.params.id);
    res.status(200).json({ ok: true, ...resultado });
  } catch (error) {
    next(error);
  }
};

export const getCalificacionesCursoMateriaController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cursoId, materiaId } = req.query;
    const planilla = await listarCalificacionesPorCursoMateriaBL(
      cursoId as string,
      materiaId as string
    );
    res.status(200).json({ ok: true, planilla });
  } catch (error) {
    next(error);
  }
};

export const postCalificacionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const calificacion = await guardarCalificacionBL(req.body);
    res.status(200).json({
      ok: true,
      mensaje: 'Calificación guardada exitosamente',
      calificacion,
    });
  } catch (error) {
    next(error);
  }
};

export const getPortalEstudianteController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ ok: false, error: 'Usuario no autenticado' });
      return;
    }
    const { estudianteId } = req.query;
    const data = await obtenerPortalEstudianteBL(
      req.user,
      estudianteId as string | undefined
    );
    res.status(200).json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};
