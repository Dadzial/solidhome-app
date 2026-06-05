import { Component, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [SvgIconComponent, TranslateModule],
  templateUrl: './login-form.component.html',
  styles: ``,
})
export class LoginFormComponent {
  public switchToSignup = output<void>();
  public rememberMe = signal<boolean>(false);

  public toggleRememberMe(): void {
    this.rememberMe.set(!this.rememberMe());
  }
}
