import { Component, signal } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-login-form',
  standalone:true,
  imports: [SvgIconComponent],
  templateUrl: './login-form.component.html',
  styles: ``,
})
export class LoginFormComponent {
  public authMode = signal<'login' | 'signup'>('login');
  public rememberMe = signal<boolean>(false);

  public setMode(mode: 'login' | 'signup'): void {
    this.authMode.set(mode);
  }

  public toggleRememberMe(): void {
    this.rememberMe.set(!this.rememberMe());
  }
}
