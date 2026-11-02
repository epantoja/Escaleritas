import { MatDrawerMode } from "@angular/material/sidenav";

export interface MenuConfigModel {
  posicionMenu:         string;
  aparienciaMenu:       MatDrawerMode;
  backgroundMenu:       boolean;
  formatoHora:          string;
  mostrarHora:          boolean;
  mostrarUsuario:       boolean;
  mostrarToolbar:       boolean;
  mostrarCodNomApe:     string;
  porcentajeUtilidad?:  number | undefined;
  nombreNegocio:        string;
  mostrarAlerta:        boolean;
}
