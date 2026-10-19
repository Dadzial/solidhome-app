import { Component, signal } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslatePipe } from '@ngx-translate/core';
import { ROOMS_NAMES_TRANSLATIONS } from '@features/lights/services/lights-history/lights-history.service';

@Component({
  selector: 'app-lights-scenes',
  imports: [SvgIconComponent, TranslatePipe],
  templateUrl: './lights-scenes.component.html',
  styles: ``,
})
export class LightsScenesComponent {
  /**
   * Flaga sterująca widocznością formularza dodawania nowej sceny.
   */
  public enableAddScene = signal(false);

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
   * Dostępne opcje wyboru pomieszczenia (poszczególne pokoje) z kluczami translacji i18n.
   */
  public readonly roomOptions = Object.entries(ROOMS_NAMES_TRANSLATIONS).map(
    ([value, labelKey]) => ({
      value,
      labelKey,
    }),
  );

  /**
   * Przełącza widoczność formularza dodawania nowej sceny.
   */
  public toggleAddScene(): void {
    this.enableAddScene.update((value) => !value);
  }

  /**
   * Wybiera ikonę dla tworzonej sceny.
   *
   * @param {string} icon Ścieżka do wybranej ikony SVG.
   */
  public selectIcon(icon: string): void {
    this.selectedIcon.set(icon);
  }

  /**
   * Przełącza wybór pomieszczenia w scenie (multiselect).
   *
   * @param {string} roomValue Identyfikator wybranego pokoju (np. 'living_room').
   */
  public toggleRoom(roomValue: string): void {
    this.selectedRooms.update((rooms) =>
      rooms.includes(roomValue)
        ? rooms.filter((r) => r !== roomValue)
        : [...rooms, roomValue],
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
}
