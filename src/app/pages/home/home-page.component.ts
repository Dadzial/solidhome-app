import { Component , inject } from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {LoginService} from '@features/auth/services/login/login.service';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';

@Component({
  selector: 'app-home',
  imports: [TranslateModule,NavbarComponent, LangButtonComponent, ThemeButtonComponent],
  standalone: true,
  templateUrl: './home-page.component.html',
  styles: ``,
})
export class HomePageComponent {
  public loginService = inject(LoginService);
}
