import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiOptions } from '@core/models/core.models';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

/**
 * Centralny serwis narzędziowy odpowiedzialny za komunikację HTTP z backendem API.
 *
 * ### Zasady działania:
 * - Automatycznie dokleja bazowy prefiks API (`baseUrl`) do przekazywanych ścieżek endpointów.
 * - Udostępnia metody HTTP (`GET`, `POST`, `PUT`, `DELETE`) z pełnym wsparciem generycznym.
 * - Obsługuje opcjonalne nagłówki i parametry zapytań zdefiniowane w interfejsie `ApiOptions`.
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze.*/
  private http = inject(HttpClient);

  /** Adres endpoint API. */
  private readonly baseUrl = environment.apiUrl;

  /**
   * Wysyła żądanie HTTP GET do określonego endpointu API.
   *
   * @template T Typ oczekiwanej odpowiedzi z serwera.
   * @param {string} endpoint Względna ścieżka endpointu API (np.`'lights/status/app'`).
   * @param {ApiOptions} [options] Opcjonalna konfiguracja nagłówków oraz parametrów URL.
   * @returns {Observable<T>} Strumień z odpowiedzią serwera o zadanym typie `T`.
   */
  public get<T>(endpoint: string, options?: ApiOptions): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, options);
  }

  /**
   * Wysyła żądanie HTTP POST do określonego endpointu API.
   *
   * @template T Typ oczekiwanej odpowiedzi z serwera.
   * @param {string} endpoint Względna ścieżka endpointu API (np.`'lights/update'`).
   * @param {unknown} [body] Ciało żądania przesyłane do serwera (ładunek danych).
   * @param {ApiOptions} [options] Opcjonalna konfiguracja nagłówków oraz parametrów URL.
   * @returns {Observable<T>} Strumień z odpowiedzią serwera o zadanym typie `T`.
   */
  public post<T>(endpoint: string, body?: unknown, options?: ApiOptions): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, options);
  }

  /**
   * Wysyła żądanie HTTP PUT do określonego endpointu API.
   *
   * @template T Typ oczekiwanej odpowiedzi z serwera.
   * @param {string} endpoint Względna ścieżka endpointu API (np. `'lights/rules/1'`).
   * @param {unknown} [body] Zaktualizowane dane przesyłane do serwera.
   * @param {ApiOptions} [options] Opcjonalna konfiguracja nagłówków oraz parametrów URL.
   * @returns {Observable<T>} Strumień z odpowiedzią serwera o zadanym typie `T`.
   */
  public put<T>(endpoint: string, body?: unknown, options?: ApiOptions): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, options);
  }

  /**
   * Wysyła żądanie HTTP DELETE do określonego endpointu API.
   *
   * @template T Typ oczekiwanej odpowiedzi z serwera.
   * @param {string} endpoint Względna ścieżka endpointu API (np. `'lights/rules/1'` lub `'user/logout'`).
   * @param {ApiOptions} [options] Opcjonalna konfiguracja nagłówków oraz parametrów URL.
   * @returns {Observable<T>} Strumień z odpowiedzią serwera o zadanym typie `T`.
   */
  public delete<T>(endpoint: string, options?: ApiOptions): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, options);
  }
}
