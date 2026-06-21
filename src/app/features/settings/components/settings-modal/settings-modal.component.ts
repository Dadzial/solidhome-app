import { Component, output, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {SvgIconComponent} from 'angular-svg-icon';
import { ClickOutsideDirective } from '@shared/directives/click-outside/click-outside.directive';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [TranslateModule,SvgIconComponent, ClickOutsideDirective],
  templateUrl: './settings-modal.component.html',
})
export class SettingsModalComponent {
  public selectedColor = output()
  public isOpen = input(false);
  public closeSettings = output<void>();
}
