import { Component } from '@angular/core';
import { TranslateModule} from '@ngx-translate/core';
import {SvgIconComponent} from 'angular-svg-icon';

@Component({
  selector: 'app-lights-schedule',
  imports: [
    TranslateModule,
    SvgIconComponent
  ],
  templateUrl: './lights-schedule.component.html',
  styles: ``,
})
export class LightsScheduleComponent {}
