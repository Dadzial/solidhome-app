import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { TranslationsService } from './translations.service';

describe('TranslationsService', () => {
  let service: TranslationsService;
  let translateServiceMock: {
    addLangs: ReturnType<typeof vi.fn>;
    setDefaultLang: ReturnType<typeof vi.fn>;
    use: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();

    translateServiceMock = {
      addLangs: vi.fn(),
      setDefaultLang: vi.fn(),
      use: vi.fn().mockReturnValue(of({})),
    };

    TestBed.configureTestingModule({
      providers: [
        TranslationsService,
        { provide: TranslateService, useValue: translateServiceMock },
      ],
    });

    service = TestBed.inject(TranslationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    it('should configure TranslateService with default languages and fallback to "en"', () => {
      expect(translateServiceMock.addLangs).toHaveBeenCalledWith(['pl', 'en']);
      expect(translateServiceMock.setDefaultLang).toHaveBeenCalledWith('pl');
      expect(translateServiceMock.use).toHaveBeenCalledWith('en');
      expect(service.currentLang()).toBe('en');
    });
  });

  describe('getSavedLang fallback', () => {
    it('should return "en" when localStorage has invalid language code', () => {
      localStorage.setItem('lang', 'fr');

      const result = (service as unknown as { getSavedLang: () => string }).getSavedLang();

      expect(result).toBe('en');
    });

    it('should return "pl" when saved in localStorage', () => {
      localStorage.setItem('lang', 'pl');

      const result = (service as unknown as { getSavedLang: () => string }).getSavedLang();

      expect(result).toBe('pl');
    });
  });

  describe('setLanguage', () => {
    it('should update currentLang signal, call translate.use, and persist "pl" to localStorage', () => {
      service.setLanguage('pl');

      expect(service.currentLang()).toBe('pl');
      expect(translateServiceMock.use).toHaveBeenCalledWith('pl');
      expect(localStorage.getItem('lang')).toBe('pl');
    });

    it('should update currentLang signal, call translate.use, and persist "en" to localStorage', () => {
      service.setLanguage('en');

      expect(service.currentLang()).toBe('en');
      expect(translateServiceMock.use).toHaveBeenCalledWith('en');
      expect(localStorage.getItem('lang')).toBe('en');
    });
  });
});
