import { Component, signal, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationsService } from '@core/services/translations/translations.service';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-lights-schedule',
  imports: [TranslateModule, SvgIconComponent],
  templateUrl: './lights-schedule.component.html',
  styles: ``,
})
export class LightsScheduleComponent {
  private translate = inject(TranslationsService);

  public enableAddSchedule = signal(false);
  public selectedDays = signal<number[]>([]);
  public start = signal(18);
  public end = signal(23);

  public format(val: number): string {
    const h = Math.floor(val).toString().padStart(2, '0');
    const m = Math.round((val % 1) * 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}`;
  }

  public duration = computed(() => {
    const d =
      this.end() >= this.start() ? this.end() - this.start() : 24 - this.start() + this.end();
    const h = Math.floor(d);
    const m = Math.round((d % 1) * 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  });

  public readonly weekDayKeys = [
    'weekdays.mon',
    'weekdays.tue',
    'weekdays.wed',
    'weekdays.thu',
    'weekdays.fri',
    'weekdays.sat',
    'weekdays.sun',
  ] as const;

  public weekdays = computed(() => {
    this.translate.currentLang();
    return this.weekDayKeys.map((key) => this.translate.instant(key));
  });

  public toggleAddSchedule(): void {
    this.enableAddSchedule.update((value) => !value);
  }

  public toggleDay(index: number): void {
    this.selectedDays.update((days) =>
      days.includes(index) ? days.filter((d) => d !== index) : [...days, index],
    );
  }

  public isDaySelected(index: number): boolean {
    return this.selectedDays().includes(index);
  }
}
