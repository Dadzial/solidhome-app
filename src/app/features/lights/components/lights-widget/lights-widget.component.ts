import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { NgOptimizedImage, NgClass } from '@angular/common';
import { LightsService, LIGHT_ID_MAP } from '@features/lights/services/lights/lights.service';
import { Subject, takeUntil } from 'rxjs';

interface Light {
  id: string;
  top: string;
  left: string;
  on: boolean;
}

interface LightHistory {
  id: string;
  name: string;
  action: 'ON' | 'OFF';
  time: string;
}

@Component({
  selector: 'app-lights-widget',
  imports: [TranslatePipe, SvgIconComponent, NgOptimizedImage, NgClass],
  standalone: true,
  templateUrl: './lights-widget.component.html',
  styles: ``,
})
export class LightsWidgetComponent implements OnInit, OnDestroy {
  private lightsService = inject(LightsService);
  private destroy$ = new Subject<void>();

  public readonly lights = signal<Light[]>([
    { id: 'living_room', top: '45%', left: '70%', on: false },
    { id: 'kitchen', top: '50%', left: '40%', on: false },
    { id: 'bedroom', top: '65%', left: '55%', on: false },
    { id: 'bathroom', top: '10%', left: '45%', on: false },
    { id: 'hallway', top: '20%', left: '35%', on: false },
    { id: 'garage', top: '40%', left: '25%', on: false },
  ]);

  public readonly history = signal<LightHistory[]>([
    { id: '1', name: 'Living Room', action: 'ON', time: '10 min ago' },
    { id: '2', name: 'Kitchen', action: 'OFF', time: '25 min ago' },
    { id: '3', name: 'Bedroom', action: 'ON', time: '1 hour ago' },
    { id: '4', name: 'Bathroom', action: 'OFF', time: '2 hours ago' },
    { id: '5', name: 'Garage', action: 'ON', time: '3 hours ago' },
  ]);

  public hasError = signal<boolean>(false);

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

  public ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
}
