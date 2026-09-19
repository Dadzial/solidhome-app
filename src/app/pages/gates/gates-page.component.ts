import { Component } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';
import { TranslateModule } from '@ngx-translate/core';
/**
 * Komponent strony reprezentujacy informacje o bramie na posesji (w rozwoju)
 */
@Component({
  selector: 'app-gates',
  imports: [NavbarComponent, LangButtonComponent, ThemeButtonComponent, TranslateModule],
  standalone: true,
  templateUrl: './gates-page.component.html',
  styles: ``,
})
export class GatesPageComponent {}
