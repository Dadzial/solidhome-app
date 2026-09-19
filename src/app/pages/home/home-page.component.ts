import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LoginService } from '@features/auth/services/login/login.service';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';
import { LightsWidgetComponent } from '@features/lights/components/lights-widget/lights-widget.component';
/**
 * Komponent strony głównej aplikacji po zalogowaniu.
 *
 * Wyświetla spersonalizowane powitanie z nazwą zalogowanego użytkownika
 * oraz widgety z podglądem stanu urządzeń domowych (aktualnie widget oświetlenia).
 *
 * ### Zasady działania:
 * - Pobiera nazwę zalogowanego użytkownika z sygnału `loginService.userName`
 *   i wyświetla ją w powitaniu w nagłówku strony.
 * - Renderuje `LightsWidgetComponent` w siatce widgetów.
 * - Strona korzysta z layoutu pełnoekranowego z zablokowanym przewijaniem na desktop (`lg:h-screen lg:overflow-hidden`).
 */
@Component({
  selector: 'app-home',
  imports: [
    TranslateModule,
    NavbarComponent,
    LangButtonComponent,
    ThemeButtonComponent,
    LightsWidgetComponent,
  ],
  standalone: true,
  templateUrl: './home-page.component.html',
  styles: ``,
})
export class HomePageComponent {
  /** Serwis logowania — dostępny publiczne dla szablonu w celu wyświetlenia nazwy zalogowanego użytkownika. */
  public loginService = inject(LoginService);
}
