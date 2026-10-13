import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslationsService } from '@core/services/translations/translations.service';
import { LightsScheduleService } from '@features/lights/services/lights-schedule/lights-schedule.service';
import { ROOMS_NAMES_TRANSLATIONS } from '@features/lights/services/lights-history/lights-history.service';

/**
 * Komponent zarządzania harmonogramem oświetlenia w systemie SolidHome.
 *
 * Umożliwia przeglądanie zdefiniowanych reguł czasowych, dodawanie nowych reguł z wyborem
 * nazwy, dni tygodnia, przedziału godzinowego (suwak podwójny) i przypisanych pomieszczeń,
 * a także włączanie/wyłączanie oraz usuwanie istniejących reguł.
 *
 * ### Zasady działania:
 * - Pobiera listę reguł z API za pośrednictwem `LightsScheduleService` w cyklu życia `ngOnInit`.
 * - Udostępnia sygnały stanu (`schedule`, `isLoading`, `hasError`) bezpośrednio do szablonu HTML.
 * - Formularz dodawania reguły (`enableAddSchedule`) waliduje obecność nazwy i przynajmniej jednego dnia tygodnia (`canSave`).
 * - Przekazuje akcje użytkownika z widoku do odpowiednich metod serwisu (zapis, przełączenie, usunięcie).
 */
@Component({
  selector: 'app-lights-schedule',
  imports: [TranslateModule, SvgIconComponent],
  templateUrl: './lights-schedule.component.html',
  styles: ``,
})
export class LightsScheduleComponent implements OnInit {
  /** Serwis obsługujący aktualny język i translacje. */
  private translate = inject(TranslationsService);

  /** Serwis zarządzający regułami harmonogramu oświetlenia w systemie. */
  public lightsScheduleService = inject(LightsScheduleService);

  /** Sygnał informujący o błędzie komunikacji z API przy obsłudze harmonogramu. */
  public readonly hasError = this.lightsScheduleService.hasError;

  /** Sygnał przechowujący listę reguł harmonogramu do wyświetlenia w widoku. */
  public readonly schedule = this.lightsScheduleService.schedule;

  /** Sygnał informujący o trwaniu operacji ładowania danych harmonogramu. */
  public readonly isLoading = this.lightsScheduleService.isLoading;

  /**
   * Sygnał obliczeniowy informujący, czy lista reguł harmonogramu jest pusta.
   */
  public readonly empty = this.lightsScheduleService.empty;

  /**
   * Flaga sterująca widocznością formularza dodawania nowej reguły.
   * @type {signal<boolean>}
   */
  public enableAddSchedule = signal(false);

  /**
   * Sygnał przechowujący wprowadzoną nazwę nowej reguły w formularzu.
   * @type {signal<string>}
   */
  public ruleName = signal('');

  /**
   * Sygnał przechowujący indeksy wybranych dni tygodnia (0 = poniedziałek, ..., 6 = niedziela).
   * @type {signal<number[]>}
   */
  public selectedDays = signal<number[]>([]);

  /**
   * Sygnał przechowujący listę wybranych pokoi dla nowej reguły (np. ['entireHouse'] lub poszczególne pokoje).
   * @type {signal<string[]>}
   */
  public selectedRooms = signal<string[]>(['entireHouse']);

  /**
   * Godzina rozpoczęcia w formacie dziesiętnym (0-24, krok 0.25h).
   * @type {signal<number>}
   */
  public start = signal(18);

  /**
   * Godzina zakończenia w formacie dziesiętnym (0-24, krok 0.25h).
   * @type {signal<number>}
   */
  public end = signal(23);

  /**
   * Sygnał obliczeniowy sprawdzający, czy formularz nowej reguły spełnia minimalne kryteria zapisu
   * (niepusta nazwa oraz co najmniej jeden wybrany dzień tygodnia).
   */
  public canSave = computed(
    () => this.ruleName().trim().length > 0 && this.selectedDays().length > 0,
  );

