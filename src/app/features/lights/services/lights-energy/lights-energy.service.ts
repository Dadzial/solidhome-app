import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { LightEnergyItem } from '@features/lights/models/lights.models';

/**
 * Domyślny stan początkowy statystyk zużycia energii.
 */
const INITIAL_ENERGY: LightEnergyItem = {
  name: 'entireHouse',
  timeframe: 'today',
  totalKwh: 0,
  chartData: [],
  topRooms: [],
};

/**
 * Serwis odpowiedzialny za pobieranie i zarządzanie statystykami zużycia energii oświetlenia.
 *
 * Zarządza reaktywnym stanem danych energii (`energy`) oraz flagą błędów (`hasError`).
 *
 * ### Zasady działania:
 * - Przechowuje aktualne dane statystyk zużycia energii w sygnale `energy`.
 * - `loadEnergy()` pobiera statystyki dla wybranego okresu (`timeframe`) i pomieszczenia (`name`), aktualizując stan sygnału.
 * - Udostępnia również niskopoziomową metodę `getEnergy()` zwracającą `Observable<LightEnergyItem>`.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsEnergyService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze. */
  private http = inject(HttpClient);

  /** Adres endpoint API odpowiedzialnego za operacje związane z oświetleniem. */
  private readonly apiUrl = `${environment.apiUrl}/lights`;

  /**
   * Sygnał przechowujący aktualne statystyki zużycia energii oświetlenia.
   * @type {signal}
   */
  public readonly energy = signal<LightEnergyItem>(INITIAL_ENERGY);

  /**
   * Sygnał informujący o błędzie pobierania danych o energii z API.
   * @type {signal}
   */
  public readonly hasError = signal<boolean>(false);

  /**
   * Przechowuje ostatnio używany zakres czasu do odświeżania danych energii.
   */
  private lastTimeframe: 'today' | 'week' | 'month' = 'today';

  /**
   * Przechowuje ostatnio używaną nazwę pokoju do odświeżania danych energii.
   */
  private lastName: string = 'entireHouse';

  /**
   * Pobiera statystyki zużycia energii z API jako Observable.
   *
   * @param {'today' | 'week' | 'month'} [timeframe='today'] Wybrany zakres czasu.
   * @param {string} [name='entireHouse'] Nazwa analizowanego obszaru lub pokoju.
   * @returns {Observable<LightEnergyItem>} Obserwowalny strumień ze statystykami energii.
   */
  public getEnergy(
    timeframe: 'today' | 'week' | 'month' = 'today',
    name: string = 'entireHouse',
  ): Observable<LightEnergyItem> {
    return this.http.get<LightEnergyItem>(`${this.apiUrl}/energy`, {
      params: { timeframe, name },
    });
  }

  /**
   * Pobiera statystyki energii z API i aktualizuje sygnał `energy` oraz `hasError`.
   *
   * @param {'today' | 'week' | 'month'} [timeframe='today'] Wybrany zakres czasu.
   * @param {string} [name='entireHouse'] Nazwa analizowanego obszaru lub pokoju.
   * @returns {void}
   */
  public loadEnergy(
    timeframe: 'today' | 'week' | 'month' = 'today',
    name: string = 'entireHouse',
  ): void {
    this.lastTimeframe = timeframe;
    this.lastName = name;
    this.getEnergy(timeframe, name).subscribe({
      next: (data) => {
        this.energy.set(data);
        this.hasError.set(false);
      },
      error: (err) => {
        console.error('Failed to load lights energy stats', err);
        this.hasError.set(true);
      },
    });
  }

  /**
   * Odświeża dane energii, ponownie wywołując `loadEnergy()` z ostatnio używanymi parametrami.
   *
   * @returns {void}
   */
  public refreshEnergy(): void {
    this.loadEnergy(this.lastTimeframe, this.lastName);
  }
}
