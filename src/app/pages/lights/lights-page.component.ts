import { Component } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-lights',
  imports: [
    NavbarComponent,
    LangButtonComponent,
    ThemeButtonComponent,
    TranslateModule,
  ],
  standalone: true,
  templateUrl: './lights-page.component.html',
  styles: ``,
})
export class LightsPageComponent {}
