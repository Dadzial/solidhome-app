import { Component, signal, computed, inject, input } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslatePipe } from '@ngx-translate/core';
import { ROOMS_NAMES_TRANSLATIONS } from '@features/lights/services/lights-history/lights-history.service';
import { LightsScenesService } from '@features/lights/services/lights-scenes/lights-scenes.service';
import { ErrorOverlayComponent } from '@shared/components/error-overlay/error-overlay.component';

/**
 * Komponent zarządzania scenami oświetlenia w systemie SolidHome.
 *
 * Umożliwia tworzenie gotowych zestawów oświetlenia (np. Wieczór filmowy, Romantyczny),
 * ich błyskawiczne wyzwalanie jednym kliknięciem oraz usuwanie.
 */
@Component({
  selector: 'app-lights-scenes',
  imports: [SvgIconComponent, TranslatePipe, ErrorOverlayComponent],
  templateUrl: './lights-scenes.component.html',
  styles: ``,
})
export class LightsScenesComponent {
  /** Serwis zarządzający logiką scen. */
  public lightsScenesService = inject(LightsScenesService);

  /** Sygnał informujący o błędzie komunikacji z API. */
  public readonly hasError = this.lightsScenesService.hasError;

  /** Klucz błędu translacji i18n otrzymany z serwisu scen. */
  public readonly errorMessage = this.lightsScenesService.errorMessage;

  /**
   * Flaga wymuszająca ukrycie lokalnej nakładki błędu (np. gdy aktywna jest globalna nakładka strony).
   */
  public hideError = input<boolean>(false);

  /** Sygnał z listą scen. */
  public readonly scenes = this.lightsScenesService.scenes;

  /** Sygnał informujący, czy lista scen jest pusta. */
  public readonly empty = this.lightsScenesService.empty;

  /**
   * Flaga sterująca widocznością formularza dodawania nowej sceny.
   */
  public enableAddScene = signal(false);

  /**
   * Wprowadzona nazwa nowej sceny.
   */
  public sceneName = signal('');

  /**
   * Dostępne ścieżki do ikon scen w formacie SVG.
   */
  public readonly sceneIcons = [
    'assets/icons/heart.svg',
    'assets/icons/film.svg',
    'assets/icons/work.svg',
  ];

  /**
   * Sygnał przechowujący aktualnie wybraną ikonę sceny (domyślnie pierwsza z listy).
   */
  public selectedIcon = signal<string>(this.sceneIcons[0]);

  /**
   * Sygnał przechowujący listę wybranych pokoi dla sceny (domyślnie salon).
   */
  public selectedRooms = signal<string[]>(['living_room']);

  /**
   * Słownik translacji nazw pokojów.
   */
  public readonly roomTranslations: Record<string, string | undefined> = ROOMS_NAMES_TRANSLATIONS;

  /**
   * Dostępne opcje wyboru pomieszczenia (poszczególne pokoje) z kluczami translacji i18n.
   */
  public readonly roomOptions = Object.entries(ROOMS_NAMES_TRANSLATIONS).map(
    ([value, labelKey]) => ({
      value,
      labelKey,
    }),
  );

  /**
   * Sygnał obliczeniowy weryfikujący możliwość zapisu sceny.
   */
  public readonly canSave = computed(
    () => this.sceneName().trim().length > 0 && this.selectedRooms().length > 0,
  );

  /**
   * Przełącza widoczność formularza dodawania nowej sceny.
   * @returns {void}
   */
  public toggleAddScene(): void {
    const next = !this.enableAddScene();
    if (!next) {
      this.resetForm();
    }
    this.enableAddScene.set(next);
  }

  /**
   * Resetuje pola formularza do wartości domyślnych.
   * @returns {void}
   */
  public resetForm(): void {
    this.sceneName.set('');
    this.selectedIcon.set(this.sceneIcons[0]);
    this.selectedRooms.set(['living_room']);
  }

  /**
   * Wybiera ikonę dla tworzonej sceny.
   *
   * @param {string} icon Ścieżka do wybranej ikony SVG.
   * @returns {void}
   */
  public selectIcon(icon: string): void {
    this.selectedIcon.set(icon);
  }

  /**
   * Przełącza wybór pomieszczenia w scenie (multiselect).
   *
   * @param {string} roomValue Identyfikator wybranego pokoju (np. 'living_room').
   * @returns {void}
   */
  public toggleRoom(roomValue: string): void {
    this.selectedRooms.update((rooms) =>
      rooms.includes(roomValue) ? rooms.filter((r) => r !== roomValue) : [...rooms, roomValue],
    );
  }

  /**
   * Sprawdza, czy dane pomieszczenie jest zaznaczone w filtrze sceny.
   *
   * @param {string} roomValue Identyfikator pokoju.
   * @returns {boolean} `true`, jeśli pokój jest zaznaczony.
   */
  public isRoomSelected(roomValue: string): boolean {
    return this.selectedRooms().includes(roomValue);
  }

  /**
   * Zapisuje nowo zdefiniowaną scenę i zamyka formularz.
   * @returns {void}
   */
  public saveScene(): void {
    if (!this.canSave()) {
      return;
    }

    this.lightsScenesService.addScene({
      name: this.sceneName().trim(),
      icon: this.selectedIcon(),
      rooms: this.selectedRooms(),
    });

    this.resetForm();
    this.enableAddScene.set(false);
  }

  /**
   * Aktywuje wskazaną scenę — natychmiastowo zapala przypisane pokoje.
   *
   * @param {string} sceneId Identyfikator sceny do aktywacji.
   * @returns {void}
   */
  public activateScene(sceneId: string): void {
    this.lightsScenesService.activateScene(sceneId);
  }

  /**
   * Usuwa wskazaną scenę.
   *
   * @param {string} sceneId Identyfikator usuwanej sceny.
   * @param {Event} [event] Opcjonalny obiekt zdarzenia, aby zatrzymać propagację kliknięcia.
   * @returns {void}
   */
  public deleteScene(sceneId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.lightsScenesService.deleteScene(sceneId);
  }

  /**
   * Ponawia pobranie scen po wystąpieniu błędu.
   *
   * @returns {void}
   */
  public onRetry(): void {
    this.lightsScenesService.loadScenes();
  }
}
