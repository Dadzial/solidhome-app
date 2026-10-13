/**
 * Model pojedynczej lampy używany w widoku SVG do pozycjonowania i renderowania przycisków.
 *
 * @interface Light
 * @property id Unikalny identyfikator lampy (odpowiada `_id` z API).
 * @property x Pozycja pozioma lampy (w pikselach) na mapie SVG (viewBox 1920×1080).
 * @property y Pozycja pionowa lampy (w pikselach) na mapie SVG (viewBox 1920×1080).
 * @property on Flaga określająca aktualny stan lampy (`true` — włączona, `false` — wyłączona).
 */
export interface Light {
  id: string;
  x: number;
  y: number;
  on: boolean;
}

/**
 * Model danych lampy zwracany bezpośrednio przez API backendu.
 *
 * @interface LightItem
 * @property _id Opcjonalny unikalny identyfikator lampy w bazie danych MongoDB.
 * @property name Nazwa lampy wyświetlana w interfejsie (np. klucz i18n lub czytelna etykieta).
 * @property state Stan lampy zwracany przez API: `1` — włączona, `0` — wyłączona.
 * @property updatedAt Opcjonalna data i godzina ostatniej zmiany stanu lampy (format ISO 8601).
 */
export interface LightItem {
  _id?: string;
  name: string;
  state: 0 | 1;
  updatedAt?: string;
}

/**
 * Model pojedynczego wpisu historii zmian stanu lampy zwracany przez API.
 *
 * @interface LightHistoryItem
 * @property _id Unikalny identyfikator wpisu historii w bazie danych.
 * @property name Nazwa lampy, której dotyczy wpis historii.
 * @property state Stan lampy w momencie zdarzenia: `1` — włączona, `0` — wyłączona.
 * @property createdAt Data i godzina zdarzenia (format ISO 8601).
 * @property userId Dane użytkownika, który zmienił stan lampy — `null` lub brak pola oznacza użytkownika nieznanego lub usuniętego.
 */
export interface LightHistoryItem {
  _id: string;
  name: string;
  state: 0 | 1;
  createdAt: string;
  userId?: {
    _id: string;
    userName: string;
    email: string;
  } | null;
}

/**
 * Odpowiedź serwera po pomyślnym wyczyszczeniu historii zmian świateł.
 *
 * @interface ResetHistoryResponse
 * @property message Komunikat potwierdzający operację (np. 'History cleared successfully').
 * @property deletedCount Opcjonalna liczba usuniętych wpisów historii.
 */
export interface ResetHistoryResponse {
  message: string;
  deletedCount?: number;
}

/**
 * Model wpisu historii po przetworzeniu przez serwis — gotowy do wyświetlenia w szablonie.
 *
 * Powstaje przez mapowanie `LightHistoryItem` na czytelne dane dla widoku
 * (przetłumaczona akcja, sformatowany czas, nazwa użytkownika).
 *
 * @interface LightHistory
 * @property id Unikalny identyfikator wpisu historii (pochodzi z `LightHistoryItem._id`).
 * @property name Nazwa lampy (klucz i18n lub etykieta).
 * @property action Akcja wykonana na lampie: `'ON'` — włączono, `'OFF'` — wyłączono.
 * @property time Sformatowany czas zdarzenia do wyświetlenia w widoku (np. '14:35').
 * @property user Nazwa użytkownika, który wykonał akcję (lub wartość domyślna gdy brak danych).
 */
export interface LightHistory {
  id: string;
  name: string;
  action: 'ON' | 'OFF';
  time: string;
  user: string;
}

/**
 * Opcje okresu czasu dla statystyk energii.
 */
export type EnergyTimeframe = 'today' | 'week' | 'month';

/**
 * Model pojedynczego pomieszczenia w sekcji największego zużycia energii (TOP 3).
 *
 * @interface TopRoomEnergy
 * @property name Identyfikator pomieszczenia (np. 'living_room').
 * @property kwh Zużycie energii w kilowatogodzinach (kWh).
 * @property percentage Wyliczony udział procentowy w zużyciu energii całego domu.
 */
export interface TopRoomEnergy {
  name: string;
  kwh: number;
  percentage: number;
}