  /**
   * Sygnał obliczeniowy formatujący łączny czas trwania reguły (np. '5h' lub '5h 30m').
   */
  public duration = computed(() => {
    const d =
      this.end() >= this.start() ? this.end() - this.start() : 24 - this.start() + this.end();
    const h = Math.floor(d);
    const m = Math.round((d % 1) * 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  });

  /**
   * Klucze translacji i18n dla poszczególnych dni tygodnia w siatce wyboru.
   */
  public readonly weekDayKeys = [
    'weekdays.mon',
    'weekdays.tue',
    'weekdays.wed',
    'weekdays.thu',
    'weekdays.fri',
    'weekdays.sat',
    'weekdays.sun',
  ] as const;

  /**
   * Słownik mapujący identyfikatory pomieszczeń na klucze translacji i18n.
   */
  public readonly roomTranslations: Record<string, string | undefined> = ROOMS_NAMES_TRANSLATIONS;

  /**
   * Dostępne opcje wyboru pomieszczenia (cały dom oraz poszczególne pokoje) z kluczami translacji i18n.
   */
  public readonly roomOptions = [
    { value: 'entireHouse', labelKey: 'lightsPage.entireHouse' },
    ...Object.entries(ROOMS_NAMES_TRANSLATIONS).map(([value, labelKey]) => ({
      value,
      labelKey,
    })),
  ];

  /**
   * Inicjalizuje komponent i pobiera listę reguł harmonogramu z backendu.
   */
  public ngOnInit(): void {
    this.lightsScheduleService.loadRules();
  }

  /**
   * Formatuje wartość liczbową godziny (np. 18.5) do ciągu tekstowego "HH:MM" (np. "18:30").
   *
   * @param {number} val Wartość godziny w systemie dziesiętnym.
   * @returns {string} Sformatowana godzina w formacie "HH:MM".
   */
  public format(val: number): string {
    const h = Math.floor(val).toString().padStart(2, '0');
    const m = Math.round((val % 1) * 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}`;
  }

  /**
   * Przełącza widoczność formularza dodawania nowej reguły. W przypadku zamknięcia czyści formularz.
   */
  public toggleAddSchedule(): void {
    const nextState = !this.enableAddSchedule();
    if (!nextState) {
      this.resetForm();
    }
    this.enableAddSchedule.set(nextState);
  }

  /**
   * Przełącza zaznaczenie pojedynczego dnia tygodnia w siatce wyboru dni.
   *
   * @param {number} index Indeks dnia tygodnia (0-6).
   */
  public toggleDay(index: number): void {
    this.selectedDays.update((days) =>
      days.includes(index) ? days.filter((d) => d !== index) : [...days, index],
    );
  }

  /**
   * Sprawdza, czy dany dzień tygodnia jest obecnie zaznaczony.
   *
   * @param {number} index Indeks dnia tygodnia (0-6).
   * @returns {boolean} `true`, jeśli dzień jest zaznaczony.
   */
  public isDaySelected(index: number): boolean {
    return this.selectedDays().includes(index);
  }

  /**
   * Przełącza wybór pomieszczenia. Wybór 'entireHouse' czyści pozostałe pokoje i zaznacza cały dom.
   * Wybór konkretnego pokoju usuwa zaznaczenie 'entireHouse'.
   *
   * @param {string} roomValue Identyfikator wybranego pokoju (np. 'living_room' lub 'entireHouse').
   */
  public toggleRoom(roomValue: string): void {
    if (roomValue === 'entireHouse') {
      this.selectedRooms.set(['entireHouse']);
      return;
    }

    this.selectedRooms.update((rooms) => {
      const filtered = rooms.filter((r) => r !== 'entireHouse');
      const updated = filtered.includes(roomValue)
        ? filtered.filter((r) => r !== roomValue)
        : [...filtered, roomValue];
      return updated.length > 0 ? updated : ['entireHouse'];
    });
  }

  /**
   * Sprawdza, czy dane pomieszczenie jest zaznaczone w filtrze reguły.
   *
   * @param {string} roomValue Identyfikator pokoju.
   * @returns {boolean} `true`, jeśli pokój jest zaznaczony.
   */
  public isRoomSelected(roomValue: string): boolean {
    return this.selectedRooms().includes(roomValue);
  }

  /**
   * Zapisuje nową regułę w API na podstawie wprowadzonych danych formularza.
   * Po sukcesie czyści formularz i ukrywa widok dodawania.
   */
  public saveRule(): void {
    if (!this.canSave()) {
      return;
    }

    this.lightsScheduleService
      .createRule({
        name: this.ruleName().trim(),
        days: this.selectedDays(),
        startTime: this.format(this.start()),
        endTime: this.format(this.end()),
        rooms: this.selectedRooms(),
      })
      .subscribe({
        next: () => {
          this.resetForm();
          this.enableAddSchedule.set(false);
        },
        error: (err) => {
          console.error('[LightsScheduleComponent] Failed to save rule', err);
        },
      });
  }

  /**
   * Resetuje wartości pól formularza dodawania nowej reguły do wartości początkowych.
   */
  public resetForm(): void {
    this.ruleName.set('');
    this.selectedDays.set([]);
    this.selectedRooms.set(['entireHouse']);
    this.start.set(18);
    this.end.set(23);
  }

  /**
   * Przełącza stan aktywności (active) wybranej reguły harmonogramu w API.
   *
   * @param {string} id Identyfikator reguły.
   * @param {boolean} [active] Opcjonalny docelowy stan aktywności.
   */
  public toggleRuleActive(id: string, active?: boolean): void {
    this.lightsScheduleService.toggleRuleActive(id, active);
  }

  /**
   * Usuwa wybraną regułę harmonogramu za pośrednictwem serwisu.
   *
   * @param {string} id Identyfikator reguły do usunięcia.
   */
  public deleteRule(id: string): void {
    this.lightsScheduleService.deleteRule(id);
  }
}

