import { Component } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';
import { TranslateModule } from '@ngx-translate/core';
import { AirWidgetComponent } from '@features/air/components/air-widget/air-widget.component';

/**
 * Komponent strony jakości powietrza.
 *
 * Wyświetla pełnoekranowy widok z nawigacją oraz widgetem jakości powietrza (`AirWidgetComponent`),
 * prezentującym parametry odczytane z czujnika środowiskowego.
 *
 * ### Zasady działania:
 * - Renderuje `AirWidgetComponent`
 * - Strona korzysta z layoutu pełnoekranowego z zablokowanym przewijaniem na desktop (`lg:h-screen lg:overflow-hidden`).
 */
@Component({
  selector: 'app-air',
  imports: [
    NavbarComponent,
    LangButtonComponent,
    ThemeButtonComponent,
    TranslateModule,
    AirWidgetComponent,
  ],
  standalone: true,
  templateUrl: './air-page.component.html',
  styles: ``,
})
export class AirPageComponent {}

