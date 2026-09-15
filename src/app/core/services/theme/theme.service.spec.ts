import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  const storageKey = 'app-theme';

  const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockMatchMedia(false);

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });

    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with light theme when localStorage is empty and system prefers light', () => {
      expect(service.theme()).toBe('light');
    });

    it('should initialize with dark theme when localStorage is empty and system prefers dark', () => {
      mockMatchMedia(true);

      const darkService = TestBed.runInInjectionContext(() => new ThemeService());

      expect(darkService.theme()).toBe('dark');
    });

    it('should restore "dark" theme from localStorage', () => {
      localStorage.setItem(storageKey, 'dark');

      const savedService = TestBed.runInInjectionContext(() => new ThemeService());

      expect(savedService.theme()).toBe('dark');
    });

    it('should restore "light" theme from localStorage', () => {
      localStorage.setItem(storageKey, 'light');

      const savedService = TestBed.runInInjectionContext(() => new ThemeService());

      expect(savedService.theme()).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle theme from light to dark', () => {
      expect(service.theme()).toBe('light');

      service.toggleTheme();

      expect(service.theme()).toBe('dark');
    });

    it('should toggle theme from dark to light', () => {
      localStorage.setItem(storageKey, 'dark');
      const darkService = TestBed.runInInjectionContext(() => new ThemeService());

      expect(darkService.theme()).toBe('dark');

      darkService.toggleTheme();

      expect(darkService.theme()).toBe('light');
    });
  });

  describe('DOM and localStorage synchronization (effect)', () => {
    it('should add "dark" class to <html> and save to localStorage when theme is dark', () => {
      service.theme.set('dark');
      TestBed.flushEffects();

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem(storageKey)).toBe('dark');
    });

    it('should remove "dark" class from <html> and save to localStorage when theme is light', () => {
      document.documentElement.classList.add('dark');
      service.theme.set('light');
      TestBed.flushEffects();

      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem(storageKey)).toBe('light');
    });
  });
});
