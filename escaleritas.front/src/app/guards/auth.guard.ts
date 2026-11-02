import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { LoginService } from '../pages/services/login.service';
import { RolCodigo } from '../pages/models/login.model';
import { SnackBarAnnotatedComponent } from '../components/snack-bar-annotated/snack-bar-annotated.component';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private loginService: LoginService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.verificarAcceso(route, state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.verificarAcceso(childRoute, state);
  }

  private verificarAcceso(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // 1. Verificar que el usuario tenga una sesión JWT válida y no expirada
    if (!this.loginService.estaAutenticado()) {
      this.router.navigate(['/login'], { queryParams: { page: state.url } });
      return false;
    }

    // 2. Verificar restricción de Roles en la ruta (ej. data: { roles: ['ADMIN', 'DOCENTE'] })
    const rolesRequeridos = route.data?.['roles'] as RolCodigo[] | undefined;
    if (rolesRequeridos && rolesRequeridos.length > 0) {
      const tieneRolAutorizado = this.loginService.tieneRol(rolesRequeridos);
      if (!tieneRolAutorizado) {
        this.snackBar.openFromComponent(SnackBarAnnotatedComponent, {
          data: {
            mensajes: `Acceso restringido. Este módulo requiere rol: ${rolesRequeridos.join(' o ')}`,
            accion: 'Entendido',
          },
        });
        return this.router.createUrlTree(['/pages/home']);
      }
    }

    // 3. Verificar restricción de Permisos granulares en la ruta (ej. data: { permisos: ['CALIFICACIONES_EDITAR'] })
    const permisosRequeridos = route.data?.['permisos'] as string[] | undefined;
    if (permisosRequeridos && permisosRequeridos.length > 0) {
      const tienePermisos = this.loginService.tienePermisos(permisosRequeridos);
      if (!tienePermisos) {
        this.snackBar.openFromComponent(SnackBarAnnotatedComponent, {
          data: {
            mensajes: 'No cuenta con los permisos necesarios para realizar esta operación.',
            accion: 'Entendido',
          },
        });
        return this.router.createUrlTree(['/pages/home']);
      }
    }

    return true;
  }
}
