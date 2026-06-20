import { Component , inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';

@Component({
  selector: 'app-navbar',
  imports: [TranslateModule, SvgIconComponent, LangButtonComponent, ThemeButtonComponent],
  templateUrl: './navbar.component.html',
  styles: ``,
})
export class NavbarComponent {}
