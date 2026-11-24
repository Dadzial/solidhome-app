import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Observable, Subject, filter, firstValueFrom, map } from 'rxjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { environment } from '@environments/environment';
import { LoginService } from '@features/auth/services/login/login.service';
import { SseMessage } from '@core/models/core.models';

/**
 * Serwis odpowiedzialny za obsługę połączenia Server-Sent Events (SSE) w aplikacji Angular.
 *
 * ### Zasady działania:
 * - Nawiązuje i utrzymuje pojedyncze połączenie SSE z backendem API (`GET /api/events`) z autoryzacją Bearer JWT.
 * - Udostępnia filtrowany strumień zdarzeń (`onEvent`) oraz strumień powiadomień o ponownym połączeniu (`onReconnect`).
 * - Samodzielnie zarządza cyklem ponownego łączenia z wykładniczym opóźnieniem (exponential backoff),
 *   każdorazowo pobierając świeży token dostępowy.
 * - W przypadku błędu `401 Unauthorized` podejmuje cichą próbę odświeżenia tokenu przez `LoginService`.
 * - Reaguje na zdarzenia przeglądarki (`online`, `offline`, `visibilitychange`), dzięki czemu
 *   po wybudzeniu telefonu z uśpienia lub przełączeniu sieci automatycznie odnawia połączenie i synchronizuje stan.
 */
@Injectable({
  providedIn: 'root',
})
export class SseService implements OnDestroy {
  /** Serwis obsługujący operacje logowania potrzebny do uzyskania i odświeżania tokenu. */
  private loginService = inject(LoginService);

  /**
   * Sygnał informujący czy połączenie SSE jest aktywne.
   * @type {signal<boolean>}
   */
  public readonly isConnected = signal<boolean>(false);

  /**
   * Sygnał informujący o trwałej utracie połączenia SSE (np. wyłączony backend lub brak sieci).
   * @type {signal<boolean>}
   */
  public readonly connectionFailed = signal<boolean>(false);

  /** Strumień wszystkich przychodzących wiadomości SSE. */
  private readonly events$ = new Subject<SseMessage<unknown>>();

  /** Strumień emitujący zdarzenie po każdym ponownym nawiązaniu połączenia SSE. */
  private readonly reconnected$ = new Subject<void>();

  /** Strumień emitujący zdarzenie po wykryciu utraty połączenia z backendem. */
  private readonly disconnected$ = new Subject<void>();

  /** Kontroler anulowania aktywnego żądania fetch. */
  private abortController: AbortController | null = null;

  /** Flaga zapobiegająca równoległemu otwieraniu wielu połączeń SSE. */
  private isConnecting = false;

  /** Flaga określająca czy serwis powinien automatycznie wznawiać połączenie po jego utracie. */
  private shouldReconnect = false;

  /** Flaga określająca czy połączenie zostało już wcześniej nawiązane w bieżącej sesji. */
  private hasConnectedBefore = false;

  /** Uchwyt timera zaplanowanej próby ponownego połączenia. */
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** Uchwyt timera watchdog wykrywającego ciche zerwanie połączenia (brak sygnału ping z serwera). */
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;

  /** Licznik kolejnych nieudanych prób ponownego połączenia (do backoffu). */
  private reconnectAttempts = 0;

  /** Znacznik czasu przejścia karty przeglądarki w tło (do wykrywania uśpienia na telefonie). */
  private hiddenAt: number | null = null;

  /** Podstawowe opóźnienie ponownego połączenia w milisekundach. */
  private readonly BASE_RECONNECT_DELAY_MS = 1000;

  /** Maksymalne opóźnienie ponownego połączenia w milisekundach. */
  private readonly MAX_RECONNECT_DELAY_MS = 15000;

  /** Próg czasu przebywania karty w tle (ms), po którym wymuszane jest odświeżenie strumienia SSE. */
  private readonly HIDDEN_RECONNECT_THRESHOLD_MS = 10000;

  /** Czas oczekiwania na dowolną wiadomość/ping z serwera (ms), po którym połączenie uznawane jest za zerwane. */
  private readonly HEARTBEAT_TIMEOUT_MS = 7000;

  /** Liczba nieudanych prób ponownego połączenia, po której zgłaszana jest awaria połączenia. */
  private readonly FAILURE_THRESHOLD = 2;

  /** Funkcja nawiązująca połączenie SSE (domyślnie `fetchEventSource`). */
  public fetchEventSource = fetchEventSource;

