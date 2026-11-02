import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, registerLocaleData } from '@angular/common';
import { LayoutComponent } from './components/layout/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { AppMaterialModule } from './app-material.module';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import localeEsCo from '@angular/common/locales/es-CO';
import { LoginService } from './pages/services/login.service';
import { LoginGuard } from './guards/login.guard';
import { AuthGuard } from './guards/auth.guard';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { JwtInterceptor } from './helpers/jtw.Interceptor';
import { ErrorInterceptor } from './helpers/error.interceptor';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { LoadingService } from './pages/services/loading.service';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipDefaultOptions,
} from '@angular/material/tooltip';

registerLocaleData(localeEsCo);

export function tokenGetter() {
  return localStorage.getItem(environment.token);
}

export const TooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 10,
  hideDelay: 10,
  touchendHideDelay: 10,
  position: 'above',
};

@NgModule({
  declarations: [AppComponent, LayoutComponent, LoginComponent],
  imports: [
    HttpClientModule,
    AppMaterialModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        headerName: 'Authorization',
        authScheme: 'Bearer ',
        skipWhenExpired: true,
      },
    }),
  ],
  exports: [],
  providers: [
    { provide: LOCALE_ID, useValue: 'es-Co' },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'es-Co' },
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: { duration: 8000, horizontalPosition: 'right' },
    },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'COP' },
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true, displayDefaultIndicatorType: false },
    },
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: TooltipDefaults },
    AuthGuard,
    LoginGuard,
    LoginService,
    LoadingService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
