/**
 * Odpowiedz zawierająca pomiar powietrza
 *
 * @interface AirMeasurement
 * @property _id Opcjonalny identyfikator pomiaru w bazie danych.
 * @property temperature Temperatura powietrza w stopniach Celsjusza.
 * @property humidity Wilgotność powietrza w procentach.
 * @property pressure Ciśnienie atmosferyczne w hPa.
 * @property createdAt Opcjonalna data i czas utworzenia pomiaru w formacie ISO 8601.
 */
export interface AirMeasurement {
  _id?: string;
  temperature: number;
  humidity: number;
  pressure: number;
  createdAt?: string;
}
