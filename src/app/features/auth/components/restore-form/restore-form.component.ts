import { Component } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-restore-form',
  imports: [SvgIconComponent, TranslatePipe],
  standalone: true,
  templateUrl: './restore-form.component.html',
  styles: ``,
})
export class RestoreFormComponent {}
