import { Component } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-lights-energy',
  imports: [SvgIconComponent, TranslatePipe],
  templateUrl: './lights-energy.component.html',
  styles: ``,
})
export class LightsEnergyComponent {}
