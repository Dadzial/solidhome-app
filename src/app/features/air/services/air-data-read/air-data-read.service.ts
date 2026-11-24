import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { ApiError } from '@core/models/core.models';
import { SseService } from '@core/services/sse/sse.service';
import { HardwareStatusService } from '@core/services/hardware-status/hardware-status.service';
import { AirMeasurement } from '@features/air/models/air.models';

/**
 * Serwis odpowiedzialny za pobieranie i synchronizację danych jakości powietrza w aplikacji.
 *
 * ### Zasady działania:
 * - pobieranie bieżącego odczytu z API (`loadCurrentAir`)
 * - nasłuchiwanie aktualizacji na żywo przez SSE (`listenToSseUpdates`)
 * - udostępnianie wyselekcjonowanych sygnałów (temperatura, ciśnienie, wilgotność) dla widżetów
 * - monitorowanie stanu sprzętu (online/offline) oraz obsługę błędów i ładowania
 */
@Injectable({
  providedIn: 'root',
})
export class AirDataReadService {
  /** Serwis do komunikacji z API backendu. */
  private api = inject(ApiConnectService);

  /** Serwis do obsługi Server-Sent Events na żywo. */
  private sseService = inject(SseService);

  /** Serwis monitorujący fizyczny stan płytki sterownika (online/offline). */
  public hardwareStatus = inject(HardwareStatusService);

  /**
   * Główny sygnał przechowujący bieżący, pełny obiekt pomiaru powietrza.
   * @type {signal}
   */
  public readonly currentAir = signal<AirMeasurement | null>(null);

  /**
   * Klucz błędu translacji i18n otrzymany z API (lub null w przypadku braku błędu).
   * @type {signal<string | null>}
   */
  public readonly errorMessage = signal<string | null>(null);

  /**
   * Sygnał obliczeniowy zwracający bieżącą temperaturę powietrza w stopniach Celsjusza.
   * @type {computed}
   */
  public readonly temperature = computed(() => this.currentAir()?.temperature ?? null);

  /**
   * Sygnał obliczeniowy zwracający bieżące ciśnienie atmosferyczne w hPa.
   * @type {computed}
   */
  public readonly pressure = computed(() => this.currentAir()?.pressure ?? null);

  /**
   * Sygnał obliczeniowy zwracający bieżącą wilgotność powietrza w procentach.
   * @type {computed}
   */
  public readonly humidity = computed(() => this.currentAir()?.humidity ?? null);

  /**
   * Reaktywny stan obecności fizycznej płytki sterownika w sieci domowej.
   */
  public readonly isBoardOnline = this.hardwareStatus.isBoardOnline;

  /**
   * @constructor
   */
  constructor() {
    this.listenToSseUpdates();
  }

  /**
   * Pobiera najświeższy odczyt parametrów powietrza z endpointu REST API.
   * Aktualizuje sygnały `currentAir` i `errorMessage`.
   *
   * @returns {void}
   */
  public loadCurrentAir(): void {
    this.api.get<AirMeasurement>('air/current').subscribe({
      next: (data) => {
        this.currentAir.set(data);
        this.errorMessage.set(null);
      },
      error: (err: ApiError) => {
        this.errorMessage.set(err?.error ?? 'apiErrors.server');
      },
    });
  }

  /**
   * Subskrybuje zdarzenia SSE dla domeny 'air' i typu 'air_updated'.
   * Na bieżąco aktualizuje stan w sygnale `currentAir` po każdym nowym pomiarze z czujnika
   * oraz odświeża bieżący pomiar po ponownym nawiązaniu połączenia SSE.
   *
   * @returns {void}
   */
  public listenToSseUpdates(): void {
    this.sseService.onEvent<AirMeasurement>('air', 'air_updated').subscribe((event) => {
      this.currentAir.set(event);
      this.errorMessage.set(null);
    });

    this.sseService.onReconnect().subscribe(() => {
      this.loadCurrentAir();
    });

    this.sseService.onDisconnect().subscribe(() => {
      if (!this.errorMessage()) {
        this.errorMessage.set('apiErrors.network');
      }
    });
  }
}
