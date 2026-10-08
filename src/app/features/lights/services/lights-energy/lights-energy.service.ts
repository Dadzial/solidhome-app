import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { LightEnergyData, EnergyTimeframe } from '@features/lights/models/lights.models';

/**
 * Serwis odpowiedzialny za pobieranie i zarządzanie statystykami zużycia energii oświetlenia w systemie SolidHome.
 *
 * Utrzymuje reaktywny sygnał `energyData` zawierający aktualne dane wykresu,
 * całkowite zużycie oraz ranking TOP 3 największego zużycia energii.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsEnergyService {
  /** Inject HttpClient do wykonywania żądań HTTP w Angularze. */
  private http = inject(HttpClient);

  /** Adres bazowy API dla operacji świateł. */
  private readonly apiUrl = `${environment.apiUrl}/lights`;

  /**
   * Sygnał przechowujący bieżące dane statystyk zużycia energii pobrane z API.
   * @type {signal}
   */
  public readonly energyData = signal<LightEnergyData | null>(null);

  /**
   * Flaga określająca trwanie zapytania pobierania danych.
   * @type {signal}
   */
  public readonly isLoading = signal<boolean>(false);

  /** Bieżący aktywny filtr okresu czasu */
  public readonly currentTimeframe = signal<EnergyTimeframe>('today');

  /** Bieżący aktywny filtr pomieszczenia */
  public readonly currentRoom = signal<string>('entireHouse');

  /**
   * Pobiera statystyki zużycia energii z API i aktualizuje sygnał `energyData`.
   * Jeśli parametry nie zostaną przekazane, używa bieżących zapamiętanych filtrów.
   *
   * @param {EnergyTimeframe} [timeframe] Wybrany przedział czasu ('today', 'week', 'month').
   * @param {string} [room] Nazwa pomieszczenia lub 'entireHouse'.
   * @returns {void}
   */
  public loadEnergyStats(timeframe?: EnergyTimeframe, room?: string): void {
    const tf = timeframe ?? this.currentTimeframe();
    const r = room ?? this.currentRoom();
    this.currentTimeframe.set(tf);
    this.currentRoom.set(r);

    this.isLoading.set(true);
    this.getEnergyStats(tf, r).subscribe({
      next: (data) => {
        this.energyData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[LightsEnergyService] Failed to load energy stats', err);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Pobiera statystyki zużycia energii z endpointu GET /api/lights/energy jako Observable.
   *
   * @param {EnergyTimeframe} [timeframe='today'] Wybrany przedział czasu ('today', 'week', 'month').
   * @param {string} [room='entireHouse'] Nazwa pomieszczenia lub 'entireHouse'.
   * @returns {Observable<LightEnergyData>}
   */
  public getEnergyStats(
    timeframe: EnergyTimeframe = 'today',
    room: string = 'entireHouse',
  ): Observable<LightEnergyData> {
    const params = new HttpParams()
      .set('timeframe', timeframe)
      .set('room', room);

    return this.http.get<LightEnergyData>(`${this.apiUrl}/energy`, { params });
  }
}
