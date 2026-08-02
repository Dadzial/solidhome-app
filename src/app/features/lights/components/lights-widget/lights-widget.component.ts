import { Component, inject, signal, input, computed, OnInit, OnDestroy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { NgOptimizedImage, NgClass } from '@angular/common';
import { LightsService, LIGHT_ID_MAP } from '@features/lights/services/lights/lights.service';
import { Subject, takeUntil } from 'rxjs';

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

@Component({
  selector: 'app-lights-widget',
  imports: [TranslateModule, SvgIconComponent, NgOptimizedImage, NgClass],
  standalone: true,
  templateUrl: './lights-widget.component.html',
  styles: ``,
})
export class LightsWidgetComponent implements OnInit, OnDestroy {
  private lightsService = inject(LightsService);
  private destroy$ = new Subject<void>();

  public titleKey = input<string>('home.lightsWidget.title');

  public readonly lights = signal<Light[]>([
    { id: 'living_room', y: 500, x: 1248, on: false },
    { id: 'kitchen', y:780, x: 1110, on: false },
    { id: 'boiler_room', y: 290, x: 868, on: false },
    { id: 'bathroom', y: 180, x: 970, on: false },
    { id: 'hallway', y: 590, x: 890, on: false },
    { id: 'garage', y: 450, x: 655, on: false },
  ]);

  public readonly history = signal<LightHistory[]>([
    { id: '1', name: 'home.lightsWidget.rooms.livingRoom', action: 'ON', time: '14:30', user: 'Damian' },
    { id: '2', name: 'home.lightsWidget.rooms.kitchen', action: 'OFF', time: '14:15', user: 'Damian' },
    { id: '3', name: 'home.lightsWidget.rooms.boilerRoom', action: 'ON', time: '13:00', user: 'System' },
    { id: '4', name: 'home.lightsWidget.rooms.bathroom', action: 'OFF', time: '12:00', user: 'Damian' },
    { id: '5', name: 'home.lightsWidget.rooms.garage', action: 'ON', time: '11:00', user: 'System' },
    { id: '6', name: 'home.lightsWidget.rooms.hallway', action: 'ON', time: '12:00', user: 'System' },
  ]);

  public hasError = signal<boolean>(false);

  public allLightsOn = computed(() => {
    const currentLights = this.lights();
    return currentLights.length > 0 && currentLights.every(l => l.on);
  });

  public clearHistory() {
    this.history.set([]);
  }

  public toggleAllLights() {
    const targetState = !this.allLightsOn();
    const originalLights = this.lights();

    this.lights.update((lights) => lights.map((l) => ({ ...l, on: targetState })));

    this.lights().forEach((l) => {
      this.lightsService
        .updateStatus(l.id, targetState)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.hasError.set(false);
          },
          error: (err) => {
            console.error(`Failed to update light ${l.id} status`, err);
            this.lights.update((lights) =>
              lights.map((light) =>
                light.id === l.id ? { ...light, on: originalLights.find((ol) => ol.id === l.id)?.on ?? false } : light
              )
            );
            this.hasError.set(true);
          }
        });
    });
  }

  public ngOnInit() {
    this.lightsService
      .getStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statusMap) => {
          this.lights.update((lights) =>
            lights.map((light) => {
              const numericId = LIGHT_ID_MAP[light.id];
              if (numericId && statusMap[numericId] !== undefined) {
                return { ...light, on: statusMap[numericId] === 1 };
              }
              return light;
            }),
          );
          this.hasError.set(false);
        },
        error: (err) => {
          console.error('Failed to load initial lights status', err);
          this.hasError.set(true);
        },
      });
  }

  public toggleLight(id: string) {
    this.lights.update((lights) => lights.map((l) => (l.id === id ? { ...l, on: !l.on } : l)));

    const newState = this.lights().find((l) => l.id === id)?.on ?? false;

    this.lightsService
      .updateStatus(id, newState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(newState);
          this.hasError.set(false);
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

  public ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
