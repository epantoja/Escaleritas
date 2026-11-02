import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { HomeComponent } from './home/home.component';
import { RolCodigo } from './models/login.model';

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: {
      pageTitle: 'Panel Principal',
      roles: [
        'ADMIN',
        'DOCENTE',
        'PADRE_ESTUDIANTE',
        'PADRE',
        'ESTUDIANTE',
      ] as RolCodigo[],
    },
  },
  {
    path: 'administracion',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: {
      pageTitle: 'Administración General',
      roles: ['ADMIN'] as RolCodigo[],
      permisos: ['USUARIOS_GESTIONAR'],
    },
  },
  {
    path: 'docentes',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: {
      pageTitle: 'Gestión Académica Docente',
      roles: ['ADMIN', 'DOCENTE'] as RolCodigo[],
      permisos: ['CALIFICACIONES_EDITAR'],
    },
  },
  {
    path: 'portal-padres',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: {
      pageTitle: 'Portal de Padres y Estudiantes',
      roles: ['ADMIN', 'PADRE_ESTUDIANTE', 'PADRE', 'ESTUDIANTE'] as RolCodigo[],
      permisos: ['CALIFICACIONES_VER'],
    },
  },
];

export const pageRouting = RouterModule.forChild(routes);
