import { Component, inject } from '@angular/core';
import { ThemeService } from '@core/services/theme/theme.service';
import { SvgIconComponent } from 'angular-svg-icon';
/**
 * Komponent przycisku przełączania motywu graficznego aplikacji (jasny / ciemny).
 *
 * Wyświetla ikonę słońca lub księżyca w zależności od aktywnego motywu.
 *
 * ### Zasady działania:
 * - Korzysta z `ThemeService` do pobierania bieżącego stanu motywu i jego przełączania (`toggleTheme`).
 * - Dynamicznie zmienia wyświetlaną ikonę SVG na podstawie sygnału `theme ()`.
 */
@Component({
  selector: 'app-theme-button',
  standalone: true,
  imports: [SvgIconComponent],
  templateUrl: './theme-button.component.html',
  styles: ``,
})
export class ThemeButtonComponent {
  /** Serwis zarządzający motywem jasny lub ciemny. */
  public themeService = inject(ThemeService);
}
