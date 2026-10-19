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
  /**
   * Flaga sterująca widocznością formularza dodawania nowej sceny.
   */
  public enableAddScene = signal(false);

  /**
   * Dostępne ścieżki do ikon scen w formacie SVG.
   */
  public readonly sceneIcons = [
    'assets/icons/heart.svg',
    'assets/icons/film.svg',
    'assets/icons/work.svg',
  ];

  /**
   * Sygnał przechowujący aktualnie wybraną ikonę sceny (domyślnie pierwsza z listy).
   */
  public selectedIcon = signal<string>(this.sceneIcons[0]);

  /**
   * Przełącza widoczność formularza dodawania nowej sceny.
   */
  public toggleAddScene(): void {
    this.enableAddScene.update((value) => !value);
  }

  /**
   * Wybiera ikonę dla tworzonej sceny.
   *
   * @param {string} icon Ścieżka do wybranej ikony SVG.
   */
  public selectIcon(icon: string): void {
    this.selectedIcon.set(icon);
  }
}
