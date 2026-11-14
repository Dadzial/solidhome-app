import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { environment } from '@environments/environment';
import { LoginService } from '@features/auth/services/login/login.service';
import { SseMessage } from '@core/models/core.models';

@Injectable({
  providedIn: 'root',
})
export class SseService implements OnDestroy {
  /** Serwis obsługujący operacje logowania potrzebny do uzyskania tokenu */
  private loginService = inject(LoginService);

  /** Sygnał informujący czy połączenie SSE jest aktywne */
  public readonly isConnected = signal<boolean>(false);

  /** Strumień wszystkich przychodzących wiadomości */
  private readonly events$ = new Subject<SseMessage<unknown>>();

  /** Kontroler anulowania żądania fetch */
  private abortController: AbortController | null = null;

  /** Funkcja nawiązująca połączenie SSE (domyślnie fetchEventSource). */
  public fetchEventSource = fetchEventSource;

  /**
   * Metoda inicjalizująca połączenie SSE z serwerem. Jeśli token dostępu nie
   * jest dostępny lub połączenie jest już aktywne, metoda kończy działanie.
   *
   * @returns Promise<void>
   */
  public async connect(): Promise<void> {
    const token = this.loginService.getAccessToken();
    if (!token || this.isConnected()) {
      return;
    }

    this.abortController = new AbortController();
    try {
      await this.fetchEventSource(`${environment.apiUrl}/events`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: this.abortController.signal,
        openWhenHidden: true,

        onopen: async (response) => {
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            this.isConnected.set(true);
            return;
          }
          this.disconnect();
        },
        onmessage: (msg) => {
          if (!msg.data) return;

          try {
            const parsed = JSON.parse(msg.data) as SseMessage<unknown>;
            this.events$.next(parsed);
          } catch (err) {
            console.warn('[SseService] Failed to parse SSE message:', err);
          }
        },

        onclose: () => {
          this.isConnected.set(false);
        },
        onerror: (err) => {
          this.isConnected.set(false);
          console.error('SSE connection error:', err);
        },
      });
    } catch {
      this.isConnected.set(false);
    }
  }

  /**
   * Metoda zwracająca obserwowalny strumień wiadomości SSE dla określonej domeny i zdarzenia.
   * Filtruje wiadomości przychodzące i zwraca tylko te, które pasują do podanej domeny i zdarzenia.
   *
   * @template T Typ danych zawartych w wiadomości SSE
   * @param domain
   * @param event
   * @returns Observable<T>
   */
  public onEvent<T = unknown>(domain: SseMessage['domain'], event: string): Observable<T> {
    return this.events$.asObservable().pipe(
      filter((msg) => msg.domain === domain && msg.event === event),
      map((msg) => msg.data as T),
    );
  }

  /**
   * Metoda rozłączająca połączenie SSE. Anuluje żądanie fetch i ustawia sygnał isConnected na false.
   *
   * @returns {void}
   */
  public disconnect(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isConnected.set(false);
  }

  /**
   * Metoda wywoływana przy niszczeniu serwisu. Rozłącza połączenie SSE.
   *
   * @returns {void}
   */
  public ngOnDestroy(): void {
    this.disconnect();
  }
}
