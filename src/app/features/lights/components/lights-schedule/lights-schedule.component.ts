import { Component , signal } from '@angular/core';
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
export class LightsScheduleComponent {
  public enableAddSchedule = signal(false);

  public toggleAddSchedule() : void {
    this.enableAddSchedule.update((value) => !value);
  }
}
