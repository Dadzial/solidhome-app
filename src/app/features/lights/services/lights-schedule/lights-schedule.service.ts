import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, tap } from 'rxjs';
import {
  LightScheduleRule,
  LightScheduleRuleItem,
  CreateScheduleRulePayload,
  DeleteScheduleRuleResponse,
} from '@features/lights/models/lights.models';

/**
 * Serwis odpowiedzialny za zarządzanie regułami harmonogramu oświetlenia w systemie SolidHome.
 *
 * Utrzymuje reaktywny sygnał `schedule` z listą zdefiniowanych reguł oświetlenia,
 * flagę ładowania `isLoading` oraz flagę błędów `hasError`.
 *
 * ### Zasady działania:
 * - `loadRules()` pobiera listę reguł z API, mapuje na model widoku `LightScheduleRule` i aktualizuje sygnał `schedule`.
 * - `createRule()` wysyła nową regułę do API i po sukcesie automatycznie odświeża listę reguł.
 * - `toggleRuleActive()` wykonuje optymistyczną aktualizację stanu `active` w UI i wysyła PUT do API z obsługą wycofania zmian (rollback).
 * - `deleteRule()` wykonuje optymistyczne usunięcie reguły z UI i wysyła DELETE do API z obsługą wycofania zmian (rollback).
 * - Udostępnia również niskopoziomowe metody `getRules()`, `postRule()`, `putRuleActive()` oraz `deleteRuleApi()` zwracające `Observable`.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsScheduleService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze. */
  private http = inject(HttpClient);

  /** Adres endpoint API odpowiedzialnego za operacje związane z oświetleniem. */
  private readonly apiUrl = `${environment.apiUrl}/lights`;

  /**
   * Sygnał przechowujący wpisy harmonogramu zmian świateł do wyświetlenia w widoku.
   * @type {signal}
   */
  public readonly schedule = signal<LightScheduleRule[]>([]);

  /**
   * Sygnał informujący o trwaniu operacji ładowania danych z API.
   * @type {signal}
   */
  public readonly isLoading = signal<boolean>(false);

  /**
   * Sygnał informujący o błędzie komunikacji z API.
   * @type {signal}
   */
  public readonly hasError = signal<boolean>(false);

  /**
   * Pobiera listę wszystkich reguł harmonogramu z API, mapuje je na model widoku `LightScheduleRule`
   * i aktualizuje sygnał `schedule`.
   *
   * @returns {void}
   */
  public loadRules(): void {
    this.isLoading.set(true);
    this.getRules().subscribe({
      next: (items) => {
        const mapped: LightScheduleRule[] = items.map((item) => ({
          id: item._id,
          name: item.name,
          days: item.days,
          startTime: item.startTime,
          endTime: item.endTime,
          rooms: item.rooms,
          active: item.active,
          createdAt: item.createdAt,
        }));
        this.schedule.set(mapped);
        this.hasError.set(false);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[LightsScheduleService] Failed to load schedule rules', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Tworzy nową regułę harmonogramu oświetlenia w API i po sukcesie odświeża sygnał `schedule`.
   *
   * @param {CreateScheduleRulePayload} payload Dane nowej reguły harmonogramu.
   * @returns {Observable<LightScheduleRuleItem>} Obserwowalny obiekt zawierający utworzoną regułę.
   */
  public createRule(payload: CreateScheduleRulePayload): Observable<LightScheduleRuleItem> {
    return this.postRule(payload).pipe(
      tap({
        next: () => {
          this.loadRules();
          this.hasError.set(false);
        },
        error: (err) => {
          console.error('[LightsScheduleService] Failed to create schedule rule', err);
          this.hasError.set(true);
        },
      }),
    );
  }

  /**
   * Przełącza stan aktywności reguły z optymistyczną aktualizacją w sygnale `schedule` i rollbackiem w razie błędu.
   *
   * @param {string} id Identyfikator reguły.
   * @param {boolean} [active] Opcjonalny zadany stan aktywności (jeśli brak, odwraca obecny stan).
   * @returns {void}
   */
  public toggleRuleActive(id: string, active?: boolean): void {
    const previousRules = this.schedule();
    const currentRule = previousRules.find((r) => r.id === id);
    if (!currentRule) {
      return;
    }

    const targetActive = active !== undefined ? active : !currentRule.active;

    this.schedule.update((rules) =>
      rules.map((rule) => (rule.id === id ? { ...rule, active: targetActive } : rule)),
    );

    this.putRuleActive(id, targetActive).subscribe({
      next: () => {
        this.hasError.set(false);
      },
      error: (err) => {
        console.error(`[LightsScheduleService] Failed to toggle active state for rule ${id}`, err);
        this.schedule.set(previousRules);
        this.hasError.set(true);
      },
    });
  }

  /**
   * Usuwa regułę harmonogramu z optymistycznym usunięciem w sygnale `schedule` i rollbackiem w razie błędu.
   *
   * @param {string} id Identyfikator usuwanej reguły.
   * @returns {void}
   */
  public deleteRule(id: string): void {
    const previousRules = this.schedule();

    this.schedule.update((rules) => rules.filter((rule) => rule.id !== id));

    this.deleteRuleApi(id).subscribe({
      next: () => {
        this.hasError.set(false);
      },
      error: (err) => {
        console.error(`[LightsScheduleService] Failed to delete schedule rule ${id}`, err);
        this.schedule.set(previousRules);
        this.hasError.set(true);
      },
    });
  }

  /**
   * Pobiera surową listę reguł harmonogramu z endpointu GET /api/lights/rules jako Observable.
   *
   * @returns {Observable<LightScheduleRuleItem[]>}
   */
  public getRules(): Observable<LightScheduleRuleItem[]> {
    return this.http.get<LightScheduleRuleItem[]>(`${this.apiUrl}/rules`);
  }

  /**
   * Wysyła żądanie HTTP POST do endpointu /api/lights/rules w celu dodania nowej reguły.
   *
   * @param {CreateScheduleRulePayload} payload Dane do utworzenia nowej reguły.
   * @returns {Observable<LightScheduleRuleItem>}
   */
  public postRule(payload: CreateScheduleRulePayload): Observable<LightScheduleRuleItem> {
    return this.http.post<LightScheduleRuleItem>(`${this.apiUrl}/rules`, payload);
  }

  /**
   * Wysyła żądanie HTTP PUT do endpointu /api/lights/rules/:id w celu aktualizacji statusu aktywności reguły.
   *
   * @param {string} id Identyfikator reguły.
   * @param {boolean} [active] Opcjonalna flaga stanu aktywności.
   * @returns {Observable<LightScheduleRuleItem>}
   */
  public putRuleActive(id: string, active?: boolean): Observable<LightScheduleRuleItem> {
    const body = typeof active === 'boolean' ? { active } : {};
    return this.http.put<LightScheduleRuleItem>(`${this.apiUrl}/rules/${id}`, body);
  }

  /**
   * Wysyła żądanie HTTP DELETE do endpointu /api/lights/rules/:id w celu usunięcia reguły.
   *
   * @param {string} id Identyfikator usuwanej reguły.
   * @returns {Observable<DeleteScheduleRuleResponse>}
   */
  public deleteRuleApi(id: string): Observable<DeleteScheduleRuleResponse> {
    return this.http.delete<DeleteScheduleRuleResponse>(`${this.apiUrl}/rules/${id}`);
  }
}

