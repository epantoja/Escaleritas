import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  AuthResponseModel,
  LoginModel,
  RegisterModel,
  RolCodigo,
  RolModel,
  UsuarioAuthModel,
} from '../models/login.model';
import { InfoUsuarioModel } from '../../components/models/infoUsuario.model';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly baseUrl = environment.apiUrl;
  private readonly tokenKey = environment.token;
  private readonly userKey = 'Escaleritas_Usuario';
  private readonly jwtHelper = new JwtHelperService();

  private usuarioSubject = new BehaviorSubject<UsuarioAuthModel | null>(
    this.obtenerUsuarioLocal()
  );
  public usuarioActual$ = this.usuarioSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * POST /api/auth/login
   * Autentica al usuario y almacena el JWT en localStorage
   */
  login(credenciales: LoginModel): Observable<AuthResponseModel> {
    return this.http
      .post<AuthResponseModel>(`${this.baseUrl}api/auth/login`, credenciales)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  /**
   * POST /api/auth/register
   * Registra un nuevo usuario en el ERP Educativo y almacena su sesión
   */
  register(datos: RegisterModel): Observable<AuthResponseModel> {
    return this.http
      .post<AuthResponseModel>(`${this.baseUrl}api/auth/register`, datos)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  /**
   * GET /api/auth/me
   * Obtiene el perfil actualizado del usuario autenticado
   */
  obtenerPerfil(): Observable<{ ok: boolean; usuario: UsuarioAuthModel }> {
    return this.http.get<{ ok: boolean; usuario: UsuarioAuthModel }>(
      `${this.baseUrl}api/auth/me`
    );
  }

  /**
   * GET /api/auth/roles
   * Consulta el catálogo de roles disponibles
   */
  obtenerRoles(): Observable<{ ok: boolean; roles: RolModel[] }> {
    return this.http.get<{ ok: boolean; roles: RolModel[] }>(
      `${this.baseUrl}api/auth/roles`
    );
  }

  /**
   * Guarda el token JWT y la información del usuario en localStorage
   */
  guardarSesion(respuesta: AuthResponseModel): void {
    if (respuesta?.token) {
      localStorage.setItem(this.tokenKey, respuesta.token);
    }
    if (respuesta?.usuario) {
      localStorage.setItem(this.userKey, JSON.stringify(respuesta.usuario));
      this.usuarioSubject.next(respuesta.usuario);
    }
  }

  /**
   * Cierra la sesión actual y redirige al login
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.usuarioSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Retorna el token JWT almacenado
   */
  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Verifica si existe una sesión válida y no expirada (true = autenticado)
   */
  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    if (!token) {
      return false;
    }
    try {
      return !this.jwtHelper.isTokenExpired(token);
    } catch {
      return false;
    }
  }

  /**
   * Método de compatibilidad: retorna true si el token ha expirado o no existe
   */
  sesionIniciada(): boolean {
    return !this.estaAutenticado();
  }

  /**
   * Decodifica y retorna el payload tipado del JWT
   */
  informacionUsuario(): InfoUsuarioModel | null {
    const token = this.obtenerToken();
    if (!token) {
      return null;
    }
    try {
      return this.jwtHelper.decodeToken<InfoUsuarioModel>(token);
    } catch {
      return null;
    }
  }

  /**
   * Verifica si el usuario autenticado posee alguno de los roles indicados
   */
  tieneRol(rolesPermitidos: (RolCodigo | string)[]): boolean {
    if (!rolesPermitidos || rolesPermitidos.length === 0) {
      return true;
    }
    const info = this.informacionUsuario();
    if (!info?.rol) {
      return false;
    }
    return rolesPermitidos.includes(info.rol);
  }

  /**
   * Verifica si el usuario posee todos los permisos especificados
   */
  tienePermisos(permisosRequeridos: string[]): boolean {
    if (!permisosRequeridos || permisosRequeridos.length === 0) {
      return true;
    }
    const info = this.informacionUsuario();
    const permisosUsuario = info?.permisos || [];
    return permisosRequeridos.every((p) => permisosUsuario.includes(p));
  }

  private obtenerUsuarioLocal(): UsuarioAuthModel | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UsuarioAuthModel;
    } catch {
      return null;
    }
  }
}
