import { Component, signal, computed } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
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

@Component({
  selector: 'app-air-charts',
  imports: [SvgIconComponent, TranslateModule, ChartComponent],
  standalone: true,
  templateUrl: './air-charts.component.html',
  styles: ``,
})
export class AirChartsComponent {
  /**
   * Sygnał wskazujący, które menu rozwijane (dropdown) jest aktualnie otwarte.
   * @type {signal<'metric' | 'timeframe' | null>}
   */
  public activeDropdown = signal<'metric' | 'timeframe' | null>(null);

  /** Sygnał reprezentujący wybrany przedział czasu (na ten moment lokalny). */
  public selectedTimeframe = signal<'today' | 'week' | 'month'>('today');

  /** Sygnał reprezentujący wybrany parametr (na ten moment lokalny) */
  public selectedMetric = signal<'temperature' | 'humidity' | 'pressure'>('temperature');

  /**
   * Dostępne opcje wyboru przedziału czasowego wraz z kluczami translacji i18n.
   */
  public readonly timeframeOptions = [
    { value: 'today', labelKey: 'lightsPage.today' },
    { value: 'week', labelKey: 'lightsPage.week' },
    { value: 'month', labelKey: 'lightsPage.month' },
  ] as const;

  /**
   * Dostępne opcje wyboru parametru wraz z kluczami translacji i18n.
   */
  public readonly metricOptions = [
    { value: 'temperature', labelKey: 'temperatureDisplay.title' },
    { value: 'humidity', labelKey: 'humidityDisplay.title' },
    { value: 'pressure', labelKey: 'pressureDisplay.title' },
  ] as const;

  /**
   * Sygnał obliczeniowy zwracający etykietę dla wybranego przedziału czasowego.
   * @type {computed}
   */
  public selectedTimeframeLabel = computed(
    () =>
      this.timeframeOptions.find((t) => t.value === this.selectedTimeframe())?.labelKey ??
      'lightsPage.today',
  );

  /**
   * Sygnał obliczeniowy zwracający etykietę dla wybranego parametru.
   * @type {computed}
   */
  public selectedMetricLabel = computed(
    () =>
      this.metricOptions.find((m) => m.value === this.selectedMetric())?.labelKey ??
      'temperatureDisplay.title',
  );

  /**
   * Pusta seria danych wykresu (do podpięcia pod serwis historii powietrza).
   */
  public readonly chartSeries: ApexAxisChartSeries = [
    {
      name: '',
      data: [],
    },
  ];

  /**
   * Statyczna konfiguracja wykresu ApexCharts zapobiegająca niszczeniu i ponownemu tworzeniu kontenera DOM.
   */
  public readonly chartConfig: ApexChart = {
    type: 'area',
    height: '100%',
    width: '100%',
    toolbar: {
      show: false,
      tools: {
        download: false,
        selection: false,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false,
      },
    },
    zoom: { enabled: false },
    selection: { enabled: false },
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
   * Konfiguracja osi poziomej X.
   */
  public readonly xaxisConfig: ApexXAxis = {
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

  /**
   * Sygnał obliczeniowy osi pionowej Y dostosowujący zakres do wybranego parametru powietrza.
   * @type {computed}
   */
  public readonly yaxisConfig = computed<ApexYAxis>(() => {
    const metric = this.selectedMetric();
    const min = metric === 'pressure' ? 960 : 0;
    const max = metric === 'pressure' ? 1050 : metric === 'humidity' ? 100 : 40;
    const tickAmount = metric === 'pressure' ? 5 : 4;

    return {
      min,
      max,
      tickAmount,
      labels: {
        minWidth: 40,
        maxWidth: 40,
        formatter: (val: number) =>
          typeof val === 'number'
            ? metric === 'pressure'
              ? val.toFixed(0)
              : val.toFixed(1)
            : String(val),
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
      right: 25,
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

  /** Konfiguracja tooltipa wykresu. */
  public readonly tooltipConfig: ApexTooltip = {
    theme: 'dark',
  };

  /**
   * Przełącza widoczność menu rozwijanego (timeframe lub metric).
   *
   * @param {'timeframe' | 'metric'} type Typ menu do przełączenia.
   * @returns {void}
   */
  public toggleDropdown(type: 'timeframe' | 'metric'): void {
    this.activeDropdown.update((current) => (current === type ? null : type));
  }

  /**
   * Ustawia wybrany przedział czasu i zamyka dropdown.
   *
   * @param {'today' | 'week' | 'month'} timeframe Wybrany przedział czasu ('today', 'week', 'month').
   * @returns {void}
   */
  public selectTimeframe(timeframe: 'today' | 'week' | 'month'): void {
    this.activeDropdown.set(null);
    this.selectedTimeframe.set(timeframe);
  }

  /**
   * Ustawia wybrany parametr, zamyka dropdown i odświeża statystyki.
   *
   * @param metric Wybrany parametr ('temperature', 'humidity', 'pressure').
   * @returns {void}
   */
  public selectMetric(metric: 'temperature' | 'humidity' | 'pressure'): void {
    this.activeDropdown.set(null);
    this.selectedMetric.set(metric);
  }
}
