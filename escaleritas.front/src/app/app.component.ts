import { Component, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MenuConfigModel } from './components/models/menuConfig.model';

@Component({
  selector: 'app-root',
  template: "<router-outlet></router-outlet>"
})
export class AppComponent {
  title = 'bacataApp.front';
  mostrarAlerta: boolean;

  constructor(
    private dialog: MatDialog,
  )
  {
    let menuconfig = <MenuConfigModel>JSON.parse(localStorage.getItem("menuconfig") as string);

    this.iniciarVariables(menuconfig);

  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if(this.mostrarAlerta) {
      $event.returnValue = true;
    }
  }

  iniciarVariables(config: MenuConfigModel) {
    this.mostrarAlerta = config?.mostrarAlerta;
  }


}
