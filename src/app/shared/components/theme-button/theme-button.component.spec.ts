import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { ThemeButtonComponent } from './theme-button.component';
import { ThemeService } from '@core/services/theme/theme.service';
import { of } from 'rxjs';

describe('ThemeButtonComponent', () => {
  let component: ThemeButtonComponent;
  let fixture: ComponentFixture<ThemeButtonComponent>;
  let themeService: ThemeService;

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

  beforeEach(async () => {
    mockMatchMedia(false);
    localStorage.clear();

    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ThemeButtonComponent],
      providers: [
        ThemeService,
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeButtonComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle theme when toggleTheme is called', () => {
    const initialTheme = themeService.theme();
    themeService.toggleTheme();
    expect(themeService.theme()).not.toBe(initialTheme);
  });
});
