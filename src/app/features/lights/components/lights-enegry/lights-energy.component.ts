import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationsService } from '@core/services/translations/translations.service';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexStroke,
  ApexFill,
  ApexDataLabels,
  ApexTooltip,
} from 'ng-apexcharts';
import { ROOMS_NAMES_TRANSLATIONS } from '@features/lights/services/lights-history/lights-history.service';
import { LightsEnergyService } from '@features/lights/services/lights-energy/lights-energy.service';
import { EnergyTimeframe, DisplayTopRoom } from '@features/lights/models/lights.models';

/**
 * Etykiety dni tygodnia w zależności od wybranego języka interfejsu.
 */
const WEEKDAYS = {
  pl: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const;


/**
 * Etykiety tygodni miesiąca w zależności od wybranego języka interfejsu.
 */
const MONTH_WEEKS = {
  pl: ['Tydz 1', 'Tydz 2', 'Tydz 3', 'Tydz 4'],
  en: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
} as const;

/**
 * Komponent prezentujący statystyki i profil zużycia energii oświetlenia w systemie SolidHome.
 *
 * Wyświetla interaktywny wykres liniowo-obszarowy ApexCharts ze zużyciem energii w czasie rzeczywistym
 * oraz ranking TOP 3 pomieszczeń o największym zużyciu energii.
 *
 * ### Zasady działania:
 * - Pobiera dane statystyczne z API za pośrednictwem `LightsEnergyService`.
 * - W widoku dziennym wykres prezentuje bufor minutowy (format `HH:mm`) aktualizowany w czasie rzeczywistym.
 * - Umożliwia filtrowanie po przedziale czasowym ('today', 'week', 'month') oraz po wybranym pomieszczeniu ('entireHouse' lub konkretny pokój).
 * - Oś Y dynamicznie dostosowuje skalę: `0.25 kW` dla całego domu, `0.08 kW` dla pojedynczych lamp.
 * - Sekcja TOP 3 prezentuje sumaryczny udział pokoi w zużyciu energii całego domu.
 * - Cyklicznie odpytuje backend co 3 sekundy w celu płynnej aktualizacji profilu poboru mocy.
 */
@Component({
  selector: 'app-lights-energy',
  imports: [SvgIconComponent, TranslateModule, ChartComponent],
  standalone: true,
  templateUrl: './lights-energy.component.html',
  styles: ``,
})
export class LightsEnergyComponent implements OnInit, OnDestroy {
  /** Serwis obsługujący aktualny język i translacje. */
  private translationsService = inject(TranslationsService);

  /** Serwis zarządzający pobieraniem danych statystyk energii świateł. */
  private lightsEnergyService = inject(LightsEnergyService);

  /** Uchwyt interwału cyklicznego odświeżania danych wykresu. */
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Sygnał wskazujący, które menu rozwijane (dropdown) jest aktualnie otwarte.
   * @type {signal<'timeframe' | 'room' | null>}
   */
  public activeDropdown = signal<'timeframe' | 'room' | null>(null);

  /** Sygnał reprezentujący wybrany przedział czasu (delegowany z serwisu). */
  public selectedTimeframe = this.lightsEnergyService.currentTimeframe;

  /** Sygnał reprezentujący wybrane pomieszczenie lub cały dom (delegowany z serwisu). */
  public selectedRoom = this.lightsEnergyService.currentRoom;

  /**
   * Dostępne opcje wyboru przedziału czasowego wraz z kluczami translacji i18n.
   */
  public readonly timeframeOptions = [
    { value: 'today', labelKey: 'lightsPage.today' },
    { value: 'week', labelKey: 'lightsPage.week' },
    { value: 'month', labelKey: 'lightsPage.month' },
  ] as const;

  /**
   * Dostępne opcje wyboru pomieszczenia (cały dom oraz poszczególne pokoje).
   */
  public readonly roomOptions = [
    { value: 'entireHouse', labelKey: 'lightsPage.entireHouse' },
    ...Object.entries(ROOMS_NAMES_TRANSLATIONS).map(([value, labelKey]) => ({
      value,
      labelKey,
    })),
  ];

  /** Sygnał przechowujący pobrane dane statystyk energii z serwisu. */
  public readonly energyData = this.lightsEnergyService.energyData;

  /**
   * Sygnał obliczeniowy zwracający łączne zużycie energii w kWh dla wybranego filtra.
   * @type {computed}
   */
  public readonly totalKwh = computed<number>(() => {
    return this.energyData()?.totalKwh ?? 0;
  });

  /**
   * Sygnał obliczeniowy mapujący ranking TOP 3 pokoi na model widoku z kluczami i18n.
   * @type {computed}
   */
  public readonly topRooms = computed<DisplayTopRoom[]>(() => {
    const data = this.energyData();
    if (!data?.topRooms) return [];
    return data.topRooms.map((r) => ({
      name: r.name,
      percentage: r.percentage,
      kwh: r.kwh,
      translationKey: ROOMS_NAMES_TRANSLATIONS[r.name] ?? r.name,
    }));
  });

  /**
   * Sygnał obliczeniowy pobierający tablicę wartości punktów wykresu z danych API.
   * @type {computed}
   */
  public chartData = computed<number[]>(() => {
    const data = this.energyData();
    return data?.chartData ?? [];
  });

  /**
   * Sygnał obliczeniowy wyliczający etykiety osi X (kategorie) z uwzględnieniem danych API i i18n.
   * Dla widoku dziennego wykorzystuje kategorie czasowe z API (bufor minutowy).
   * Dla widoku tygodniowego i miesięcznego stosuje zlokalizowane skróty dni i tygodni.
   * @type {computed}
   */
  public translatedCategories = computed<string[]>(() => {
    const timeframe = this.selectedTimeframe();
    const dataLen = this.chartData().length;

    if (timeframe === 'today') {
      const data = this.energyData();
      return data?.categories ?? [];
    }

    const lang = this.translationsService.currentLang();
    const fullList: readonly string[] = timeframe === 'month' ? MONTH_WEEKS[lang] : WEEKDAYS[lang];

    return dataLen > 0 ? fullList.slice(0, dataLen) : [...fullList];
  });

  /**
   * Statyczna konfiguracja wykresu ApexCharts zapobiegająca niszczeniu i ponownemu tworzeniu kontenera DOM.
   */
  public readonly chartConfig: ApexChart = {
    type: 'area',
    height: '100%',
    width: '100%',
    toolbar: { show: false },
    fontFamily: 'inherit',
    animations: {
      enabled: false,
      dynamicAnimation: {
        enabled: true,
        speed: 350,
      },
    },
  };

  /**
   * Sygnał obliczeniowy osi poziomej X.
   * Reaguje na zmianę języka i aktualizuje etykiety oraz wymusza pełne odświeżenie wykresu w ng-apexcharts.
   * @type {computed}
   */
  public readonly xaxisConfig = computed<ApexXAxis>(() => {
    // Odczytujemy język, aby zmiana języka tworzyła nową referencję obiektu xaxis
    this.translationsService.currentLang();

    return {
      type: 'category',
      tickPlacement: 'on',
      tickAmount: 5,
      labels: {
        rotate: 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
        trim: false,
        style: {
          colors: 'var(--text-primary)',
          fontSize: '11px',
          fontFamily: 'inherit',
        },
      },
    };
  });

  /**
   * Sygnał obliczeniowy osi pionowej Y dostosowujący zakres (max) do wybranego przedziału i pokoju.
   * @type {computed}
   */
  public readonly yaxisConfig = computed<ApexYAxis>(() => {
    const timeframe = this.selectedTimeframe();
    const isRoom = this.selectedRoom() !== 'entireHouse';
    const max = timeframe === 'today'
      ? (isRoom ? 0.08 : 0.25)
      : timeframe === 'week'
      ? (isRoom ? 1.0 : 3.0)
      : (isRoom ? 3.0 : 10.0);
    const tickAmount = timeframe === 'today' ? (isRoom ? 4 : 5) : 6;

    return {
      min: 0,
      max,
      tickAmount,
      labels: {
        minWidth: 40,
        maxWidth: 40,
        formatter: (val: number) => (typeof val === 'number' ? val.toFixed(2) : String(val)),
        style: {
          colors: 'var(--text-primary)',
          fontSize: '12px',
          fontFamily: 'inherit',
        },
      },
    };
  });

  /**
   * Konfiguracja siatki wykresu z bezpiecznym marginesem zapobiegającym nachodzeniu osi X na oś Y.
   */
  public readonly gridConfig: ApexGrid = {
    borderColor: 'color-mix(in srgb, var(--text-primary) 20%, transparent)',
    padding: {
      left: 20,
      right: 15,
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
  };

  /** Konfiguracja stylu linii wykresu (wygładzona krzywa). */
  public readonly strokeConfig: ApexStroke = {
    curve: 'smooth',
    width: 2,
  };

  /** Konfiguracja wypełnienia obszaru pod wykresem. */
  public readonly fillConfig: ApexFill = {
    type: 'solid',
    opacity: 0.1,
  };

  /** Konfiguracja etykiet danych (wyłączone dla czystości wykresu). */
  public readonly dataLabelsConfig: ApexDataLabels = {
    enabled: false,
  };

  /** Kolorystyka serii wykresu oparta na zmiennej CSS akcentu aplikacji. */
  public readonly colorsConfig: string[] = ['var(--color-accent, #00C7CE)'];

  /**
   * Sygnał obliczeniowy konfiguracji tooltipa z formatowaniem wartości kWh.
   * Tworzy nową referencję przy zmianie języka, co wymusza natychmiastowe przerysowanie tooltipa w ApexCharts.
   * @type {computed}
   */
  public readonly tooltipConfig = computed<ApexTooltip>(() => {
    this.translationsService.currentLang();

    return {
      theme: 'dark',
      y: {
        formatter: (val: number) => (typeof val === 'number' ? `${val.toFixed(2)} kWh` : ''),
      },
    };
  });

  /**
   * Sygnał obliczeniowy serii danych wykresu mapujący punkty { x, y } z wartościami i etykietami.
   * @type {computed}
   */
  public readonly chartSeries = computed<ApexAxisChartSeries>(() => {
    const chartData = this.chartData();
    const categories = this.translatedCategories();

    const points = chartData.map((val, idx) => ({
      x: categories[idx] ?? `P${idx}`,
      y: val,
    }));

    const seriesName = this.translationsService.instant('lightsPage.energyConsumptionKwh');

    return [
      {
        name: seriesName,
        data: points,
      },
    ];
  });

  /**
   * Sygnał obliczeniowy zwracający klucz translacji dla aktualnie wybranego przedziału czasu.
   * @type {computed}
   */
  public selectedTimeframeLabel = computed(() => {
    const found = this.timeframeOptions.find((t) => t.value === this.selectedTimeframe());
    return found?.labelKey ?? 'lightsPage.today';
  });

  /**
   * Sygnał obliczeniowy zwracający klucz translacji dla aktualnie wybranego pokoju.
   * @type {computed}
   */
  public selectedRoomLabel = computed(() => {
    const found = this.roomOptions.find((r) => r.value === this.selectedRoom());
    return found?.labelKey ?? 'lightsPage.entireHouse';
  });

  /**
   * Inicjalizuje komponent — pobiera pierwsze dane z API i uruchamia cykliczny interwał odświeżania.
   *
   * @returns {void}
   */
  public ngOnInit(): void {
    this.lightsEnergyService.loadEnergyStats(this.selectedTimeframe(), this.selectedRoom());
    this.refreshInterval = setInterval(() => {
      this.lightsEnergyService.loadEnergyStats();
    }, 3000);
  }

  /**
   * Czyści zasoby komponentu — zatrzymuje działający interwał cykliczny.
   *
   * @returns {void}
   */
  public ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Przełącza widoczność menu rozwijanego (timeframe lub room).
   *
   * @param {'timeframe' | 'room'} type Typ menu do przełączenia.
   * @returns {void}
   */
  public toggleDropdown(type: 'timeframe' | 'room'): void {
    this.activeDropdown.update((current) => (current === type ? null : type));
  }

  /**
   * Ustawia wybrany przedział czasu, zamyka dropdown i odświeża statystyki.
   *
   * @param {EnergyTimeframe} timeframe Wybrany przedział czasu ('today', 'week', 'month').
   * @returns {void}
   */
  public selectTimeframe(timeframe: EnergyTimeframe): void {
    this.activeDropdown.set(null);
    this.lightsEnergyService.loadEnergyStats(timeframe, this.selectedRoom());
  }

  /**
   * Ustawia wybrane pomieszczenie lub cały dom, zamyka dropdown i odświeża statystyki.
   *
   * @param {string} roomValue Nazwa wybranego pokoju lub 'entireHouse'.
   * @returns {void}
   */
  public selectRoom(roomValue: string): void {
    this.activeDropdown.set(null);
    this.lightsEnergyService.loadEnergyStats(this.selectedTimeframe(), roomValue);
  }
}
