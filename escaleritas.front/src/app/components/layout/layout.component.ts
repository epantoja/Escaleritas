import { Component, OnInit } from '@angular/core';
import { LoginService } from '../../pages/services/login.service';
import { InfoUsuarioModel } from '../models/infoUsuario.model';
import { RolCodigo } from '../../pages/models/login.model';

export interface MenuItemERP {
  titulo: string;
  subtitulo: string;
  icono: string;
  ruta: string;
  roles: (RolCodigo | string)[];
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  usuario: InfoUsuarioModel | null = null;
  menuAbiertoMovil = false;
  menuUsuarioAbierto = false;

  readonly itemsMenu: MenuItemERP[] = [
    {
      titulo: 'Panel de Inicio',
      subtitulo: 'Resumen según tu perfil',
      icono: 'dashboard',
      ruta: '/pages/home',
      roles: ['ADMIN', 'DOCENTE', 'PADRE_ESTUDIANTE', 'PADRE', 'ESTUDIANTE'],
    },
    {
      titulo: 'Configuración Escolar',
      subtitulo: 'Matrículas, Docentes y Salones',
      icono: 'admin_panel_settings',
      ruta: '/pages/administracion',
      roles: ['ADMIN'],
    },
    {
      titulo: 'Administrar Materias',
      subtitulo: 'Catálogo y Plan de Estudios',
      icono: 'menu_book',
      ruta: '/pages/materias',
      roles: ['ADMIN'],
    },
    {
      titulo: 'Gestión Docente y Horario',
      subtitulo: 'Mis Materias, Horario y Notas',
      icono: 'event_note',
      ruta: '/pages/docentes',
      roles: ['ADMIN', 'DOCENTE'],
    },
    {
      titulo: 'Portal Padre / Estudiante',
      subtitulo: 'Materias, Notas y Horario',
      icono: 'school',
      ruta: '/pages/portal-padres',
      roles: ['ADMIN', 'PADRE_ESTUDIANTE', 'PADRE', 'ESTUDIANTE'],
    },
  ];

  constructor(public loginService: LoginService) {}

  ngOnInit(): void {
    this.usuario = this.loginService.informacionUsuario();
    this.loginService.usuarioActual$.subscribe(() => {
      this.usuario = this.loginService.informacionUsuario();
    });
  }

  get menuFiltradoPorRol(): MenuItemERP[] {
    const rolActual = this.usuario?.rol || '';
    return this.itemsMenu.filter((item) => item.roles.includes(rolActual));
  }

  cerrarSesion(): void {
    this.loginService.logout();
  }
}
