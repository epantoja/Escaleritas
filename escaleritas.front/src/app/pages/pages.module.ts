import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { AdministracionComponent } from './administracion/administracion.component';
import { pageRouting } from './pages-routing.module';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppMaterialModule } from '../app-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SnackBarAnnotatedComponent } from '../components/snack-bar-annotated/snack-bar-annotated.component';
import { QRCodeModule } from 'angularx-qrcode';
import { AuthGuard } from '../guards/auth.guard';
import { AcademicoService } from './services/academico.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  providers: [
    AuthGuard,
    AcademicoService,
    provideNgxMask(),
    CurrencyPipe,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    pageRouting,
    AppMaterialModule,
    MatIconModule,
    QRCodeModule,
    NgxMaskDirective,
  ],
  declarations: [
    HomeComponent,
    AdministracionComponent,
    SnackBarAnnotatedComponent,
  ],
  exports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PagesModule {}
