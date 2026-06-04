import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import {LangButtonComponent} from '@shared/components/lang-button/lang-button.component';
import { LoginFormComponent } from '@features/auth/components/login-form/login-form.component';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [ThemeButtonComponent, LangButtonComponent, LoginFormComponent,TranslateModule],
  templateUrl: './auth-page.component.html',
  styles: ``,
})
export class AuthPageComponent {}
