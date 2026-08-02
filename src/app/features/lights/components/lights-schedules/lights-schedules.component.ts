import { Component } from '@angular/core';
import {TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-lights-schedules',
  imports: [SvgIconComponent,TranslateModule],
  standalone: true,
  templateUrl: './lights-schedules.component.html',
  styles: ``,
})
export class LightsSchedulesComponent {}
