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
    if (!this.loginService.estaAutenticado()) {
      this.router.navigate(['/login'], { queryParams: { page: state.url } });
      return false;
    }

    const rolesRequeridos = route.data?.['roles'] as RolCodigo[] | undefined;
    if (rolesRequeridos && rolesRequeridos.length > 0) {
      const tieneRolAutorizado = this.loginService.tieneRol(rolesRequeridos);
      if (!tieneRolAutorizado) {
        this.snackBar.openFromComponent(SnackBarAnnotatedComponent, {
          data: {
            mensajes: `Acceso restringido. Solo el perfil autorizado (${rolesRequeridos.join(', ')}) puede ingresar a esta sección.`,
            accion: 'Entendido',
          },
        });

        const info = this.loginService.informacionUsuario();
        if (info?.rol === 'DOCENTE') {
          return this.router.createUrlTree(['/pages/docentes']);
        }
        if (
          info?.rol === 'PADRE_ESTUDIANTE' ||
          info?.rol === 'PADRE' ||
          info?.rol === 'ESTUDIANTE'
        ) {
          return this.router.createUrlTree(['/pages/portal-padres']);
        }
        return this.router.createUrlTree(['/pages/home']);
      }
    }

    return true;
  }
}
