import { Component } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pressure-display',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './pressure-display.component.html',
  styles: ``,
})
export class PressureDisplayComponent {}
