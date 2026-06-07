import { Component, output , inject } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import {RegisterService} from '@features/auth/services/register/register.service';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [SvgIconComponent, TranslateModule],
  templateUrl: './register-form.component.html',
  styles: ``,
})
export class RegisterFormComponent {
  public switchToLogin = output<void>();
  private registerService = inject(RegisterService);
}
