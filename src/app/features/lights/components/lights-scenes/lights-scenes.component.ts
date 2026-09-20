import { Component , signal } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-lights-scenes',
  imports: [SvgIconComponent, TranslatePipe],
  templateUrl: './lights-scenes.component.html',
  styles: ``,
})
export class LightsScenesComponent {
  public enableAddScene = signal(false);

  public toggleAddScene(): void {
    this.enableAddScene.update((value) => !value);
  }
}
