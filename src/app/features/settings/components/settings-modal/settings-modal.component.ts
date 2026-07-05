import { Component, output, input, inject, signal } from '@angular/core';
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

  public expandedSection = signal<'username' | 'email' | 'password' | null>(null);

  toggleSection(section: 'username' | 'email' | 'password') {
    this.expandedSection.update(current => current === section ? null : section);
  }
}
