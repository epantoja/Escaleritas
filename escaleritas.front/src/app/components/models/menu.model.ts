export interface MenuModel {
  label?:              string;
  icon?:               string;
  router?:             string;
  mostrarSubMenu?:     boolean;
  subMenu:            MenuModel[]
}
