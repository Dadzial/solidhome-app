import { Component, inject, signal, input, computed, OnInit, OnDestroy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { NgClass } from '@angular/common';
import { LightsControlService } from '@features/lights/services/lights-control/lights-control.service';
import { LightsHistoryService } from '@features/lights/services/lights-history/lights-history.service';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { Light, LightHistory } from '@features/lights/models/lights.models';
/**
 * Słownik mapujący identyfikatory lamp (klucze API) na klucze i18n tłumaczeń nazw pomieszczeń.
 *
 * Używany podczas mapowania danych historii z API na model widoku `LightHistory`.
 */
const ROOMS_NAMES_TRANSLATIONS: Record<string, string> = {
  living_room: 'home.lightsWidget.rooms.livingRoom',
  kitchen: 'home.lightsWidget.rooms.kitchen',
  boiler_room: 'home.lightsWidget.rooms.boilerRoom',
  bathroom: 'home.lightsWidget.rooms.bathroom',
  hallway: 'home.lightsWidget.rooms.hallway',
  garage: 'home.lightsWidget.rooms.garage',
};
/**
 * Komponent widgetu sterowania oświetleniem domowym.
 *
 * Wyświetla interaktywną mapę SVG z rozmieszczonymi lampami oraz listę historii
 * ostatnich zdarzeń włączeń i wyłączeń. Umożliwia sterowanie pojedynczymi lampami
 * lub wszystkimi naraz.
 *
 * ### Zasady działania:
 * - Przy inicjalizacji (`ngOnInit`) pobiera aktualny stan lamp i historię zdarzeń z API.
 * - Optymistycznie aktualizuje stan lamp w UI przed potwierdzeniem przez API — w razie błędu cofa zmianę i ustawia `hasError`.
 * - Przy przełączeniu wszystkich lamp używa `forkJoin` do równoległego wysyłania żądań do API.
 * - Przy zniszczeniu komponentu (`ngOnDestroy`) zamyka wszystkie subskrypcje przez `Subject<void>`.
 */
@Component({
  selector: 'app-lights-widget',
  imports: [TranslateModule, SvgIconComponent, NgClass],
  standalone: true,
  templateUrl: './lights-widget.component.html',
  styles: ``,
})
export class LightsWidgetComponent implements OnInit, OnDestroy {
  /** Serwis obsługujący pobieranie i aktualizację stanu lamp. */
  private lightsControlService = inject(LightsControlService);
  /** Serwis obsługujący pobieranie i resetowanie historii zmian świateł. */
  private lightsHistoryService = inject(LightsHistoryService);
  /** Subject używany do zamknięcia wszystkich subskrypcji przy zniszczeniu komponentu. */
  private destroy$ = new Subject<void>();
  /**
   * Klucz i18n tytułu widgetu wyświetlanego w nagłówku.
   * @default 'home.lightsWidget.title'
   */
  public titleKey = input<string>('home.lightsWidget.title');
  /**
   * Sygnał przechowujący listę lamp z ich pozycjami na mapie SVG i aktualnym stanem.
   * Domyślne pozycje odpowiadają rozkładowi pomieszczeń na obrazie `home_preview.png`.
   * @type {signal}
   */
  public readonly lights = signal<Light[]>([
    { id: 'living_room', y: 500, x: 1248, on: false },
    { id: 'kitchen', y: 780, x: 1110, on: false },
    { id: 'boiler_room', y: 290, x: 868, on: false },
    { id: 'bathroom', y: 180, x: 970, on: false },
    { id: 'hallway', y: 590, x: 890, on: false },
    { id: 'garage', y: 450, x: 655, on: false },
  ]);
  /**
   * Sygnał przechowujący przetworzone wpisy historii zmian świateł do wyświetlenia w widoku.
   * @type {signal}
   */
  public readonly history = signal<LightHistory[]>([]);
  /**
   * Sygnał informujący o błędzie komunikacji z API (np. nieudane pobranie lub aktualizacja stanu lamp).
   * @type {signal}
   */
  public hasError = signal<boolean>(false);
  /**
   * Sygnał obliczeniowy zwracający `true`, gdy wszystkie lampy są włączone.
   * Używany do sterowania stanem globalnego przełącznika i jego etykietą.
   * @type {computed}
   */
  public allLightsOn = computed(() => {
    const currentLights = this.lights();
    return currentLights.length > 0 && currentLights.every((l) => l.on);
  });
  /**
   * Inicjalizuje komponent — pobiera aktualny stan lamp i historię zdarzeń z API.
   *
   * W przypadku błędu pobrania stanu lamp ustawia sygnał `hasError` na `true`.
   *
   * @returns {void}
   */
  public ngOnInit() {
    this.lightsControlService
      .getStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.lights.update((lights) =>
            lights.map((light) => {
              const found = items.find((item) => item.name === light.id);
              return found ? { ...light, on: found.state === 1 } : light;
            }),
          );
          this.hasError.set(false);
        },
        error: (err) => {
          console.error('Failed to load initial lights status', err);
          this.hasError.set(true);
        },
      });
    this.loadHistory();
  }
  /**
   * Pobiera historię zmian świateł z API (ostatnie 20 wpisów) i mapuje ją na model widoku `LightHistory`.
   *
   * Nazwy pomieszczeń są tłumaczone za pomocą słownika `ROOMS_NAMES_TRANSLATIONS`.
   * Czas zdarzenia jest formatowany do formatu `HH:MM`.
   * Gdy użytkownik jest nieznany, wyświetlana jest wartość domyślna `'System'`.
   *
   * @returns {void}
   */
  public loadHistory(): void {
    this.lightsHistoryService
      .getHistory(20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          const mapped: LightHistory[] = items.map((item) => ({
            id: item._id,
            name: ROOMS_NAMES_TRANSLATIONS[item.name] || item.name,
            action: item.state === 1 ? 'ON' : 'OFF',
            time: new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            user: item.userId?.userName || 'System',
          }));
          this.history.set(mapped);
        },
        error: (err) => {
          console.error('Failed to load lights history', err);
        },
      });
  }
  /**
   * Usuwa całą historię zmian świateł przez API i czyści lokalny sygnał `history`.
   *
   * @returns {void}
   */
  public clearHistory(): void {
    this.lightsHistoryService
      .resetHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.history.set([]);
        },
        error: (err) => {
          console.error('Failed to reset lights history', err);
        },
      });
  }
  /**
   * Przełącza stan pojedynczej lampy (optimistic update).
   *
   * Natychmiast aktualizuje sygnał `lights` w UI, następnie wysyła żądanie do API.
   * W razie błędu cofa zmianę stanu do poprzedniej wartości i ustawia `hasError`.
   * Po sukcesie odświeża historię.
   *
   * @param {string} id Identyfikator lampy do przełączenia (np. `'living_room'`).
   * @returns {void}
   */
  public toggleLight(id: string): void {
    this.lights.update((lights) => lights.map((l) => (l.id === id ? { ...l, on: !l.on } : l)));
    const newState = this.lights().find((l) => l.id === id)?.on ?? false;

    this.lightsControlService
      .updateStatus(id, newState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.hasError.set(false);
          this.loadHistory();
        },
        error: (err) => {
          console.error('Failed to update light status', err);
          this.lights.update((lights) =>
            lights.map((l) => (l.id === id ? { ...l, on: !newState } : l)),
          );
          this.hasError.set(true);
        },
      });
  }
  /**
   * Przełącza stan wszystkich lamp jednocześnie (optimistic update z `forkJoin`).
   *
   * Docelowy stan jest odwrotnością aktualnego stanu `allLightsOn`.
   * Natychmiast aktualizuje wszystkie lampy w UI, następnie wysyła równoległe żądania do API przez `forkJoin`.
   * W razie błędu cofa wszystkie lampy do poprzednich stanów i ustawia `hasError`.
   * Po sukcesie odświeża historię.
   *
   * @returns {void}
   */
  public toggleAllLights(): void {
    const targetState = !this.allLightsOn();
    const originalLights = this.lights();

    this.lights.update((lights) => lights.map((l) => ({ ...l, on: targetState })));

    const requests = originalLights.map((l) =>
      this.lightsControlService.updateStatus(l.id, targetState),
    );

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.hasError.set(false);
          this.loadHistory();
        },
        error: (err) => {
          console.error('Failed to update lights status', err);
          this.lights.set(originalLights);
          this.hasError.set(true);
        },
      });
  }
  /**
   * Zamyka wszystkie aktywne subskrypcje RxJS przez emisję i zakończenie strumienia `destroy$`.
   *
   * @returns {void}
   */
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
