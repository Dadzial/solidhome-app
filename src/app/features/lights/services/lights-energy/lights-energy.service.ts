import { Injectable, inject, signal } from '@angular/core';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { SseService } from '@core/services/sse/sse.service';
import { ApiError } from '@core/models/core.models';
import { Observable } from 'rxjs';
import { LightEnergyData, EnergyTimeframe } from '@features/lights/models/lights.models';
import { HttpParams } from '@angular/common/http';

/**
 * Serwis odpowiedzialny za pobieranie i zarządzanie statystykami zużycia energii oświetlenia w systemie SolidHome.
 *
 * ### Zasady działania:
 * - Utrzymuje reaktywny sygnał `energyData` zawierający aktualne dane wykresu,
 *   całkowite zużycie oraz ranking TOP 3 największego zużycia energii.
 * - Subskrybuje zdarzenia SSE `lights:energy_updated`, aktualizując widok na żywo bez cyklicznego odpytywania HTTP.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsEnergyService {
  /** Inject ApiConnectService do wykonywania żądań do backendu. */
  private api = inject(ApiConnectService);

  /** Inject SseService do odbierania aktualizacji statystyk energii na żywo przez SSE. */
  private sseService = inject(SseService);

  /**
   * Sygnał przechowujący bieżące dane statystyk zużycia energii pobrane z API.
   * @type {signal}
   */
  public readonly energyData = signal<LightEnergyData | null>(null);

  /** Bieżący aktywny filtr okresu czasu */
  public readonly currentTimeframe = signal<EnergyTimeframe>('today');

  /** Bieżący aktywny filtr pomieszczenia */
  public readonly currentRoom = signal<string>('entireHouse');

  /**
   * Klucz błędu translacji i18n otrzymany z API/interceptora.
   * @type {signal<string | null>}
   */
  public readonly errorMessage = signal<string | null>(null);

  /**
   * @constructor
   */
  constructor() {
    this.listenToSseUpdates();
  }

  /**
   * Subskrybuje zdarzenia SSE dla domeny świateł (`energy_updated`).
   * Dla widoku `today` + `entireHouse` bezpośrednio aktualizuje sygnał `energyData` bez zapytania HTTP;
   * dla pojedynczego pokoju w widoku `today` odświeża dedykowane dane tego pokoju.
   *
   * @returns {void}
   */
  public listenToSseUpdates(): void {
    this.sseService.onEvent<LightEnergyData>('lights', 'energy_updated').subscribe((data) => {
      if (this.currentTimeframe() === 'today') {
        if (this.currentRoom() === 'entireHouse') {
          this.energyData.set(data);
          this.errorMessage.set(null);
        } else {
          this.loadEnergyStats();
        }
      }
    });

    this.sseService.onDisconnect().subscribe(() => {
      if (!this.errorMessage()) {
        this.errorMessage.set('apiErrors.network');
      }
    });
  }

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

    this.getEnergyStats(tf, r).subscribe({
      next: (data) => {
        this.energyData.set(data);
        this.errorMessage.set(null);
      },
      error: (err: ApiError) => {
        console.error('Failed to load energy stats', err);
        this.errorMessage.set(err?.error ?? 'apiErrors.server');
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
    room = 'entireHouse',
  ): Observable<LightEnergyData> {
    const params = new HttpParams().set('timeframe', timeframe).set('room', room);

    return this.api.get<LightEnergyData>('lights/energy', { params });
  }

  /**
   * Resetuje statystyki zużycia energii z endpointu DELETE /api/lights/energy/reset
   * i zwraca Observable
   *
   * @returns {Observable<{ message: string; deletedCount: number }>}
   */
  public resetEnergyStats(): Observable<{ message: string; deletedCount: number }> {
    return this.api.delete<{ message: string; deletedCount: number }>('lights/energy/reset');
  }
}
