import { Injectable , signal } from '@angular/core';
/**
 * Serwis odpowiedzialny za wywołanie loading screen w aplikacji.
 *
 * ### Zasady działania:
 * - Przechowuje stan ładowania w reaktywnym sygnale `isLoading`.
 * - Udostępnia metody do pokazywania i ukrywania okna ładowania.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  /**
   * Reaktywny sygnał przechowujący aktualny stan ładowania aplikacji.
   * @type signal
   */
  public isLoading = signal<boolean>(false);
  /**
   * Ustawia sygnał isLoading na true, przez co ekran ładowania będzie widoczny w aplikacji.
   * @returns void
   */
  public showLoadingWindow(): void {
    this.isLoading.set(true);
  }
  /**
   * Ustawia sygnał isLoading na false, przez co ekran ładowania nie będzie widoczny w aplikacji.
   * @returns void
   */
  public hideLoadingWindow(): void {
    this.isLoading.set(false);
  }
}