/**
 * Model danych statystyk energii zwracanych przez API backendu.
 *
 * @interface LightEnergyData
 * @property name Nazwa wybranego obszaru ('entireHouse' lub nazwa konkretnego pokoju).
 * @property timeframe Wybrany przedział czasu ('today', 'week', 'month').
 * @property totalKwh Łączne zużycie energii w wybranym okresie (kWh).
 * @property chartData Punkty wartości zużycia dla wykresu ApexCharts.
 * @property topRooms Lista 3 pomieszczeń o największym zużyciu energii z procentami.
 * @property lightsKwh Mapa zużycia dla każdego poszczególnego punktu świetlnego.
 * @property totalHouseKwh Sumaryczne zużycie wszystkich obecnych świateł w domu.
 */
export interface LightEnergyData {
  name: string;
  timeframe: EnergyTimeframe;
  totalKwh: number;
  chartData: number[];
  categories?: string[];
  topRooms: TopRoomEnergy[];
  lightsKwh: Record<string, number>;
  totalHouseKwh: number;
}

/**
 * Model widoku reprezentujący pojedynczy element w rankingu TOP pomieszczeń
 * wzbogacony o klucz tłumaczenia i18n dla szablonu HTML.
 *
 * @interface DisplayTopRoom
 * @property name Identyfikator pomieszczenia (np. 'living_room').
 * @property percentage Wyliczony udział procentowy w zużyciu energii.
 * @property kwh Zużycie energii w kilowatogodzinach (kWh).
 * @property translationKey Klucz translacji i18n dla nazwy pokoju.
 */
export interface DisplayTopRoom {
  name: string;
  percentage: number;
  kwh: number;
  translationKey: string;
}

/**
 * Model pojedynczej reguły harmonogramu oświetlenia zwracany bezpośrednio przez API backendu.
 *
 * @interface LightScheduleRuleItem
 * @property _id Unikalny identyfikator reguły w bazie danych MongoDB.
 * @property name Czytelna nazwa reguły (np. "Wieczorne oświetlenie").
 * @property days Tablica dni tygodnia (0-6), w których reguła obowiązuje.
 * @property startTime Godzina rozpoczęcia w formacie "HH:MM".
 * @property endTime Godzina zakończenia w formacie "HH:MM".
 * @property rooms Lista identyfikatorów pomieszczeń objętych regułą.
 * @property active Flaga określająca, czy reguła jest obecnie aktywna.
 * @property userId Opcjonalny identyfikator użytkownika, który utworzył regułę.
 * @property createdAt Opcjonalna data utworzenia wpisu (format ISO 8601).
 * @property updatedAt Opcjonalna data ostatniej modyfikacji (format ISO 8601).
 */
export interface LightScheduleRuleItem {
  _id: string;
  name: string;
  days: number[];
  startTime: string;
  endTime: string;
  rooms: string[];
  active: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Model reguły harmonogramu oświetlenia po przetworzeniu przez serwis — gotowy do wyświetlenia w widoku.
 *
 * @interface LightScheduleRule
 * @property id Unikalny identyfikator reguły (odpowiada `_id` z API).
 * @property name Czytelna nazwa reguły harmonogramu.
 * @property days Dni tygodnia, w których reguła jest uruchamiana.
 * @property startTime Czas startu w formacie "HH:MM".
 * @property endTime Czas zakończenia w formacie "HH:MM".
 * @property rooms Wybrane pokoje objęte regułą.
 * @property active Status aktywności reguły.
 * @property createdAt Opcjonalna data utworzenia reguły.
 */
export interface LightScheduleRule {
  id: string;
  name: string;
  days: number[];
  startTime: string;
  endTime: string;
  rooms: string[];
  active: boolean;
  createdAt?: string;
}

/**
 * Dane wejściowe przesyłane do API podczas tworzenia nowej reguły harmonogramu.
 *
 * @interface CreateScheduleRulePayload
 * @property name Nazwa reguły harmonogramu.
 * @property days Tablica wybranych dni tygodnia.
 * @property startTime Czas rozpoczęcia ("HH:MM").
 * @property endTime Czas zakończenia ("HH:MM").
 * @property rooms Lista pomieszczeń przypisanych do reguły.
 */
export interface CreateScheduleRulePayload {
  name: string;
  days: number[];
  startTime: string;
  endTime: string;
  rooms: string[];
}

/**
 * Odpowiedź serwera po pomyślnym usunięciu reguły harmonogramu.
 *
 * @interface DeleteScheduleRuleResponse
 * @property message Komunikat potwierdzający usunięcie reguły.
 * @property deletedCount Opcjonalna liczba usuniętych dokumentów.
 */
export interface DeleteScheduleRuleResponse {
  message: string;
  deletedCount?: number;
}
