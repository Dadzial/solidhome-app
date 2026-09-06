import { Component, inject, signal, input, computed, OnInit, OnDestroy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { NgClass } from '@angular/common';
import { LightsControlService } from '@features/lights/services/lights-control/lights-control.service';
import { LightsHistoryService } from '@features/lights/services/lights-history/lights-history.service';
import { Subject, takeUntil, forkJoin } from 'rxjs';

interface Light {
  id: string;
  x: number;
  y: number;
  on: boolean;
}

interface LightHistory {
  id: string;
  name: string;
  action: 'ON' | 'OFF';
  time: string;
  user: string;
}

const ROOMS_NAMES_TRANSLATIONS: Record<string, string> = {
  living_room: 'home.lightsWidget.rooms.livingRoom',
  kitchen: 'home.lightsWidget.rooms.kitchen',
  boiler_room: 'home.lightsWidget.rooms.boilerRoom',
  bathroom: 'home.lightsWidget.rooms.bathroom',
  hallway: 'home.lightsWidget.rooms.hallway',
  garage: 'home.lightsWidget.rooms.garage',
};

@Component({
  selector: 'app-lights-widget',
  imports: [TranslateModule, SvgIconComponent, NgClass],
  standalone: true,
  templateUrl: './lights-widget.component.html',
  styles: ``,
})
export class LightsWidgetComponent implements OnInit, OnDestroy {
  private lightsControlService = inject(LightsControlService);
  private lightsHistoryService = inject(LightsHistoryService);
  private destroy$ = new Subject<void>();

  public titleKey = input<string>('home.lightsWidget.title');

  public readonly lights = signal<Light[]>([
    { id: 'living_room', y: 500, x: 1248, on: false },
    { id: 'kitchen', y: 780, x: 1110, on: false },
    { id: 'boiler_room', y: 290, x: 868, on: false },
    { id: 'bathroom', y: 180, x: 970, on: false },
    { id: 'hallway', y: 590, x: 890, on: false },
    { id: 'garage', y: 450, x: 655, on: false },
  ]);

  public readonly history = signal<LightHistory[]>([]);
  public hasError = signal<boolean>(false);

  public allLightsOn = computed(() => {
    const currentLights = this.lights();
    return currentLights.length > 0 && currentLights.every((l) => l.on);
  });

  public ngOnInit() {
    this.lightsControlService
      .getStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.lights.update((lights) =>
            lights.map((light) => {
              const found = items.find((item) => item.name === light.id);
              return found ? { ...light, on: found.state === 1 } : light;
            }),
          );
          this.hasError.set(false);
        },
        error: (err) => {
          console.error('Failed to load initial lights status', err);
          this.hasError.set(true);
        },
      });
    this.loadHistory();
  }

  public loadHistory(): void {
    this.lightsHistoryService
      .getHistory(20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          const mapped: LightHistory[] = items.map((item) => ({
            id: item._id,
            name: ROOMS_NAMES_TRANSLATIONS[item.name] || item.name,
            action: item.state === 1 ? 'ON' : 'OFF',
            time: new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            user: item.userId?.userName || 'System',
          }));
          this.history.set(mapped);
        },
        error: (err) => {
          console.error('Failed to load lights history', err);
        },
      });
  }

  public clearHistory(): void {
    this.lightsHistoryService
      .resetHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.history.set([]);
        },
        error: (err) => {
          console.error('Failed to reset lights history', err);
        },
      });
  }

  public toggleLight(id: string): void {
    this.lights.update((lights) => lights.map((l) => (l.id === id ? { ...l, on: !l.on } : l)));
    const newState = this.lights().find((l) => l.id === id)?.on ?? false;

    this.lightsControlService
      .updateStatus(id, newState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.hasError.set(false);
          this.loadHistory();
        },
        error: (err) => {
          console.error('Failed to update light status', err);
          this.lights.update((lights) =>
            lights.map((l) => (l.id === id ? { ...l, on: !newState } : l)),
          );
          this.hasError.set(true);
        },
      });
  }

  public toggleAllLights(): void {
    const targetState = !this.allLightsOn();
    const originalLights = this.lights();

    this.lights.update((lights) =>
      lights.map((l) => ({ ...l, on: targetState })),
    );

    const requests = originalLights.map((l) =>
      this.lightsControlService.updateStatus(l.id, targetState),
    );

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.hasError.set(false);
          this.loadHistory();
        },
        error: (err) => {
          console.error('Failed to update lights status', err);
          this.lights.set(originalLights);
          this.hasError.set(true);
        },
      });
  }

  public ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
