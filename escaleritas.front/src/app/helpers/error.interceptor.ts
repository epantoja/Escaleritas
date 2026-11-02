import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarAnnotatedComponent } from '../components/snack-bar-annotated/snack-bar-annotated.component';
import { environment } from 'src/environments/environment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        const esRutaLogin =
          request.url.includes('/api/auth/login') ||
          request.url.includes('/login');

        // Si el backend responde 401 (Token inválido o expirado) fuera del login, cerrar sesión
        if (err.status === 401 && !esRutaLogin) {
          localStorage.removeItem(environment.token);
          localStorage.removeItem('Escaleritas_Usuario');
          this.router.navigate(['/login']);
        }

        const mensajeError =
          err.error?.error ||
          (Array.isArray(err.error?.details)
            ? err.error.details.join(', ')
            : null) ||
          err.message ||
          'Ocurrió un error al comunicarse con el servidor';

        this.snackBar.openFromComponent(SnackBarAnnotatedComponent, {
          data: {
            mensajes: mensajeError,
            accion: 'Aceptar',
          },
        });

        return throwError(() => err);
      })
    );
  }
}
