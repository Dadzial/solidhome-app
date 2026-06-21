import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { provideTranslateService} from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
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
