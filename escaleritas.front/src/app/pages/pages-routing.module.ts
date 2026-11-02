import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { HomeComponent } from './home/home.component';
import { AdministracionComponent } from './administracion/administracion.component';
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
    component: AdministracionComponent,
    canActivate: [AuthGuard],
    data: {
      pageTitle: 'Directorio Escolar y Estructura Académica',
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
    path: 'docentes',
    component: AdministracionComponent,
    canActivate: [AuthGuard],
    data: {
      pageTitle: 'Gestión Académica Docente',
      roles: ['ADMIN', 'DOCENTE'] as RolCodigo[],
    },
  },
  {
    path: 'portal-padres',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: {
      pageTitle: 'Portal de Padres y Estudiantes',
      roles: ['ADMIN', 'PADRE_ESTUDIANTE', 'PADRE', 'ESTUDIANTE'] as RolCodigo[],
    },
  },
];

export const pageRouting = RouterModule.forChild(routes);
