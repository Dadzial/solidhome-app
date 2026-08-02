import { Component } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';
import { TranslateModule } from '@ngx-translate/core';
import { LightsWidgetComponent } from '@features/lights/components/lights-widget/lights-widget.component';
import {LightsScenesComponent} from '@features/lights/components/lights-scenes/lights-scenes.component';
import {LightsSchedulesComponent} from '@features/lights/components/lights-schedules/lights-schedules.component';
import {LightsEnergyComponent} from '@features/lights/components/lights-energy/lights-energy.component';

@Component({
  selector: 'app-lights',
  imports: [
    TranslateModule,
    NavbarComponent,
    LangButtonComponent,
    ThemeButtonComponent,
    LightsWidgetComponent,
    LightsScenesComponent,
    LightsEnergyComponent,
    LightsSchedulesComponent
  ],
  standalone: true,
  templateUrl: './lights-page.component.html',
  styles: ``,
})
export class LightsPageComponent {}
