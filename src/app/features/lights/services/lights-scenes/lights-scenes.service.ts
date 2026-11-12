import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { Observable } from 'rxjs';
import {
  LightScene,
  LightSceneItem,
  CreateLightScenePayload,
  DeleteLightSceneResponse,
} from '@features/lights/models/lights.models';
import { LightsControlService } from '../lights-control/lights-control.service';

/**
 * Serwis zarządzający scenami oświetlenia w systemie SolidHome.
 *
 * Utrzymuje reaktywny sygnał `scenes` z listą zdefiniowanych scen pobieranych z API backendu.
 * Odpowiada za:
 * - pobieranie listy scen z backendu (`loadScenes`)
 * - dodawanie nowej sceny (`addScene`)
 * - usuwanie wybranej sceny z optymistyczną aktualizacją (`deleteScene`)
 * - aktywację sceny (`activateScene`) przez włączenie/wyłączenie świateł w przypisanych pokojach
 *   oraz synchronizację stanu z `LightsControlService`.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsScenesService {
  /** Serwis do komunikacji z API backendu. */
  private api = inject(ApiConnectService);

  /** Serwis kontrolujący fizyczny stan oświetlenia. */
  private lightsControlService = inject(LightsControlService);

  /**
   * Sygnał przechowujący listę scen oświetleniowych.
   */
  public readonly scenes = signal<LightScene[]>([]);

  /**
   * Sygnał informujący o trwaniu operacji ładowania danych z API.
   */
  public readonly isLoading = signal<boolean>(false);

  /**
   * Sygnał informujący o błędzie komunikacji z API.
   */
  public readonly hasError = signal<boolean>(false);

  /**
   * Sygnał obliczeniowy informujący, czy lista scen jest pusta.
   */
  public readonly empty = computed(() => this.scenes().length === 0);

  constructor() {
    this.loadScenes();
  }

  /**
   * Pobiera listę wszystkich scen z API, mapuje na model widoku `LightScene`
   * i aktualizuje sygnał `scenes`.
   * @returns {void}
   */
  public loadScenes(): void {
    this.isLoading.set(true);
    this.getScenes().subscribe({
      next: (items) => {
        const mapped: LightScene[] = items.map((item) => ({
          id: item._id,
          name: item.name,
          icon: item.icon,
          rooms: item.rooms,
          active: item.active,
        }));
        this.scenes.set(mapped);
        this.hasError.set(false);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load scenes', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Dodaje nową scenę do bazy i odświeża listę scen.
   *
   * @param {CreateLightScenePayload} payload Dane nowej sceny (nazwa, ikona, pokoje).
   * @returns {void}
   */
  public addScene(payload: CreateLightScenePayload): void {
    this.postScene(payload).subscribe({
      next: () => {
        this.loadScenes();
        this.hasError.set(false);
      },
      error: (err) => {
        console.error('Failed to add scene', err);
        this.hasError.set(true);
      },
    });
  }

  /**
   * Usuwa scenę o podanym identyfikatorze z listy oraz z bazy danych.
   * Jeśli usuwana scena była aktywna, wyłącza światła w przypisanych do niej pomieszczeniach.
   * Stosuje optymistyczną aktualizację z rollbackiem w przypadku błędu.
   *
   * @param {string} id Identyfikator usuwanej sceny.
   * @returns {void}
   */
  public deleteScene(id: string): void {
    const previousScenes = this.scenes();
    const targetScene = previousScenes.find((s) => s.id === id);

    if (targetScene && targetScene.active) {
      const currentLights = this.lightsControlService.lights();
      for (const roomId of targetScene.rooms) {
        const lamp = currentLights.find((l) => l.id === roomId);
        if (lamp && lamp.on) {
          this.lightsControlService.toggleLight(roomId);
        }
      }
    }

    this.scenes.update((current) => current.filter((s) => s.id !== id));
    this.deleteSceneApi(id).subscribe({
      next: () => {
        this.hasError.set(false);
      },
      error: (err) => {
        console.error(`Failed to delete scene ${id}`, err);
        this.scenes.set(previousScenes);
        this.hasError.set(true);
      },
    });
  }

  /**
   * Przełącza stan wybranej sceny (Toggle):
   * - Jeśli scena jest nieaktywna: włącza światła w przypisanych pokojach i ustawia stan active na true.
   * - Jeśli scena jest już aktywna (drugie kliknięcie): wyłącza światła w tych pokojach i ustawia stan active na false.
   *
   * @param {string} sceneId Identyfikator przełączanej sceny.
   * @returns {void}
   */
  public activateScene(sceneId: string): void {
    const targetScene = this.scenes().find((s) => s.id === sceneId);
    if (!targetScene) {
      return;
    }

    const isCurrentlyActive = !!targetScene.active;
    const currentLights = this.lightsControlService.lights();

    if (isCurrentlyActive) {
      for (const roomId of targetScene.rooms) {
        const lamp = currentLights.find((l) => l.id === roomId);
        if (lamp && lamp.on) {
          this.lightsControlService.toggleLight(roomId);
        }
      }
    } else {
      for (const roomId of targetScene.rooms) {
        const lamp = currentLights.find((l) => l.id === roomId);
        if (lamp && !lamp.on) {
          this.lightsControlService.toggleLight(roomId);
        }
      }
    }

    this.scenes.update((current) =>
      current.map((s) => ({
        ...s,
        active: s.id === sceneId ? !isCurrentlyActive : false,
      })),
    );
  }

  /**
   * Pobiera surową listę scen z API jako Observable.
   * @returns {Observable<LightSceneItem[]>} Observable z listą scen.
   */
  public getScenes(): Observable<LightSceneItem[]> {
    return this.api.get<LightSceneItem[]>('lights/scenes');
  }

  /**
   * Tworzy nową scenę w API jako Observable.
   * @param {CreateLightScenePayload} payload Dane nowej sceny (nazwa, ikona, pokoje).
   * @returns {Observable<LightSceneItem>} Observable z utworzoną sceną.
   */
  public postScene(payload: CreateLightScenePayload): Observable<LightSceneItem> {
    return this.api.post<LightSceneItem>('lights/scenes', payload);
  }

  /**
   * Aktualizuje stan aktywności sceny w API jako Observable.
   * @param {string} id Identyfikator sceny do aktualizacji.
   * @param {boolean} [active] Opcjonalny nowy stan aktywności. Jeśli nie podany, API przełącza stan na przeciwny.
   * @returns {Observable<LightSceneItem>} Observable z zaktualizowaną sceną.
   */
  public putSceneActive(id: string, active?: boolean): Observable<LightSceneItem> {
    return this.api.put<LightSceneItem>(`lights/scenes/${id}`, active !== undefined ? { active } : {});
  }

  /**
   * Usuwa scenę w API jako Observable.
   * @param {string} id Identyfikator sceny do usunięcia.
   * @returns {Observable<DeleteLightSceneResponse>} Observable z odpowiedzią serwera po usunięciu sceny.
   */
  public deleteSceneApi(id: string): Observable<DeleteLightSceneResponse> {
    return this.api.delete<DeleteLightSceneResponse>(`lights/scenes/${id}`);
  }
}
