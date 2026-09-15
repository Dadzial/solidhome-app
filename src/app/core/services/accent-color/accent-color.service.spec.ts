import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { AccentColorService } from './accent-color.service';

describe('AccentColorService', () => {
  let service: AccentColorService;
  let document: Document;
  const storageKey = 'solidhome-accent-color';

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AccentColorService],
    });

    document = TestBed.inject(DOCUMENT);
    service = TestBed.inject(AccentColorService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization (constructor)', () => {
    it('should have default cyan color when localStorage is empty', () => {
      expect(service.currentThemeColor()).toBe('var(--theme-accent-cyan)');
    });

    it('should restore saved color from localStorage on startup', () => {
      localStorage.setItem(storageKey, 'var(--theme-accent-purple)');

      const newService = TestBed.runInInjectionContext(() => new AccentColorService());

      expect(newService.currentThemeColor()).toBe('var(--theme-accent-purple)');
      expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe(
        'var(--theme-accent-purple)',
      );
    });
  });

  describe('setAccentColor', () => {
    it('should update currentThemeColor signal', () => {
      service.setAccentColor('var(--theme-accent-green)');

      expect(service.currentThemeColor()).toBe('var(--theme-accent-green)');
    });

    it('should set --accent-color CSS property on document.documentElement', () => {
      service.setAccentColor('var(--theme-accent-orange)');

      expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe(
        'var(--theme-accent-orange)',
      );
    });

    it('should persist chosen color to localStorage', () => {
      service.setAccentColor('var(--theme-accent-pink)');

      expect(localStorage.getItem(storageKey)).toBe('var(--theme-accent-pink)');
    });
  });
});
