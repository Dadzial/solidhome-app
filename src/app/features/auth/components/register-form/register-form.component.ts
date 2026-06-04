import { Component, signal } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-register-from',
  imports: [SvgIconComponent, TranslateModule],
  templateUrl: './register-form.component.html',
  styles: ``,
})
export class RegisterFormComponent {
  public authMode = signal<'login' | 'signup'>('signup');

  public setMode(mode: 'login' | 'signup'): void {
    this.authMode.set(mode);
  }
}
