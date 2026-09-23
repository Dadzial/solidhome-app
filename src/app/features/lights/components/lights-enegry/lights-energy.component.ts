import { Component, signal, computed } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { ROOMS_NAMES_TRANSLATIONS } from '@features/lights/services/lights-history/lights-history.service';

export type TimeframeOption = 'today' | 'week' | 'month';

@Component({
  selector: 'app-lights-energy',
  imports: [SvgIconComponent, TranslateModule],
  standalone: true,
  templateUrl: './lights-energy.component.html',
  styles: ``,
})
export class LightsEnergyComponent {
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
