import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CursoModel,
  DocenteModel,
  EstudianteModel,
  MateriaModel,
} from '../models/academico.model';

@Injectable({
  providedIn: 'root',
})
export class AcademicoService {
  private readonly baseUrl = `${environment.apiUrl}api/academico`;

  constructor(private http: HttpClient) {}

  // ==========================================================================
  // 1. CURSOS Y MATERIAS (Jardín a 5° de Primaria)
  // ==========================================================================

  obtenerCursos(): Observable<{ ok: boolean; cursos: CursoModel[] }> {
    return this.http.get<{ ok: boolean; cursos: CursoModel[] }>(
      `${this.baseUrl}/cursos`
    );
  }

  actualizarCurso(
    id: string,
    datos: Partial<CursoModel>
  ): Observable<{ ok: boolean; mensaje: string; curso: CursoModel }> {
    return this.http.put<{ ok: boolean; mensaje: string; curso: CursoModel }>(
      `${this.baseUrl}/cursos/${id}`,
      datos
    );
  }

  obtenerMaterias(): Observable<{ ok: boolean; materias: MateriaModel[] }> {
    return this.http.get<{ ok: boolean; materias: MateriaModel[] }>(
      `${this.baseUrl}/materias`
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

  // ==========================================================================
  // 2. CRUD DE ESTUDIANTES (MATRÍCULAS)
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
  // 3. CRUD DE DOCENTES Y ASIGNACIÓN DE CURSOS/MATERIAS (N:M)
  // ==========================================================================

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
}

