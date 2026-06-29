import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AccentColorService {
  private document = inject(DOCUMENT);

  public readonly currentThemeColor = signal<string>('var(--theme-accent-cyan)');

  private readonly storageKey = 'solidhome-accent-color';

  constructor() {
    this.initTheme();
  }

  public setAccentColor(colorVar: string): void {
    this.document.documentElement.style.setProperty('--accent-color', colorVar);

    this.currentThemeColor.set(colorVar);
    localStorage.setItem(this.storageKey, colorVar);
  }

  private initTheme(): void {
    const savedColor = localStorage.getItem(this.storageKey);
    if (savedColor) {
      this.setAccentColor(savedColor);
    }
  }
}
