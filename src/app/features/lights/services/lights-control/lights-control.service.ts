import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, forkJoin } from 'rxjs';
import { Light, LightItem } from '@features/lights/models/lights.models';
import { LightsHistoryService } from '../lights-history/lights-history.service';
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
 * Zarządza reaktywnym stanem lamp (`lights`), flagą błędów (`hasError`) oraz
 * obliczanym stanem włączenia wszystkich lamp (`allLightsOn`).
 *
 * ### Zasady działania:
 * - Przechowuje listę lamp z ich koordynatami na rzucie w sygnale `lights`.
 * - `loadLights()` pobiera aktualny stan z API i synchronizuje sygnał `lights`.
 * - `toggleLight()` wykonuje optymistyczną aktualizację (optimistic update) w UI i wysyła POST do API. W razie błędu wycofuje zmianę (rollback) i ustawia `hasError`.
 * - `toggleAllLights()` przełącza wszystkie lampy równolegle za pomocą `forkJoin` z obsługą rollbacku.
 * - Po udanej zmianie stanu świateł automatycznie wywołuje `loadHistory()` z `LightsHistoryService`.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsControlService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze. */
  private http = inject(HttpClient);
  /** Inject LightsHistoryService do automatycznego odświeżania historii po akcjach użytkownika. */
  private lightsHistoryService = inject(LightsHistoryService);
  /** Adres endpoint API odpowiedzialnego za operacje związane z oświetleniem. */
  private readonly apiUrl = `${environment.apiUrl}/lights`;

  /**
   * Sygnał przechowujący listę lamp z ich pozycjami na mapie SVG i aktualnym stanem.
   * @type {signal}
   */
  public readonly lights = signal<Light[]>(INITIAL_LIGHTS);

  /**
   * Sygnał informujący o błędzie komunikacji z API (np. nieudane pobranie lub aktualizacja stanu lamp).
   * @type {signal}
   */
  public readonly hasError = signal<boolean>(false);
  /**
   * Sygnał obliczeniowy zwracający `true`, gdy wszystkie lampy są włączone.
   * @type {computed}
   */
  public readonly allLightsOn = computed(() => {
    const currentLights = this.lights();
    return currentLights.length > 0 && currentLights.every((l) => l.on);
  });
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
        this.hasError.set(false);
      },
      error: (err) => {
        console.error('Failed to load initial lights status', err);
        this.hasError.set(true);
      },
    });
  }
  /**
   * Przełącza stan pojedynczej lampy z optymistyczną aktualizacją UI i rollbackiem w razie błędu.
   *
   * @param {string} id Identyfikator (nazwa) lampy do przełączenia (np. `'living_room'`).
   * @returns {void}
   */
  public toggleLight(id: string): void {
    this.lights.update((lights) => lights.map((l) => (l.id === id ? { ...l, on: !l.on } : l)));
    const newState = this.lights().find((l) => l.id === id)?.on ?? false;

    this.updateStatus(id, newState).subscribe({
      next: () => {
        this.hasError.set(false);
        this.lightsHistoryService.loadHistory();
      },
      error: (err) => {
        console.error('Failed to update light status', err);
        this.lights.update((lights) =>
          lights.map((l) => (l.id === id ? { ...l, on: !newState } : l)),
        );
        this.hasError.set(true);
      },
    });
  }
  /**
   * Przełącza stan wszystkich lamp jednocześnie za pomocą `forkJoin` z obsługą rollbacku.
   *
   * @returns {void}
   */
  public toggleAllLights(): void {
    const targetState = !this.allLightsOn();
    const originalLights = this.lights();

    this.lights.update((lights) => lights.map((l) => ({ ...l, on: targetState })));

    const requests = originalLights.map((l) => this.updateStatus(l.id, targetState));

    forkJoin(requests).subscribe({
      next: () => {
        this.hasError.set(false);
        this.lightsHistoryService.loadHistory();
      },
      error: (err) => {
        console.error('Failed to update lights status', err);
        this.lights.set(originalLights);
        this.hasError.set(true);
      },
    });
  }
  /**
   * Pobiera aktualny stan wszystkich lamp z API jako Observable.
   *
   * @returns {Observable<LightItem[]>} Obserwowalny obiekt zawierający listę lamp z ich aktualnym stanem.
   */
  public getStatus(): Observable<LightItem[]> {
    return this.http.get<LightItem[]>(`${this.apiUrl}/status/app`);
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
    return this.http.post<LightItem>(`${this.apiUrl}/update`, payload);
  }
}
