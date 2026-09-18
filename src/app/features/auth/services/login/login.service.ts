import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { environment } from '@environments/environment';
import { LoginRequest, LoginResponse } from '@features/auth/models/auth.models';
import { Observable } from 'rxjs';
/**
 * Serwis odpowiedzialny za uwierzytelnianie użytkownika oraz zarządzanie jego tożsamością na podstawie tokenu JWT.
 *
 * ### Zasady działania:
 * - Wysyła żądanie HTTP POST do endpointu API w celu zalogowania użytkownika.
 * - Po zalogowaniu token JWT jest zapisywany przez komponent w `localStorage` (Remember Me) lub `sessionStorage`.
 * - Dekoduje token JWT i udostępnia nazwę zalogowanego użytkownika przez reaktywny sygnał `userName`.
 * - Inicjalizuje dane użytkownika automatycznie przy starcie serwisu (konstruktor) oraz na żądanie.
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
   * Odczytuje token JWT z `localStorage` lub `sessionStorage`, dekoduje go
   * i aktualizuje sygnał `userName` na podstawie zawartości tokenu.
   *
   * Jeśli token jest nieobecny lub niepoprawny, sygnał `userName` zostaje ustawiony na pusty string.
   *
   * @returns {void}
   */
  public initUserFromToken(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
