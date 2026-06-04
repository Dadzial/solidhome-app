import { Injectable ,inject, signal} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'en' | 'pl';

@Injectable({
  providedIn: 'root',
})
export class TranslationsService {
  private translate = inject(TranslateService);

  currentLang = signal<Language>(this.getSavedLang());

  constructor() {
    this.translate.addLangs(['pl', 'en']);
    this.translate.setDefaultLang('pl');
    this.translate.use(this.currentLang());
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  private getSavedLang(): Language {
    const saved = localStorage.getItem('lang') as Language;
    if (saved === 'pl' || saved === 'en') return saved;
    return 'en';
  }
}