  /**
   * @constructor
   */
  constructor() {
    this.registerBrowserListeners();
  }

  /**
   * Inicjalizuje połączenie SSE z serwerem.
   * Jeśli token dostępu nie jest dostępny lub połączenie jest już aktywne/w trakcie nawiązywania, kończy działanie.
   *
   * @returns {Promise<void>}
   */
  public async connect(): Promise<void> {
    const token = this.loginService.getAccessToken();
    if (!token || this.isConnected() || this.isConnecting) {
      return;
    }

    this.shouldReconnect = true;
    this.isConnecting = true;
    this.clearReconnectTimer();

    const controller = new AbortController();
    this.abortController = controller;

    try {
      await this.fetchEventSource(`${environment.apiUrl}/events`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: controller.signal,
        openWhenHidden: true,

        onopen: async (response) => {
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            const shouldResync =
              this.hasConnectedBefore || this.connectionFailed() || this.reconnectAttempts > 0;

            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.connectionFailed.set(false);
            this.isConnected.set(true);
            this.resetHeartbeatWatchdog();

            if (shouldResync) {
              this.reconnected$.next();
            }
            this.hasConnectedBefore = true;
            return;
          }

          if (response.status === 401) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
              throw new Error('SSE token refreshed, reconnecting');
            }
            this.disconnect();
            throw new Error('SSE unauthorized');
          }

          throw new Error(`SSE unexpected response status: ${response.status}`);
        },

        onmessage: (msg) => {
          this.resetHeartbeatWatchdog();
          if (!msg.data) return;

          try {
            const parsed = JSON.parse(msg.data) as SseMessage<unknown>;
            this.events$.next(parsed);
          } catch (err) {
            console.warn('[SseService] Failed to parse SSE message:', err);
          }
        },

        onclose: () => {
          this.clearHeartbeatWatchdog();
          this.isConnected.set(false);
          throw new Error('SSE stream closed by server');
        },

