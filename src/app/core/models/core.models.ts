import { HttpHeaders, HttpParams } from '@angular/common/http';

/**
 * Zunifikowany model błędu zwracanego przez backend API lub normalizowanego przez `errorInterceptor`.
 *
 * @interface ApiError
 * @property error Główny kod błędu lub krótki komunikat o błędzie (np. 'Invalid credentials').
 * @property message Alternatywny, bardziej szczegółowy komunikat o błędzie z serwera.
 * @property details Szczegółowe informacje o błędach walidacji (np. lista niepoprawnych pól).
 * @property value Błędna wartość przesłana w żądaniu, która spowodowała błąd.
 */
export interface ApiError {
  error?: string;
  message?: string;
  details?: string | string[];
  value?: string;
}

/**
 * Opcje konfiguracyjne dla zapytań HTTP w `ApiConnectService`.
 *
 * @interface ApiOptions
 * @property headers Opcjonalne nagłówki HTTP.
 * @property params Opcjonalne parametry zapytania (query params).
 */
export interface ApiOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?:
    HttpParams | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
}

/**
 * Zunifikowany model wiadomości przesyłanej przez SSE (Server-Sent Events) z serwera.
 *
 * @interface SseMessage
 * @property domain Domeny, do której odnosi się wiadomość (np. 'lights', 'air').
 * @property event Typ zdarzenia w domenie.
 * @property data Dane przesyłane w wiadomości dowolnego typu.
 * @property timestamp Znacznik czasu, kiedy wiadomość została wygenerowana na serwerze.
 */
export interface SseMessage<T = unknown> {
  domain: 'lights' | 'air' | 'hardware' | 'api';
  event: string;
  data: T;
  timestamp: string;
}

/**
 * Model zdarzenia statusu fizycznej płytki mikrokontrolera odbieranego przez SSE.
 *
 * @interface BoardStatusEvent
 * @property online Flaga informująca, czy płytka przesyła sygnały heartbeat.
 */
export interface BoardStatusEvent {
  online: boolean;
}
