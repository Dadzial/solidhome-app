import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth/auth-interceptor';
import { errorInterceptor } from '@core/interceptors/error/error-interceptor';
/**
 * Główna konfiguracja providers dla aplikacji.
 *
 * Konfiguruje:
 * - `provideBrowserGlobalErrorListeners` — globalne nasłuchiwanie nieobsłużonych błędów przeglądarki
 * - `provideRouter` — konfigurację routingu na bazie `routes`
 * - `provideHttpClient` — klienta HTTP wraz z interceptorami `authInterceptor` i `errorInterceptor`
 * - `provideAngularSvgIcon` — moduł do obsługi i cachowania ikon w formacie SVG
 * - `provideTranslateService` — moduł tłumaczeń i18n z loaderem plików `.json` oraz językiem fallback `'pl'`
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAngularSvgIcon(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/translations/',
        suffix: '.json',
      }),
      fallbackLang: 'pl',
      lang: 'pl',
    }),
  ],
};
