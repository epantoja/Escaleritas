import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { LoginService } from '../pages/services/login.service';

@Injectable({
  providedIn: 'root',
})
export class LoginGuard implements CanActivate {
  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Si el usuario NO está autenticado, permitir acceso a la pantalla de login
    if (!this.loginService.estaAutenticado()) {
      return true;
    }

    // Si ya tiene sesión activa, redirigir al panel principal
    return this.router.createUrlTree(['/pages/home']);
  }
}
