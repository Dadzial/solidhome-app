import { Component, signal, HostListener, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { LoadingService } from '@core/services/loading/loading.service';
import { SpinnerLoaderComponent } from '@shared/components/spinner-loader/spinner-loader.component';
/**
 * Główny komponent źródłowy (root) aplikacji SolidHome.
 *
 * Odpowiada za osadzenie punktu routingu (`RouterOutlet`), globalnego wskaźnika ładowania
 * oraz nasłuchiwanie zdarzeń pamięci przeglądarki w celu synchronizacji stanu sesji między kartami.
 *
 * ### Zasady działania:
 * - Warunkowo wyświetla `SpinnerLoaderComponent` w momencie, gdy `loadingService.isLoading()` jest aktywne.
 * - Nasłuchuje zdarzenia `storage` na obiekcie `window`: jeśli token autoryzacyjny zostanie usunięty w innej karcie,
 *   użytkownik zostaje natychmiast przekierowany na stronę główną (`/`).
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerLoaderComponent],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /**
   * Tytuł aplikacji.
   * @type {signal}
   */
  protected readonly title = signal('SolidHomeApp');
  /** Usługa nawigacji routera Angulara. */
  private router = inject(Router);
  /** Usługa zarządzania globalnym stanem ładowania aplikacji. */
  public loadingService = inject(LoadingService);
  /**
   * Obsługuje zdarzenie zmiany w pamięci podręcznej przeglądarki (localStorage).
   *
   * Automatycznie wylogowuje (nawiguje do `/`), jeśli klucz `'token'` został usunięty w innej karcie/oknie.
   *
   * @param {StorageEvent} event Obiekt zdarzenia zmiany pamięci magazynu przeglądarki.
   * @returns {void}
   */
  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent): void {
    if (event.key === 'token' && !event.newValue) {
      this.router.navigate(['/']);
    }
  }
}
