import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { ApiError } from '@core/models/core.models';
import { Observable, forkJoin } from 'rxjs';
import { Light, LightItem, LightUpdatedEvent } from '@features/lights/models/lights.models';
import { LightsHistoryService } from '../lights-history/lights-history.service';
import { LightsEnergyService } from '../lights-energy/lights-energy.service';
import { SseService } from '@core/services/sse/sse.service';
import { HardwareStatusService } from '@core/services/hardware-status/hardware-status.service';

/**
 * Domyślne rozmieszczenie lamp na rzucie SVG (home_preview.png)
 * @type {Light[]}
 */
const INITIAL_LIGHTS: Light[] = [
  { id: 'living_room', y: 500, x: 1248, on: false },
  { id: 'kitchen', y: 780, x: 1110, on: false },
  { id: 'boiler_room', y: 290, x: 868, on: false },
  { id: 'bathroom', y: 180, x: 970, on: false },
  { id: 'hallway', y: 590, x: 890, on: false },
  { id: 'garage', y: 450, x: 655, on: false },
];

/**
 * Serwis odpowiedzialny za pobieranie i aktualizację stanu świateł w aplikacji.
 *
 * Zarządza reaktywnym stanem lamp (`lights`), błędem (`errorMessage`) oraz
 * obliczanym stanem włączenia wszystkich lamp (`allLightsOn`).
 *
 * ### Zasady działania:
 * - Przechowuje listę lamp z ich koordynatami na rzucie w sygnale `lights`.
 * - `loadLights()` pobiera aktualny stan z API i synchronizuje sygnał `lights`.
 * - `toggleLight()` wykonuje optymistyczną aktualizację (optimistic update) w UI i wysyła POST do API.
 *    W razie błędu wycofuje zmianę (rollback) i ustawia `errorMessage`.
 * - `toggleAllLights()` przełącza wszystkie lampy równolegle za pomocą `forkJoin` z obsługą rollbacku.
 * - Po udanej zmianie stanu świateł automatycznie wywołuje `loadHistory()` z `LightsHistoryService`.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsControlService {
  /** Inject ApiConnectService do wykonywania żądań do backendu. */
  private api = inject(ApiConnectService);

  /** Inject SseService do subskrybowania zdarzeń SSE z backendu. */
  private sseService = inject(SseService);

  /** Inject LightsHistoryService do automatycznego odświeżania historii po akcjach użytkownika. */
  private lightsHistoryService = inject(LightsHistoryService);

  /** Inject LightsEnergyService do automatycznego odświeżania zużycia energii po zmianie stanu świateł. */
  private lightsEnergyService = inject(LightsEnergyService);

  /** Inject HardwareStatusService do monitorowania stanu fizycznej płytki sterownika. */
  public hardwareStatusService = inject(HardwareStatusService);

  /**
   * Sygnał przechowujący listę lamp z ich pozycjami na mapie SVG i aktualnym stanem.
   * @type {signal}
   */
  public readonly lights = signal<Light[]>(INITIAL_LIGHTS);

  /**
   * Klucz błędu translacji i18n otrzymany z API/interceptora (lub null w przypadku braku błędu).
   * @type {signal<string | null>}
   */
  public readonly errorMessage = signal<string | null>(null);

  /**
   * Sygnał obliczeniowy zwracający `true`, gdy wszystkie lampy są włączone.
   * @type {computed}
   */
  public readonly allLightsOn = computed(() => {
    const currentLights = this.lights();
    return currentLights.length > 0 && currentLights.every((l) => l.on);
  });

  /**
   * @constructor
   */
  constructor() {
    this.listenToSseUpdates();
  }

  /**
   * Pobiera aktualny stan wszystkich lamp z API i aktualizuje sygnał `lights`.
   *
   * @returns {void}
   */
  public loadLights(): void {
    this.getStatus().subscribe({
      next: (items) => {
        this.lights.update((lights) =>
          lights.map((light) => {
            const found = items.find((item) => item.name === light.id);
            return found ? { ...light, on: found.state === 1 } : light;
          }),
        );
        this.errorMessage.set(null);
      },
      error: (err: ApiError) => {
        console.error('Failed to load initial lights status', err);
        this.errorMessage.set(err?.error ?? 'apiErrors.server');
      },
    });
  }

  /**
   * Przełącza stan pojedynczej lampy z optymistyczną aktualizacją UI i rollbackiem w razie błędu.
   *
   * @param {string} id Identyfikator (nazwa) lampy do przełączenia (np. `'living_room'`)
   * oraz zapisu stanu energii.
   * @returns {void}
   */
  public toggleLight(id: string): void {
    if (!this.hardwareStatusService.isBoardOnline()) {
      return;
    }

    this.lights.update((lights) => lights.map((l) => (l.id === id ? { ...l, on: !l.on } : l)));
    const newState = this.lights().find((l) => l.id === id)?.on ?? false;

    this.updateStatus(id, newState).subscribe({
      next: () => {
        this.errorMessage.set(null);
        this.lightsHistoryService.loadHistory();
        this.lightsEnergyService.loadEnergyStats();
      },
      error: (err: ApiError) => {
        console.error('Failed to update light status', err);
        this.lights.update((lights) =>
          lights.map((l) => (l.id === id ? { ...l, on: !newState } : l)),
        );
        this.errorMessage.set(err?.error ?? 'apiErrors.server');
      },
    });
  }

  /**
   * Przełącza stan wszystkich lamp jednocześnie za pomocą `forkJoin` oraz zapisuje stan energii z obsługą rollbacku.
   *
   * @returns {void}
   */
  public toggleAllLights(): void {
    if (!this.hardwareStatusService.isBoardOnline()) {
      return;
    }

    const targetState = !this.allLightsOn();
    const originalLights = this.lights();

    this.lights.update((lights) => lights.map((l) => ({ ...l, on: targetState })));

    const requests = originalLights.map((l) => this.updateStatus(l.id, targetState));

    forkJoin(requests).subscribe({
      next: () => {
        this.errorMessage.set(null);
        this.lightsHistoryService.loadHistory();
        this.lightsEnergyService.loadEnergyStats();
      },
      error: (err: ApiError) => {
        console.error('Failed to update lights status', err);
        this.lights.set(originalLights);
        this.errorMessage.set(err?.error ?? 'apiErrors.server');
      },
    });
  }

  /**
   * Pobiera aktualny stan wszystkich lamp z API jako Observable.
   *
   * @returns {Observable<LightItem[]>} Obserwowalny obiekt zawierający listę lamp z ich aktualnym stanem.
   */
  public getStatus(): Observable<LightItem[]> {
    return this.api.get<LightItem[]>('lights/status/app');
  }

  /**
   * Wysyła żądanie HTTP POST do API w celu aktualizacji stanu wybranej lampy.
   *
   * @param {string} name Identyfikator (nazwa) lampy do zaktualizowania (np. `'living_room'`).
   * @param {boolean} state Nowy stan lampy: `true` — włącz, `false` — wyłącz.
   * @returns {Observable<LightItem>} Obserwowalny obiekt zawierający zaktualizowane dane lampy.
   */
  public updateStatus(name: string, state: boolean): Observable<LightItem> {
    const payload = {
      name,
      state: state ? 1 : 0,
    };
    return this.api.post<LightItem>('lights/update', payload);
  }

  /**
   * Subskrybuje zdarzenia SSE dla domeny świateł i na bieżąco aktualizuje stan lamp w sygnale `lights`.
   * Po ponownym nawiązaniu połączenia SSE automatycznie resynchronizuje stan lamp, historii i energii.
   *
   * @returns {void}
   */
  public listenToSseUpdates(): void {
    this.sseService.onEvent<LightUpdatedEvent>('lights', 'light_updated').subscribe((event) => {
      this.lights.update((currentLights) =>
        currentLights.map((light) =>
          light.id === event.name ? { ...light, on: Boolean(event.state) } : light,
        ),
      );
      this.lightsHistoryService.loadHistory();
      this.lightsEnergyService.loadEnergyStats();
    });

    this.sseService.onReconnect().subscribe(() => {
      this.loadLights();
      this.lightsHistoryService.loadHistory();
      this.lightsEnergyService.loadEnergyStats();
    });

    this.sseService.onDisconnect().subscribe(() => {
      if (!this.errorMessage()) {
        const errorKey =
          typeof navigator !== 'undefined' && !navigator.onLine
            ? 'apiErrors.network'
            : 'apiErrors.server';
        this.errorMessage.set(errorKey);
      }
    });
  }
}
