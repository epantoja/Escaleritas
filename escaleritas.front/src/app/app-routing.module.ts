import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginGuard } from './guards/login.guard';
import { AuthGuard } from './guards/auth.guard';
import { LayoutComponent } from './components/layout/layout.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard],
    data: { pageTitle: 'Iniciar Sesión - ERP Escaleritas' },
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    data: { pageTitle: 'Home' },
    children: [
      {
        path: '',
        redirectTo: 'pages/home',
        pathMatch: 'full',
      },
      {
        path: 'pages',
        loadChildren: () =>
          import('./pages/pages.module').then((m) => m.PagesModule),
        data: { pageTitle: 'Pages' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'pages/home',
  },
];

export const AppRoutingModule = RouterModule.forRoot(routes, {
  useHash: true,
});
