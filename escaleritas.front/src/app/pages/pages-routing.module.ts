import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { HomeComponent } from './home/home.component';
import { AdministracionComponent } from './administracion/administracion.component';
import { MateriasComponent } from './materias/materias.component';
import { DocentesPanelComponent } from './docentes-panel/docentes-panel.component';
import { PortalEstudianteComponent } from './portal-estudiante/portal-estudiante.component';
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
      pageTitle: 'Configuración Escolar (Exclusivo Admin)',
      roles: ['ADMIN'] as RolCodigo[],
    },
  },
  {
    path: 'materias',
    component: MateriasComponent,
    canActivate: [AuthGuard],
    data: {
      pageTitle: 'Administración de Materias (Exclusivo Admin)',
      roles: ['ADMIN'] as RolCodigo[],
    },
  },
  {
    path: 'docentes',
    component: DocentesPanelComponent,
    canActivate: [AuthGuard],
    data: {
      pageTitle: 'Gestión Docente: Mis Materias, Horario y Notas',
      roles: ['ADMIN', 'DOCENTE'] as RolCodigo[],
    },
  },
  {
    path: 'portal-padres',
    component: PortalEstudianteComponent,
    canActivate: [AuthGuard],
    data: {
      pageTitle: 'Portal de Padres y Estudiantes: Materias, Notas y Horario',
      roles: ['ADMIN', 'PADRE_ESTUDIANTE', 'PADRE', 'ESTUDIANTE'] as RolCodigo[],
    },
  },
];

export const pageRouting = RouterModule.forChild(routes);
