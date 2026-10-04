import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationsService } from '@core/services/translations/translations.service';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';
import { ROOMS_NAMES_TRANSLATIONS } from '@features/lights/services/lights-history/lights-history.service';
import { LightsEnergyService } from '@features/lights/services/lights-energy/lights-energy.service';

type TimeframeOption = 'today' | 'week' | 'month';

const WEEKDAYS = {
  pl: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const;

const TODAY_HOURS = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];

const MONTH_WEEKS = {
  pl: ['Tydz 1', 'Tydz 2', 'Tydz 3', 'Tydz 4'],
  en: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
} as const;

@Component({
  selector: 'app-lights-energy',
  imports: [SvgIconComponent, TranslateModule, ChartComponent],
  standalone: true,
  templateUrl: './lights-energy.component.html',
  styles: ``,
})
export class LightsEnergyComponent implements OnInit {
  private translationsService = inject(TranslationsService);
  public lightsEnergyService = inject(LightsEnergyService);
  private destroyRef = inject(DestroyRef);

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

  public selectedTimeframeLabel = computed(() => {
    return this.timeframeOptions.find((t) => t.value === this.selectedTimeframe())?.labelKey ?? 'lightsPage.today';
  });

  public selectedRoomLabel = computed(() => {
    return this.roomOptions.find((r) => r.value === this.selectedRoom())?.labelKey ?? 'lightsPage.entireHouse';
  });

  public topRooms = computed(() => this.lightsEnergyService.energy().topRooms.slice(0, 3));

  private translatedCategories = computed<string[]>(() => {
    this.lightsEnergyService.energy();
    const lang = this.translationsService.currentLang();
    const timeframe = this.selectedTimeframe();
    if (timeframe === 'today') {
      const categories = [...TODAY_HOURS];
      const now = new Date();
      const activeIdx = Math.min(Math.floor(now.getHours() / 4), categories.length - 1);
      categories[activeIdx] = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return categories;
    }
    if (timeframe === 'month') return [...MONTH_WEEKS[lang]];
    if (timeframe === 'week') return [...WEEKDAYS[lang]];
    return [];
  });

  private chartData = computed(() => this.lightsEnergyService.energy().chartData);

  public readonly chartOptions = computed<ApexOptions>(() => ({
    series: [
      {
        name: 'Zużycie energii (kWh)',
        data: this.chartData(),
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
      min: 0,
      max: 0.06,
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
    },
  }));

  public ngOnInit(): void {
    this.loadEnergy();

    const interval = setInterval(() => {
      this.loadEnergy();
    }, 10000);

    this.destroyRef.onDestroy(() => {
      clearInterval(interval);
    });
  }

  public toggleDropdown(type: 'timeframe' | 'room'): void {
    this.activeDropdown.update((current) => (current === type ? null : type));
  }

  public selectTimeframe(timeframe: TimeframeOption): void {
    this.selectedTimeframe.set(timeframe);
    this.activeDropdown.set(null);
    this.loadEnergy();
  }

  public selectRoom(roomValue: string): void {
    this.selectedRoom.set(roomValue);
    this.activeDropdown.set(null);
    this.loadEnergy();
  }

  public getRoomLabel(roomName: string): string {
    return ROOMS_NAMES_TRANSLATIONS[roomName] ?? roomName;
  }

  private loadEnergy(): void {
    this.lightsEnergyService.loadEnergy(this.selectedTimeframe(), this.selectedRoom());
  }
}
