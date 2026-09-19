import { Component } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';
import { TranslateModule } from '@ngx-translate/core';
import { LightsWidgetComponent } from '@features/lights/components/lights-widget/lights-widget.component';

/**
 * Komponent strony sterowania oświetleniem domowym.
 *
 * Wyświetla pełnoekranowy widok z nawigacją oraz widgetem sterowania lampami (`LightsWidgetComponent`),
 * umożliwiającym włączanie, wyłączanie i monitorowanie historii zmian świateł.
 *
 * ### Zasady działania:
 * - Renderuje `LightsWidgetComponent` z kluczem tytułu `'lightsPage.steering'` (dedykowany tytuł dla tej strony).
 * - Strona korzysta z layoutu pełnoekranowego z zablokowanym przewijaniem na desktop (`lg:h-screen lg:overflow-hidden`).
 */
@Component({
  selector: 'app-lights',
  imports: [
    TranslateModule,
    NavbarComponent,
    LangButtonComponent,
    ThemeButtonComponent,
    LightsWidgetComponent,
  ],
  standalone: true,
  templateUrl: './lights-page.component.html',
  styles: ``,
})
export class LightsPageComponent {}
