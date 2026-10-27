import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { environment } from '@environments/environment';
import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '@features/auth/models/auth.models';
import { Observable } from 'rxjs';

/**
 * Serwis odpowiedzialny za uwierzytelnianie użytkownika oraz zarządzanie jego tożsamością na podstawie tokenu JWT.
 *
 * ### Zasady działania:
 * - Wysyła żądanie HTTP POST do endpointu API w celu zalogowania użytkownika.
 * - Po zalogowaniu token JWT jest zapisywany przez komponent w `localStorage` (Remember Me) lub `sessionStorage`.
 * - Dekoduje token JWT i udostępnia nazwę zalogowanego użytkownika przez reaktywny sygnał `userName`.
 * - Inicjalizuje dane użytkownika automatycznie przy starcie serwisu (konstruktor) oraz na żądanie.
 * - Umożliwia ciche odświeżanie tokenu dostępowego sesji za pomocą tokenu odświeżającego (Refresh Token).
 */
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze.*/
  private http = inject(HttpClient);

  /** Adres endpoint API odpowiedzialnego za operacje związane z użytkownikiem. */
  private readonly apiUrl = `${environment.apiUrl}/user`;

  /**
   * Reaktywny sygnał przechowujący nazwę aktualnie zalogowanego użytkownika.
   * Pusta wartość (`''`) oznacza brak aktywnej sesji.
   * @type {signal}
   */
  public readonly userName = signal<string>('');

  /** Konstruktor inicjalizujący metode initUserFromToken() */
  constructor() {
    this.initUserFromToken();
  }

  /**
   * Wysyła żądanie HTTP POST do endpointu API w celu uwierzytelnienia użytkownika.
   *
   * @param {LoginRequest} data Dane logowania: nazwa użytkownika, hasło i opcja zapamiętania sesji.
   * @returns {Observable<LoginResponse>} Obserwowalny obiekt zawierający token JWT po pomyślnym logowaniu.
   */
  public login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth`, data);
  }

  /**
   * Pobiera aktywny token dostępowy (Access Token) z `localStorage` lub `sessionStorage`.
   *
   * @returns {string | null} Wartość tokenu lub null, jeśli sesja nie istnieje.
   */
  public getAccessToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  /**
   * Pobiera token odświeżający (Refresh Token) z `localStorage` lub `sessionStorage`.
   *
   * @returns {string | null} Wartość refresh tokena lub null, jeśli nie jest zapisany.
   */
  public getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  }

  /**
   * Zapisuje zaktualizowane tokeny w magazynie przeglądarki, w którym pierwotnie zainicjowano sesję.
   *
   * @param {string} token Świeży token dostępowy (Access Token).
   * @param {string} [refreshToken] Opcjonalny odświeżony token odświeżający (Refresh Token).
   * @returns {void}
   */
  public saveTokens(token: string, refreshToken?: string): void {
    const isLocalStorage = !!localStorage.getItem('token') || !!localStorage.getItem('refreshToken');
    const storage = isLocalStorage ? localStorage : sessionStorage;

    storage.setItem('token', token);
    if (refreshToken) {
      storage.setItem('refreshToken', refreshToken);
    }
  }

  /**
   * Usuwa wszystkie tokeny sesji z `localStorage` i `sessionStorage` oraz resetuje sygnał tożsamości użytkownika.
   *
   * @returns {void}
   */
  public clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    this.userName.set('');
  }

  /**
   * Wysyła żądanie HTTP POST do endpointu API w celu uzyskania nowego tokenu dostępowego na podstawie zapisanego refresh tokena.
   *
   * @returns {Observable<RefreshTokenResponse>} Obserwowalny obiekt z nową parą tokenów po udanym odświeżeniu.
   */
  public refreshAccessToken(): Observable<RefreshTokenResponse> {
    const payload: RefreshTokenRequest = {
      refreshToken: this.getRefreshToken() ?? '',
    };
    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/auth/refresh`, payload);
  }

  /**
   * Odczytuje token JWT z `localStorage` lub `sessionStorage`, dekoduje go
   * i aktualizuje sygnał `userName` na podstawie zawartości tokenu.
   *
   * Jeśli token jest nieobecny lub niepoprawny, sygnał `userName` zostaje ustawiony na pusty string.
   *
   * @returns {void}
   */
  public initUserFromToken(): void {
    const token = this.getAccessToken();
    if (token) {
      try {
        const decoded = jwtDecode<{ userName: string }>(token);
        this.userName.set(decoded.userName);
      } catch (error) {
        console.error('Error in decode token', error);
      }
    } else {
      this.userName.set('');
    }
  }
}
