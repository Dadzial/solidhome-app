import { Component, signal, computed } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-air-charts',
  imports: [SvgIconComponent, TranslateModule],
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
