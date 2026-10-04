import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationsService } from '@core/services/translations/translations.service';
import { ChartComponent, ApexOptions, ApexXAxis } from 'ng-apexcharts';
import { ROOMS_NAMES_TRANSLATIONS } from '@features/lights/services/lights-history/lights-history.service';
import { LightsEnergyService } from '@features/lights/services/lights-energy/lights-energy.service';

type TimeframeOption = 'today' | 'week' | 'month';

const WEEKDAYS = {
  pl: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const;


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
