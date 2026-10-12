import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, tap } from 'rxjs';

/**
 * Serwis odpowiedzialny za zarządzanie regułami harmonogramu oświetlenia w systemie.
 *
 * Utrzymuje reaktywny sygnał `rules` z listą zdefiniowanych reguł,
 *
 * ### Zasady działania:
 * - `loadRules()` pobiera listę reguł z API i aktualizuje sygnał `rules`.
 * - `createRule()` wysyła nową regułę do API i po sukcesie odświeża listę reguł.
 * - `toggleRuleActive()` włącza lub wyłącza regułę w API i odświeża listę reguł.
 * - `deleteRule()` usuwa regułę w API i odświeża listę reguł.
 */
@Injectable({
  providedIn: 'root',
})
export class LightsScheduleService {
  /** Inject httpClient do wykonywania żądań HTTP w Angularze. */
  private http = inject(HttpClient);

  /** Adres endpoint API odpowiedzialnego za operacje związane z oświetleniem. */
  private readonly apiUrl = `${environment.apiUrl}/lights`;
}
