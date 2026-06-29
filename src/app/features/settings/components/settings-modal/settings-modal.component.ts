import { Component, output, input, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {SvgIconComponent} from 'angular-svg-icon';
import { ClickOutsideDirective } from '@shared/directives/click-outside/click-outside.directive';
import { AccentColorService } from '@core/services/accent-color/accent-color.service';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [TranslateModule, SvgIconComponent, ClickOutsideDirective],
  templateUrl: './settings-modal.component.html',
})
export class SettingsModalComponent {
  public accentColorService = inject(AccentColorService)
  public isOpen = input(false);
  public closeSettings = output<void>();
  public selectedColor = output();
}
