import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
/**
 * Główny plik wejściowy (entry point) aplikacji SolidHomeApp.
 * Uruchamia główny komponent aplikacji `App` z konfiguracją `appConfig`.
 */
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
