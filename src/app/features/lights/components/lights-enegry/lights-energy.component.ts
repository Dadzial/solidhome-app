import { Component , signal } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-lights-energy',
  imports: [SvgIconComponent, TranslatePipe],
  templateUrl: './lights-energy.component.html',
  styles: ``,
})
export class LightsEnergyComponent {
  public readonly isTimeframeOpen = signal(false);
  public readonly selectedTimeframe = signal<'today' | 'week' | 'month'>('today');

  public readonly timeframeOptions = [
    { value: 'today', labelKey: 'lightsPage.today' },
    { value: 'week', labelKey: 'lightsPage.week' },
    { value: 'month', labelKey: 'lightsPage.month' },
  ] as const;

  public toggleTimeframeDropdown(): void {
    this.isTimeframeOpen.update((isOpen) => !isOpen);
  }

  public selectTimeframe(timeframe: 'today' | 'week' | 'month'): void {
    this.selectedTimeframe.set(timeframe);
    this.isTimeframeOpen.set(false);
  }
}
