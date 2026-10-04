import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationsService } from '@core/services/translations/translations.service';
import { ChartComponent, ApexOptions, ApexXAxis } from 'ng-apexcharts';
import { ROOMS_NAMES_TRANSLATIONS } from '@features/lights/services/lights-history/lights-history.service';
import { LightsEnergyService } from '@features/lights/services/lights-energy/lights-energy.service';

/** Dostępne opcje zakresu czasu w statystykach zużycia energii. */
type TimeframeOption = 'today' | 'week' | 'month';

/** Skróty dni tygodnia dla widoku tygodniowego. */
const WEEKDAYS = {
  pl: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const;

/** Etykiety tygodni dla widoku miesięcznego. */
const MONTH_WEEKS = {
  pl: ['Tydz 1', 'Tydz 2', 'Tydz 3', 'Tydz 4'],
  en: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
} as const;

/**
 * Komponent prezentujący statystyki i wykres zużycia energii oświetlenia.
 *
 * Umożliwia filtrowanie danych według zakresu czasu (dzisiaj, tydzień, miesiąc)
 * oraz wybranego pomieszczenia (cały dom lub konkretny pokój).
 * Prezentuje wykres liniowo-obszarowy ApexCharts oraz ranking pomieszczeń o największym zużyciu.
 *
 * ### Zasady działania:
 * - Pobiera i synchronizuje dane zużycia za pośrednictwem serwisu `LightsEnergyService`.
 * - Dla widoku bieżącego dnia (`today`) nanosi punkty w osi ciągłej (w minutach od 0 do 1440),
 *   dzięki czemu linia wykresu kończy się dokładnie w aktualnej minucie pomiędzy stałymi etykietami.
 * - Dla widoków `week` i `month` wykorzystuje osie kategoryczne z dniami tygodnia lub tygodniami miesiąca.
 * - Odświeża dane cyklicznie co 10 sekund z automatycznym czyszczeniem interwału w `DestroyRef`.
 */
@Component({
  selector: 'app-lights-energy',
  imports: [SvgIconComponent, TranslateModule, ChartComponent],
  standalone: true,
  templateUrl: './lights-energy.component.html',
  styles: ``,
})
export class LightsEnergyComponent implements OnInit {
  /** Serwis obsługujący tłumaczenia i bieżący język aplikacji. */
  private translationsService = inject(TranslationsService);

  /** Serwis zarządzający pobieraniem i stanem statystyk energii oświetlenia. */
  public lightsEnergyService = inject(LightsEnergyService);

  /** Referencja niszczenia komponentu do czyszczenia cyklicznych interwałów. */
  private destroyRef = inject(DestroyRef);

  /**
   * Sygnał określający aktualnie otwarte menu rozwijane.
   * @type {signal<'timeframe' | 'room' | null>}
   */
  public activeDropdown = signal<'timeframe' | 'room' | null>(null);

  /**
   * Sygnał przechowujący wybrany zakres czasu analizy energii.
   * @type {signal<TimeframeOption>}
   */
  public selectedTimeframe = signal<TimeframeOption>('today');

  /**
   * Sygnał przechowujący identyfikator wybranego pomieszczenia lub całego domu.
   * @type {signal<string>}
   */
  public selectedRoom = signal<string>('entireHouse');

  /** Lista dostępnych opcji zakresu czasu wraz z kluczami tłumaczeń i18n. */
  public readonly timeframeOptions = [
    { value: 'today', labelKey: 'lightsPage.today' },
    { value: 'week', labelKey: 'lightsPage.week' },
    { value: 'month', labelKey: 'lightsPage.month' },
  ] as const;

  /** Lista dostępnych pomieszczeń do filtracji wraz z kluczami tłumaczeń i18n. */
  public readonly roomOptions = [
    { value: 'entireHouse', labelKey: 'lightsPage.entireHouse' },
    ...Object.entries(ROOMS_NAMES_TRANSLATIONS).map(([value, labelKey]) => ({
      value,
      labelKey,
    })),
  ];

  /**
   * Sygnał obliczeniowy zwracający klucz tłumaczenia wybranego zakresu czasu.
   * @type {computed<string>}
   */
  public selectedTimeframeLabel = computed(() => {
    return this.timeframeOptions.find((t) => t.value === this.selectedTimeframe())?.labelKey ?? 'lightsPage.today';
  });

  /**
   * Sygnał obliczeniowy zwracający klucz tłumaczenia wybranego pomieszczenia.
   * @type {computed<string>}
   */
  public selectedRoomLabel = computed(() => {
    return this.roomOptions.find((r) => r.value === this.selectedRoom())?.labelKey ?? 'lightsPage.entireHouse';
  });

  /**
   * Sygnał obliczeniowy zwracający TOP 3 pomieszczeń o największym zużyciu energii.
   * @type {computed}
   */
  public topRooms = computed(() => this.lightsEnergyService.energy().topRooms.slice(0, 3));

  /**
   * Sygnał obliczeniowy generujący pełną konfigurację opcji wykresu ApexCharts.
   *
   * Dynamicznie dostosowuje typ osi X (`numeric` dla dnia z dokładnym czasem końcowym,
   * `category` dla tygodnia/miesiąca) oraz stabilne skalowanie osi Y.
   * @type {computed<ApexOptions>}
   */
  public readonly chartOptions = computed<ApexOptions>(() => {
    const timeframe = this.selectedTimeframe();
    const lang = this.translationsService.currentLang();
    const rawData = this.lightsEnergyService.energy().chartData;
    const now = new Date();

    let seriesData: any[] = [];
    let xaxisConfig: ApexXAxis;

    if (timeframe === 'today') {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentBucket = Math.min(Math.floor(now.getHours() / 4), 6);
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < currentBucket; i++) {
        const val = rawData[i];
        if (val !== null && val !== undefined) {
          points.push({ x: i * 240, y: val });
        }
      }

      if (currentBucket === 0 && currentMinutes > 0 && points.length === 0) {
        points.push({ x: 0, y: 0 });
      }

      const currentVal = rawData[currentBucket];
      if (currentVal !== null && currentVal !== undefined) {
        points.push({ x: currentMinutes, y: currentVal });
      }

      seriesData = points;

      xaxisConfig = {
        type: 'numeric',
        min: 0,
        max: 1440,
        tickAmount: 6,
        tickPlacement: 'on',
        labels: {
          rotate: 0,
          rotateAlways: false,
          hideOverlappingLabels: false,
          trim: false,
          formatter: (val: string | number) => {
            const num = Number(val);
            const h = Math.floor(num / 60);
            const m = Math.round(num % 60);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          },
          style: {
            colors: 'var(--text-primary)',
            fontSize: '12px',
            fontFamily: 'inherit',
          },
        },
      };
    } else if (timeframe === 'week') {
      const currentBucket = (now.getDay() + 6) % 7;
      const points: (number | null)[] = [];
      for (let i = 0; i < 7; i++) {
        if (i <= currentBucket && rawData[i] !== null && rawData[i] !== undefined) {
          points.push(rawData[i]);
        } else {
          points.push(null);
        }
      }
      seriesData = points;

      xaxisConfig = {
        type: 'category',
        categories: [...WEEKDAYS[lang]],
        tickPlacement: 'on',
        labels: {
          rotate: 0,
          rotateAlways: false,
          hideOverlappingLabels: false,
          trim: false,
          style: {
            colors: 'var(--text-primary)',
            fontSize: '12px',
            fontFamily: 'inherit',
          },
        },
      };
    } else {
      const currentBucket = Math.min(Math.floor((now.getDate() - 1) / 7), 3);
      const points: (number | null)[] = [];
      for (let i = 0; i < 4; i++) {
        if (i <= currentBucket && rawData[i] !== null && rawData[i] !== undefined) {
          points.push(rawData[i]);
        } else {
          points.push(null);
        }
      }
      seriesData = points;

      xaxisConfig = {
        type: 'category',
        categories: [...MONTH_WEEKS[lang]],
        tickPlacement: 'on',
        labels: {
          rotate: 0,
          rotateAlways: false,
          hideOverlappingLabels: false,
          trim: false,
          style: {
            colors: 'var(--text-primary)',
            fontSize: '12px',
            fontFamily: 'inherit',
          },
        },
      };
    }

    return {
      series: [
        {
          name: 'Zużycie energii (kWh)',
          data: seriesData,
        },
      ],
      chart: {
        type: 'area',
        height: '100%',
        toolbar: { show: false },
        fontFamily: 'inherit',
        animations: {
          enabled: true,
        },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      grid: {
        borderColor: 'color-mix(in srgb, var(--text-primary) 20%, transparent)',
        padding: {
          left: 20,
          right: 20,
        },
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      xaxis: xaxisConfig,
      yaxis: {
        min: 0,
        max: 0.06,
        tickAmount: 3,
        labels: {
          minWidth: 40,
          maxWidth: 40,
          formatter: (val: number) => val.toFixed(2),
          style: {
            colors: 'var(--text-primary)',
            fontSize: '12px',
            fontFamily: 'inherit',
          },
        },
      },
      colors: ['var(--color-accent, #00C7CE)'],
      fill: {
        type: 'solid',
        opacity: 0.1,
      },
      tooltip: {
        theme: 'dark',
        x: {
          formatter: (val: number) => {
            if (timeframe === 'today') {
              const num = Number(val);
              const h = Math.floor(num / 60);
              const m = Math.round(num % 60);
              return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
            return String(val);
          },
        },
        y: {
          formatter: (val: number) => (val !== null && val !== undefined ? `${val.toFixed(2)} kWh` : ''),
        },
      },
    };
  });

  /**
   * Inicjalizuje komponent — pobiera wstępne dane i uruchamia cykliczne odświeżanie co 10s.
   *
   * @returns {void}
   */
  public ngOnInit(): void {
    this.loadEnergy();

    const interval = setInterval(() => {
      this.loadEnergy();
    }, 10000);

    this.destroyRef.onDestroy(() => {
      clearInterval(interval);
    });
  }

  /**
   * Przełącza widoczność menu rozwijanego (dropdown) dla wybranego typu.
   *
   * @param {'timeframe' | 'room'} type Typ dropdownu do otwarcia lub zamknięcia.
   * @returns {void}
   */
  public toggleDropdown(type: 'timeframe' | 'room'): void {
    this.activeDropdown.update((current) => (current === type ? null : type));
  }

  /**
   * Ustawia wybrany zakres czasu, zamyka dropdown i pobiera zaktualizowane statystyki.
   *
   * @param {TimeframeOption} timeframe Nowy zakres czasu ('today', 'week', 'month').
   * @returns {void}
   */
  public selectTimeframe(timeframe: TimeframeOption): void {
    this.selectedTimeframe.set(timeframe);
    this.activeDropdown.set(null);
    this.loadEnergy();
  }

  /**
   * Ustawia wybrane pomieszczenie, zamyka dropdown i pobiera zaktualizowane statystyki.
   *
   * @param {string} roomValue Identyfikator pokoju lub 'entireHouse'.
   * @returns {void}
   */
  public selectRoom(roomValue: string): void {
    this.selectedRoom.set(roomValue);
    this.activeDropdown.set(null);
    this.loadEnergy();
  }

  /**
   * Zwraca klucz tłumaczenia lub domyślną nazwę dla danego pokoju.
   *
   * @param {string} roomName Identyfikator pokoju.
   * @returns {string} Klucz tłumaczenia i18n lub nazwa surowa.
   */
  public getRoomLabel(roomName: string): string {
    return ROOMS_NAMES_TRANSLATIONS[roomName] ?? roomName;
  }

  /**
   * Pobiera statystyki energii z serwisu na podstawie aktualnych filtrów.
   *
   * @returns {void}
   */
  private loadEnergy(): void {
    this.lightsEnergyService.loadEnergy(this.selectedTimeframe(), this.selectedRoom());
  }
}
