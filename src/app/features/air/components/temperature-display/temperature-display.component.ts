import { Component } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-temperature-display',
  imports: [SvgIconComponent, TranslatePipe],
  standalone: true,
  templateUrl: './temperature-display.component.html',
  styles: ``,
})
export class TemperatureDisplayComponent {}
