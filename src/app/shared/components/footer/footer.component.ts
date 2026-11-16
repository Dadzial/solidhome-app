import { Component, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';
import { HardwareStatusService } from '@core/services/hardware-status/hardware-status.service';

/**
 * Komponent stopki aplikacji.
 *
 * ### Zasady działania:
 * - Wyświetla przyciski zmiany języka i motywu.
 * - Udostępnia komunikat o statusie sterownika (online/offline) w zależności od stanu połączenia z płytką.
 * - Przekazuje flagę `showStatus` jako input, aby umożliwić ukrycie komunikatu na stronie logowania).
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslateModule, ThemeButtonComponent, LangButtonComponent],
  templateUrl: './footer.component.html',
  styles: ``,
})
export class FooterComponent {
  /** Serwis sprawdzający stan połączenia z płytką */
  private hardwareStatus = inject(HardwareStatusService);

  /** Sygnał określający stan płytki */
  public isBoardOnline = this.hardwareStatus.isBoardOnline;

  /** Czy komunikat o statusie ma być dozwolony do wyświetlenia (domyślnie true) */
  public showStatus = input<boolean>(true);
}
