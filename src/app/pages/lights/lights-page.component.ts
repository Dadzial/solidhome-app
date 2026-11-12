import { Component, inject, computed } from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ThemeButtonComponent } from '@shared/components/theme-button/theme-button.component';
import { LangButtonComponent } from '@shared/components/lang-button/lang-button.component';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorOverlayComponent } from '@shared/components/error-overlay/error-overlay.component';
import { LightsWidgetComponent } from '@features/lights/components/lights-widget/lights-widget.component';
import { LightsScheduleComponent } from '@features/lights/components/lights-schedule/lights-schedule.component';
import { LightsScenesComponent } from '@features/lights/components/lights-scenes/lights-scenes.component';
import { LightsEnergyComponent } from '@features/lights/components/lights-energy/lights-energy.component';
import { LightsControlService } from '@features/lights/services/lights-control/lights-control.service';
import { LightsScheduleService } from '@features/lights/services/lights-schedule/lights-schedule.service';
import { LightsEnergyService } from '@features/lights/services/lights-energy/lights-energy.service';
import { LightsScenesService } from '@features/lights/services/lights-scenes/lights-scenes.service';

/**
 * Komponent strony sterowania oświetleniem domowym.
 *
 * Wyświetla pełnoekranowy widok z nawigacją oraz widgetami sterowania lampami,
 * harmonogramu, scen oświetleniowych oraz monitorowania zużycia energii.
 *
 * ### Zasady działania:
 * - W przypadku globalnej awarii (gdy wszystkie 4 moduły zgłoszą błąd), wyświetla pojedynczą
 *   nakładkę błędu na poziomie całej siatki strony i ukrywa lokalne nakładki na kafelkach.
 * - Umożliwia ponowienie zapytań dla wszystkich modułów naraz jednym przyciskiem.
 */
@Component({
  selector: 'app-lights',
  imports: [
    TranslateModule,
    NavbarComponent,
    LangButtonComponent,
    ThemeButtonComponent,
    LightsWidgetComponent,
    LightsScheduleComponent,
    LightsScenesComponent,
    LightsEnergyComponent,
    ErrorOverlayComponent,
  ],
  standalone: true,
  templateUrl: './lights-page.component.html',
  styles: ``,
})
export class LightsPageComponent {
  /** Serwis kontroli oświetlenia */
  public readonly lightsControlService = inject(LightsControlService);

  /** Serwis harmonogramu oświetlenia */
  public readonly lightsScheduleService = inject(LightsScheduleService);

  /** Serwis statystyk energii oświetlenia */
  public readonly lightsEnergyService = inject(LightsEnergyService);

  /** Serwis scen oświetlenia */
  public readonly lightsScenesService = inject(LightsScenesService);

  /**
   * Sygnał obliczeniowy weryfikujący, czy wszystkie 4 komponenty uległy awarii (np. całkowity brak połączenia z serwerem).
   */
  public readonly allFailed = computed(
    () =>
      this.lightsControlService.hasError() &&
      this.lightsScheduleService.hasError() &&
      this.lightsEnergyService.hasError() &&
      this.lightsScenesService.hasError(),
  );

  /**
   * Klucz translacji błędu dla globalnej nakładki poziomu strony.
   */
  public readonly globalErrorMessage = computed(
    () =>
      this.lightsControlService.errorMessage() ??
      this.lightsScheduleService.errorMessage() ??
      this.lightsEnergyService.errorMessage() ??
      this.lightsScenesService.errorMessage() ??
      'apiErrors.server',
  );

  /**
   * Ponawia pobranie danych we wszystkich modułach oświetlenia jednocześnie.
   *
   * @returns {void}
   */
  public retryAll(): void {
    this.lightsControlService.loadLights();
    this.lightsScheduleService.loadRules();
    this.lightsEnergyService.loadEnergyStats();
    this.lightsScenesService.loadScenes();
  }
}
