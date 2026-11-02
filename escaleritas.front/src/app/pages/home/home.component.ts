import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoginService } from '../services/login.service';
import { InfoUsuarioModel } from '../../components/models/infoUsuario.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  usuario: InfoUsuarioModel | null = null;

  constructor(public loginService: LoginService) {}

  ngOnInit(): void {
    this.usuario = this.loginService.informacionUsuario();
  }

  cerrarSesion(): void {
    this.loginService.logout();
  }

  ngOnDestroy(): void {}
}
