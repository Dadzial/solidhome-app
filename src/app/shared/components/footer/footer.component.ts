import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';

/**
 * Komponent stopki aplikacji.
 *
 * ### Zasady działania:
 * - Wyświetla przyciski zmiany języka i motywu.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslateModule, ThemeButtonComponent, LangButtonComponent],
  templateUrl: './footer.component.html',
  styles: ``,
})
export class FooterComponent {}
