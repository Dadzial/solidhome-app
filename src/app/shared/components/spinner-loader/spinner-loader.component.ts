import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
/**
 * Komponent pełnoekranowego ładowania.
 *
 * Wyświetla animowany spinner, pulsujące logo aplikacji oraz przetłumaczony tytuł.
 *
 * ### Zasady działania:
 * - Renderowany globalnie w `App` komponentu na podstawie stanu `LoadingService.isLoading()`.
 * - Posiada półprzezroczyste tło z efektem rozmycia (`backdrop-blur-md`).
 */
@Component({
  selector: 'app-spinner-loader',
  imports: [TranslateModule],
  standalone: true,
  templateUrl: './spinner-loader.component.html',
  styles: ``,
})
export class SpinnerLoaderComponent {}
