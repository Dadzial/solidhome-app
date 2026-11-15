import { Injectable, inject, signal } from '@angular/core';
import { ApiConnectService } from '../api/api-connect.service';
import { SseService } from '../sse/sse.service';
import { LoginService } from '@features/auth/services/login/login.service';
import { BoardStatusEvent } from '@core/models/core.models';

/**
 * Serwis monitorujący stan fizycznej płytki mikrokontrolera (NXP).
 *
 * ### Zasady działania:
 * - Przechowuje stan płytki w reaktywnym sygnale `isBoardOnline`.
 * - Pobiera początkowy status płytki z backendu przy starcie aplikacji.
 * - Subskrybuje zdarzenia SSE dla domeny 'hardware' i typu 'status', aby aktualizować stan płytki w czasie rzeczywistym.
 * - Jeśli płytka jest offline, sygnał `isBoardOnline` jest ustawiany na `false`.
 */
@Injectable({
  providedIn: 'root',
})
export class HardwareStatusService {
  /** Serwis komunikacji HTTP z API */
  private api = inject(ApiConnectService);

  /** Serwis zdarzeń Server-Sent Events */
  private sseService = inject(SseService);

  /** Serwis autoryzacji do weryfikacji aktywnej sesji użytkownika */
  private loginService = inject(LoginService);

  /**
   * Sygnał informujący o stanie fizycznej płytki mikrokontrolera.
   * `true` = płytka działa i przesyła heartbeat, `false` = brak zasilania lub łączności.
   */
  public readonly isBoardOnline = signal<boolean>(true);

  /**
   * @constructor
   */
  constructor() {
    if (this.loginService.getAccessToken()) {
      this.checkInitialStatus();
    }
    this.listenToBoardStatusEvents();
  }

  /**
   * Pobiera początkowy status płytki z backendu.
   *
   * @returns {void}
   */
  public checkInitialStatus(): void {
    if (!this.loginService.getAccessToken()) {
      return;
    }

    this.api.get<{ online: boolean }>('hardware/status').subscribe({
      next: (res) => {
        if (typeof res?.online === 'boolean') {
          this.isBoardOnline.set(res.online);
        }
      },
      error: () => {
        // ignore
      },
    });
  }

  /**
   * Subskrybuje zdarzenia SSE dla domeny 'hardware' i typu 'status'.
   * @returns {void}
   */
  private listenToBoardStatusEvents(): void {
    this.sseService.onEvent<BoardStatusEvent>('hardware', 'status').subscribe((event) => {
      if (typeof event?.online === 'boolean') {
        this.isBoardOnline.set(event.online);
      }
    });
  }
}
