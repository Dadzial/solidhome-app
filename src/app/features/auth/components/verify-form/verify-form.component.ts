import { Component ,output } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import {TranslateModule} from '@ngx-translate/core';


@Component({
  selector: 'app-verify-form',
  imports: [TranslateModule,SvgIconComponent],
  standalone: true,
  templateUrl: './verify-form.component.html',
  styles: ``,
})
export class VerifyFormComponent {
  public switchToLogin = output<void>();
}
