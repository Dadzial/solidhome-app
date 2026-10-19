import { Injectable, inject, signal, computed } from '@angular/core';
import { LightScene } from '@features/lights/models/lights.models';
import { LightsControlService } from '../lights-control/lights-control.service';

/** Klucz używany do zapisu scen w localStorage */
const SCENES_STORAGE_KEY = 'solid_home_light_scenes';

/**
 * Serwis zarządzający scenami oświetlenia w systemie SolidHome.
 *
 * Utrzymuje reaktywny sygnał `scenes` z listą zdefiniowanych scen, zapisywanych w `localStorage`.
 * Odpowiada za:
 * - dodawanie nowej sceny (`addScene`)
 * - usuwanie wybranej sceny (`deleteScene`)
 * - błyskawiczną aktywację sceny (`activateScene`) przez włączenie świateł w przypisanych pokojach
 *   oraz opcjonalne wygaszenie pozostałych za pośrednictwem `LightsControlService`.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsScenesService {
  /** Serwis kontrolujący fizyczny stan oświetlenia. */
  private lightsControlService = inject(LightsControlService);

  /**
   * Sygnał przechowujący listę scen oświetleniowych.
   * Inicjalizowany danymi z localStorage (domyślnie pusta tablica).
   */
  public readonly scenes = signal<LightScene[]>(this.loadFromStorage());

  /**
   * Sygnał obliczeniowy informujący, czy lista scen jest pusta.
   */
  public readonly empty = computed(() => this.scenes().length === 0);

  /**
   * Zwraca listę scen zapisaną w localStorage lub pustą listę.
   * @private
   */
  private loadFromStorage(): LightScene[] {
    try {
      const stored = localStorage.getItem(SCENES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('[LightsScenesService] Failed to load scenes from localStorage', e);
    }
    return [];
  }

  /**
   * Zapisuje bieżący stan sygnału `scenes` do localStorage.
   * @private
   * @returns {void}
   */
  private saveToStorage(scenesList: LightScene[]): void {
    try {
      localStorage.setItem(SCENES_STORAGE_KEY, JSON.stringify(scenesList));
    } catch (e) {
      console.error('[LightsScenesService] Failed to save scenes to localStorage', e);
    }
  }

  /**
   * Dodaje nową scenę do listy i zapisuje stan w localStorage.
   *
   * @param {Omit<LightScene, 'id'>} payload Dane nowej sceny (nazwa, ikona, pokoje).
   * @returns {void}
   */
  public addScene(payload: Omit<LightScene, 'id' | 'active'>): void {
    const newScene: LightScene = {
      id: `scene_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: payload.name.trim(),
      icon: payload.icon,
      rooms: [...payload.rooms],
      active: false,
    };

    this.scenes.update((current) => {
      const updated = [newScene, ...current];
      this.saveToStorage(updated);
      return updated;
    });
  }

  /**
   * Usuwa scenę o podanym identyfikatorze z listy oraz z localStorage.
   * Jeśli usuwana scena była aktywna, wyłącza światła w przypisanych do niej pomieszczeniach.
   *
   * @param {string} id Identyfikator usuwanej sceny.
   * @returns {void}
   */
  public deleteScene(id: string): void {
    const targetScene = this.scenes().find((s) => s.id === id);
    if (targetScene && targetScene.active) {
      const currentLights = this.lightsControlService.lights();
      for (const roomId of targetScene.rooms) {
        const lamp = currentLights.find((l) => l.id === roomId);
        if (lamp && lamp.on) {
          this.lightsControlService.toggleLight(roomId);
        }
      }
    }

    this.scenes.update((current) => {
      const updated = current.filter((s) => s.id !== id);
      this.saveToStorage(updated);
      return updated;
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
}
