import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CalificacionPlanillaItemModel,
  CursoModel,
  DocenteModel,
  EstudianteModel,
  HorarioClaseModel,
  MateriaModel,
  PortalEstudianteResponseModel,
} from '../models/academico.model';

@Injectable({
  providedIn: 'root',
})
export class AcademicoService {
  private readonly baseUrl = `${environment.apiUrl}api/academico`;

  constructor(private http: HttpClient) {}

  // ==========================================================================
  // 1. CURSOS / SALONES Y DIRECTORA DE GRUPO
  // ==========================================================================

  obtenerCursos(): Observable<{ ok: boolean; cursos: CursoModel[] }> {
    return this.http.get<{ ok: boolean; cursos: CursoModel[] }>(
      `${this.baseUrl}/cursos`
    );
  }

  actualizarCurso(
    id: string,
    datos: Partial<{
      nombre: string;
      cupoMaximo: number;
      aula: string;
      directorDocenteId: string | null;
      tipoCalificacion: 'CARITAS' | 'NUMERICA' | string;
      horaInicioDescanso: string;
      horaFinDescanso: string;
    }>
  ): Observable<{ ok: boolean; mensaje: string; curso: CursoModel }> {
    return this.http.put<{ ok: boolean; mensaje: string; curso: CursoModel }>(
      `${this.baseUrl}/cursos/${id}`,
      datos
    );
  }

  // ==========================================================================
  // 2. CRUD DE MATERIAS
  // ==========================================================================

  obtenerMaterias(
    busqueda?: string
  ): Observable<{ ok: boolean; materias: MateriaModel[] }> {
    let params = new HttpParams();
    if (busqueda) {
      params = params.set('busqueda', busqueda);
    }
    return this.http.get<{ ok: boolean; materias: MateriaModel[] }>(
      `${this.baseUrl}/materias`,
      { params }
    );
  }

  crearMateria(
    datos: Partial<MateriaModel>
  ): Observable<{ ok: boolean; mensaje: string; materia: MateriaModel }> {
    return this.http.post<{
      ok: boolean;
      mensaje: string;
      materia: MateriaModel;
    }>(`${this.baseUrl}/materias`, datos);
  }

  actualizarMateria(
    id: string,
    datos: Partial<MateriaModel>
  ): Observable<{ ok: boolean; mensaje: string; materia: MateriaModel }> {
    return this.http.put<{
      ok: boolean;
      mensaje: string;
      materia: MateriaModel;
    }>(`${this.baseUrl}/materias/${id}`, datos);
  }

  eliminarMateria(
    id: string
  ): Observable<{ ok: boolean; id: string; mensaje: string }> {
    return this.http.delete<{ ok: boolean; id: string; mensaje: string }>(
      `${this.baseUrl}/materias/${id}`
    );
  }

  // ==========================================================================
  // 3. CRUD DE ESTUDIANTES (MATRÍCULAS)
  // ==========================================================================

  obtenerEstudiantes(filtros?: {
    busqueda?: string;
    cursoId?: string;
    estadoMatricula?: string;
  }): Observable<{ ok: boolean; estudiantes: EstudianteModel[] }> {
    let params = new HttpParams();
    if (filtros?.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }
    if (filtros?.cursoId) {
      params = params.set('cursoId', filtros.cursoId);
    }
    if (filtros?.estadoMatricula) {
      params = params.set('estadoMatricula', filtros.estadoMatricula);
    }

    return this.http.get<{ ok: boolean; estudiantes: EstudianteModel[] }>(
      `${this.baseUrl}/estudiantes`,
      { params }
    );
  }

  crearEstudiante(
    datos: Partial<EstudianteModel>
  ): Observable<{ ok: boolean; mensaje: string; estudiante: EstudianteModel }> {
    return this.http.post<{
      ok: boolean;
      mensaje: string;
      estudiante: EstudianteModel;
    }>(`${this.baseUrl}/estudiantes`, datos);
  }

  actualizarEstudiante(
    id: string,
    datos: Partial<EstudianteModel>
  ): Observable<{ ok: boolean; mensaje: string; estudiante: EstudianteModel }> {
    return this.http.put<{
      ok: boolean;
      mensaje: string;
      estudiante: EstudianteModel;
    }>(`${this.baseUrl}/estudiantes/${id}`, datos);
  }

  eliminarEstudiante(
    id: string
  ): Observable<{ ok: boolean; id: string; mensaje: string }> {
    return this.http.delete<{ ok: boolean; id: string; mensaje: string }>(
      `${this.baseUrl}/estudiantes/${id}`
    );
  }

  // ==========================================================================
  // 4. CRUD DE DOCENTES Y CONFIGURACIÓN DE MATERIAS ENSEÑADAS
  // ==========================================================================

  obtenerMiPerfilDocente(): Observable<{
    ok: boolean;
    docente: DocenteModel;
    cursosDirigidos: CursoModel[];
  }> {
    return this.http.get<{
      ok: boolean;
      docente: DocenteModel;
      cursosDirigidos: CursoModel[];
    }>(`${this.baseUrl}/mi-perfil-docente`);
  }

  obtenerDocentes(filtros?: {
    busqueda?: string;
    cursoId?: string;
    especialidad?: string;
  }): Observable<{ ok: boolean; docentes: DocenteModel[] }> {
    let params = new HttpParams();
    if (filtros?.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }
    if (filtros?.cursoId) {
      params = params.set('cursoId', filtros.cursoId);
    }
    if (filtros?.especialidad) {
      params = params.set('especialidad', filtros.especialidad);
    }

    return this.http.get<{ ok: boolean; docentes: DocenteModel[] }>(
      `${this.baseUrl}/docentes`,
      { params }
    );
  }

