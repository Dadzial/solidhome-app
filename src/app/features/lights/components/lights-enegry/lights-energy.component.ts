import { Component, signal, computed, inject } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationsService } from '@core/services/translations/translations.service';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';
import { ROOMS_NAMES_TRANSLATIONS } from '@features/lights/services/lights-history/lights-history.service';

type TimeframeOption = 'today' | 'week' | 'month';

const WEEKDAYS = {
  pl: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const;

@Component({
  selector: 'app-lights-energy',
  imports: [SvgIconComponent, TranslateModule, ChartComponent],
  standalone: true,
  templateUrl: './lights-energy.component.html',
  styles: ``,
})
export class LightsEnergyComponent {
  private translationsService = inject(TranslationsService);
  public activeDropdown = signal<'timeframe' | 'room' | null>(null);
  public selectedTimeframe = signal<TimeframeOption>('today');
  public selectedRoom = signal<string>('entireHouse');

  public readonly timeframeOptions = [
    { value: 'today', labelKey: 'lightsPage.today' },
    { value: 'week', labelKey: 'lightsPage.week' },
    { value: 'month', labelKey: 'lightsPage.month' },
  ] as const;

  public readonly roomOptions = [
    { value: 'entireHouse', labelKey: 'lightsPage.entireHouse' },
    ...Object.entries(ROOMS_NAMES_TRANSLATIONS).map(([value, labelKey]) => ({
      value,
      labelKey,
    })),
  ];

  private translatedCategories = computed(() => {
    const lang = this.translationsService.currentLang();
    return [...WEEKDAYS[lang]];
  });

  // Wykres zużycia energii do testu styli (przykładowe dane)
  public readonly chartOptions = computed<ApexOptions>(() => ({
    series: [
      {
        name: 'Zużycie energii (kWh)',
        data: [31, 40, 28, 51, 42, 109, 100],
      },
    ],
    chart: {
      type: 'area',
      height: '100%',
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: {
        enabled: false,
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
    xaxis: {
      categories: this.translatedCategories(),
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
    },
    yaxis: {
      labels: {
        minWidth: 40,
        maxWidth: 40,
        style: {
          colors: 'var(--text-primary)',
          fontSize: '12px',
          fontFamily: 'inherit',
        },
      },
    },
    colors: ['#3b82f6'],
    tooltip: {
      theme: 'dark',
    },
  }));

  public selectedTimeframeLabel = computed(() => {
    const found = this.timeframeOptions.find((t) => t.value === this.selectedTimeframe());
    return found?.labelKey ?? 'lightsPage.today';
  });

  public selectedRoomLabel = computed(() => {
    const found = this.roomOptions.find((r) => r.value === this.selectedRoom());
    return found?.labelKey ?? 'lightsPage.entireHouse';
  });

  public toggleDropdown(type: 'timeframe' | 'room'): void {
    this.activeDropdown.update((current) => (current === type ? null : type));
  }

  public selectTimeframe(timeframe: TimeframeOption): void {
    this.selectedTimeframe.set(timeframe);
    this.activeDropdown.set(null);
  }

  public selectRoom(roomValue: string): void {
    this.selectedRoom.set(roomValue);
    this.activeDropdown.set(null);
  }
}
