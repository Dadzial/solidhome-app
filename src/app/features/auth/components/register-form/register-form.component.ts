import { Component, output } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [SvgIconComponent, TranslateModule],
  templateUrl: './register-form.component.html',
  styles: ``,
})
export class RegisterFormComponent {
  public switchToLogin = output<void>();
}
