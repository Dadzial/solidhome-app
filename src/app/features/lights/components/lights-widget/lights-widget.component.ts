import { Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { NgOptimizedImage, NgClass } from '@angular/common';

interface Light {
  id: string;
  top: string;
  left: string;
  on: boolean;
}

@Component({
  selector: 'app-lights-widget',
  imports: [TranslatePipe, SvgIconComponent, NgOptimizedImage, NgClass],
  templateUrl: './lights-widget.component.html',
  styles: ``,
})
export class LightsWidgetComponent {
  public readonly lights = signal<Light[]>([
    { id: 'garage', top: '40%', left: '20%', on: false },
    { id: 'kitchen', top: '10%', left: '45%', on: false },
    { id: 'hall', top: '20%', left: '35%', on: false },
    { id: 'bedroom', top: '45%', left: '70%', on: false },
    { id: 'boiler', top: '65%', left: '55%', on: false },
    { id: 'room', top: '50%', left: '40%', on: false }
  ]);

  public toggleLight(id: string) {
    this.lights.update(lights =>
      lights.map(l => l.id === id ? { ...l, on: !l.on } : l)
    );
  }
}