        onerror: (err) => {
          this.clearHeartbeatWatchdog();
          this.isConnected.set(false);
          console.error('SSE connection error:', err);
          throw err;
        },
      });
    } catch {
      this.clearHeartbeatWatchdog();
      this.isConnected.set(false);
      this.isConnecting = false;
      if (this.abortController === controller) {
        this.abortController = null;
      }
      if (this.shouldReconnect && !controller.signal.aborted) {
        this.scheduleReconnect();
      }
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Zwraca obserwowalny strumień wiadomości SSE dla określonej domeny i zdarzenia.
   *
   * @template T Typ danych zawartych w wiadomości SSE.
   * @param {SseMessage['domain']} domain Domena zdarzenia (`'lights'`, `'air'`, `'hardware'`).
   * @param {string} event Nazwa zdarzenia w obrębie domeny.
   * @returns {Observable<T>} Strumień danych dla dopasowanych zdarzeń.
   */
  public onEvent<T = unknown>(domain: SseMessage['domain'], event: string): Observable<T> {
    return this.events$.asObservable().pipe(
      filter((msg) => msg.domain === domain && msg.event === event),
      map((msg) => msg.data as T),
    );
  }

  /**
   * Zwraca obserwowalny strumień powiadamiający o każdym ponownym nawiązaniu połączenia SSE.
   * Służy serwisom domenowym do automatycznej resynchronizacji stanu po utracie połączenia.
   *
   * @returns {Observable<void>}
   */
  public onReconnect(): Observable<void> {
    return this.reconnected$.asObservable();
  }

  /**
   * Zwraca obserwowalny strumień powiadamiający o wykryciu utraty połączenia SSE z backendem.
   * Służy serwisom domenowym do automatycznego wyświetlenia nakładki błędu połączenia.
   *
   * @returns {Observable<void>}
   */
  public onDisconnect(): Observable<void> {
    return this.disconnected$.asObservable();
  }

  /**
   * Wymusza natychmiastowe zresetowanie i ponowne nawiązanie połączenia SSE
   * (np. po powrocie karty z tła na telefonie lub przywróceniu połączenia z siecią).
   *
   * @returns {void}
   */
  public forceReconnect(): void {
    if (!this.shouldReconnect) {
      return;
    }

    this.clearReconnectTimer();
    this.clearHeartbeatWatchdog();
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isConnected.set(false);
    this.isConnecting = false;
    void this.connect();
  }

  /**
   * Rozłącza aktywne połączenie SSE, zatrzymuje automatyczne ponawianie i resetuje stan serwisu.
   *
   * @returns {void}
   */
  public disconnect(): void {
    this.shouldReconnect = false;
    this.hasConnectedBefore = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.clearReconnectTimer();
    this.clearHeartbeatWatchdog();

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.connectionFailed.set(false);
    this.isConnected.set(false);
  }

  /**
   * Czyści zasoby przy niszczeniu serwisu: rozłącza SSE i usuwa nasłuchiwacze przeglądarki.
   *
   * @returns {void}
   */
  public ngOnDestroy(): void {
    this.disconnect();
    this.removeBrowserListeners();
  }

  /**
   * Planuje kolejną próbę połączenia SSE z wykładniczym opóźnieniem (exponential backoff).
   *
   * @returns {void}
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    const delay = Math.min(
      this.BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      this.MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts += 1;

    if (this.reconnectAttempts >= this.FAILURE_THRESHOLD && !this.connectionFailed()) {
      this.connectionFailed.set(true);
      this.disconnected$.next();
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        void this.connect();
      }
    }, delay);
  }

  /**
   * Anuluje zaplanowany timer ponownego połączenia.
   *
   * @returns {void}
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Resetuje timer watchdog oczekujący na cykliczny sygnał `api:ping` lub inne zdarzenie z serwera.
   * Jeśli przez `HEARTBEAT_TIMEOUT_MS` nie nadejdzie żadna wiadomość, połączenie uznawane jest za martwe.
   *
   * @returns {void}
   */
  private resetHeartbeatWatchdog(): void {
    this.clearHeartbeatWatchdog();
    if (!this.shouldReconnect) {
      return;
    }

    this.heartbeatTimer = setTimeout(() => {
      this.heartbeatTimer = null;
      if (this.shouldReconnect) {
        this.isConnected.set(false);
        this.isConnecting = false;
        if (this.abortController) {
          this.abortController.abort();
          this.abortController = null;
        }
        this.scheduleReconnect();
      }
    }, this.HEARTBEAT_TIMEOUT_MS);
  }

  /**
   * Anuluje aktywny timer watchdog.
   *
   * @returns {void}
   */
  private clearHeartbeatWatchdog(): void {
    if (this.heartbeatTimer !== null) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Podejmuje próbę cichego odświeżenia tokenu JWT za pomocą `LoginService`.
   *
   * @returns {Promise<boolean>} `true`, jeśli udało się uzyskać i zapisać nowy token.
   */
  private async tryRefreshToken(): Promise<boolean> {
    if (!this.loginService.getRefreshToken()) {
      return false;
    }

    try {
      const response = await firstValueFrom(this.loginService.refreshAccessToken());
      this.loginService.saveTokens(response.token, response.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Rejestruje nasłuchiwacze zdarzeń sieci i widoczności karty przeglądarki.
   *
   * @returns {void}
   */
  private registerBrowserListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * Usuwa zarejestrowane nasłuchiwacze przeglądarki.
   *
   * @returns {void}
   */
  private removeBrowserListeners(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * Obsługuje przywrócenie połączenia internetowego przez przeglądarkę.
   *
   * @returns {void}
   */
  private readonly handleOnline = (): void => {
    if (this.shouldReconnect) {
      this.reconnectAttempts = 0;
      this.forceReconnect();
    }
  };

  /**
   * Obsługuje utratę połączenia internetowego przez przeglądarkę.
   *
   * @returns {void}
   */
  private readonly handleOffline = (): void => {
    this.clearHeartbeatWatchdog();
    this.isConnected.set(false);
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isConnecting = false;
    if (this.shouldReconnect && !this.connectionFailed()) {
      this.connectionFailed.set(true);
      this.disconnected$.next();
    }
  };

  /**
   * Obsługuje przejście aplikacji w tło i powrót na pierwszy plan (szczególnie istotne na telefonach).
   *
   * @returns {void}
   */
  private readonly handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') {
      return;
    }

    if (document.visibilityState === 'hidden') {
      this.hiddenAt = Date.now();
      return;
    }

    if (document.visibilityState === 'visible') {
      const hiddenDuration = this.hiddenAt !== null ? Date.now() - this.hiddenAt : 0;
      this.hiddenAt = null;

      if (
        this.shouldReconnect &&
        (!this.isConnected() || hiddenDuration >= this.HIDDEN_RECONNECT_THRESHOLD_MS)
      ) {
        this.reconnectAttempts = 0;
        this.forceReconnect();
      }
    }
  };
}