  crearDocente(
    datos: Partial<DocenteModel>
  ): Observable<{ ok: boolean; mensaje: string; docente: DocenteModel }> {
    return this.http.post<{
      ok: boolean;
      mensaje: string;
      docente: DocenteModel;
    }>(`${this.baseUrl}/docentes`, datos);
  }

  actualizarDocente(
    id: string,
    datos: Partial<DocenteModel>
  ): Observable<{ ok: boolean; mensaje: string; docente: DocenteModel }> {
    return this.http.put<{
      ok: boolean;
      mensaje: string;
      docente: DocenteModel;
    }>(`${this.baseUrl}/docentes/${id}`, datos);
  }

  eliminarDocente(
    id: string
  ): Observable<{ ok: boolean; id: string; mensaje: string }> {
    return this.http.delete<{ ok: boolean; id: string; mensaje: string }>(
      `${this.baseUrl}/docentes/${id}`
    );
  }

  asignarDocenteCursoMateria(
    docenteId: string,
    datos: {
      cursoId: string;
      materiaId: string;
      intensidadHoraria: number;
      esTitularCurso: boolean;
    }
  ): Observable<{ ok: boolean; mensaje: string; docente: DocenteModel }> {
    return this.http.post<{
      ok: boolean;
      mensaje: string;
      docente: DocenteModel;
    }>(`${this.baseUrl}/docentes/${docenteId}/asignaciones`, datos);
  }

  eliminarAsignacionDocente(
    asignacionId: string
  ): Observable<{ ok: boolean; mensaje: string; docente: DocenteModel }> {
    return this.http.delete<{
      ok: boolean;
      mensaje: string;
      docente: DocenteModel;
    }>(`${this.baseUrl}/asignaciones/${asignacionId}`);
  }

  // ==========================================================================
  // 5. HORARIOS SEMANALES Y CALIFICACIONES / PORTAL ESTUDIANTE
  // ==========================================================================

  obtenerHorarios(filtros?: {
    docenteId?: string;
    cursoId?: string;
    asignacionId?: string;
  }): Observable<{ ok: boolean; horarios: HorarioClaseModel[] }> {
    let params = new HttpParams();
    if (filtros?.docenteId) {
      params = params.set('docenteId', filtros.docenteId);
    }
    if (filtros?.cursoId) {
      params = params.set('cursoId', filtros.cursoId);
    }
    if (filtros?.asignacionId) {
      params = params.set('asignacionId', filtros.asignacionId);
    }

    return this.http.get<{ ok: boolean; horarios: HorarioClaseModel[] }>(
      `${this.baseUrl}/horarios`,
      { params }
    );
  }

  crearHorario(datos: {
    asignacionId?: string;
    cursoId?: string;
    materiaId?: string;
    docenteId?: string;
    intensidadHoraria?: number;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    aula?: string;
  }): Observable<{ ok: boolean; mensaje: string; horario: HorarioClaseModel }> {
    return this.http.post<{
      ok: boolean;
      mensaje: string;
      horario: HorarioClaseModel;
    }>(`${this.baseUrl}/horarios`, datos);
  }

  actualizarHorario(
    horarioId: string,
    datos: Partial<{
      docenteId: string;
      materiaId: string;
      diaSemana: string;
      horaInicio: string;
      horaFin: string;
      aula: string;
    }>
  ): Observable<{ ok: boolean; mensaje: string; horario: HorarioClaseModel }> {
    return this.http.put<{
      ok: boolean;
      mensaje: string;
      horario: HorarioClaseModel;
    }>(`${this.baseUrl}/horarios/${horarioId}`, datos);
  }

  eliminarHorario(
    horarioId: string
  ): Observable<{ ok: boolean; id: string; mensaje: string }> {
    return this.http.delete<{ ok: boolean; id: string; mensaje: string }>(
      `${this.baseUrl}/horarios/${horarioId}`
    );
  }

  obtenerPlanillaCalificaciones(
    cursoId: string,
    materiaId: string
  ): Observable<{ ok: boolean; planilla: CalificacionPlanillaItemModel[] }> {
    const params = new HttpParams()
      .set('cursoId', cursoId)
      .set('materiaId', materiaId);
    return this.http.get<{
      ok: boolean;
      planilla: CalificacionPlanillaItemModel[];
    }>(`${this.baseUrl}/calificaciones`, { params });
  }

  guardarCalificacion(datos: {
    estudianteId: string;
    cursoId: string;
    materiaId: string;
    docenteId?: string | null;
    notaP1?: number | null;
    notaP2?: number | null;
    notaP3?: number | null;
    notaP4?: number | null;
    observacion?: string | null;
  }): Observable<{ ok: boolean; mensaje: string; calificacion: any }> {
    return this.http.post<{ ok: boolean; mensaje: string; calificacion: any }>(
      `${this.baseUrl}/calificaciones`,
      datos
    );
  }

  obtenerPortalEstudiante(
    estudianteId?: string
  ): Observable<PortalEstudianteResponseModel> {
    let params = new HttpParams();
    if (estudianteId) {
      params = params.set('estudianteId', estudianteId);
    }
    return this.http.get<PortalEstudianteResponseModel>(
      `${this.baseUrl}/portal-estudiante`,
      { params }
    );
  }
}
