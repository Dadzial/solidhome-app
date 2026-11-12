import { Injectable, inject, signal } from '@angular/core';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { ApiError } from '@core/models/core.models';
import { Observable } from 'rxjs';
import { LightEnergyData, EnergyTimeframe } from '@features/lights/models/lights.models';
import { HttpParams } from '@angular/common/http';

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
  /** Inject ApiConnectService do wykonywania żądań do backendu. */
  private api = inject(ApiConnectService);

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
   * Sygnał informujący o błędzie komunikacji z API (np. nieudane pobranie lub aktualizacja stanu lamp).
   * @type {signal}
   */
  public readonly hasError = signal<boolean>(false);

  /**
   * Klucz błędu translacji i18n otrzymany z API/interceptora.
   * @type {signal<string | null>}
   */
  public readonly errorMessage = signal<string | null>(null);

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
        this.hasError.set(false);
        this.errorMessage.set(null);
        this.isLoading.set(false);
      },
      error: (err: ApiError) => {
        console.error('Failed to load energy stats', err);
        this.hasError.set(true);
        this.errorMessage.set(err?.error ?? 'apiErrors.server');
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
