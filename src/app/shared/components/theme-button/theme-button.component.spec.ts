import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { By } from '@angular/platform-browser';
import { SvgIconComponent } from 'angular-svg-icon';
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
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle theme when button is clicked in template', () => {
    const initialTheme = themeService.theme();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    
    button.click();
    fixture.detectChanges();

    expect(themeService.theme()).not.toBe(initialTheme);
  });

  it('should toggle theme when toggleTheme is called directly and set correct icon input', () => {
    themeService.theme.set('light');
    fixture.detectChanges();
    const svgIconDebugLight = fixture.debugElement.query(By.directive(SvgIconComponent));
    const srcLight = typeof svgIconDebugLight.componentInstance.src === 'function'
      ? svgIconDebugLight.componentInstance.src()
      : svgIconDebugLight.componentInstance.src;
    expect(srcLight).toBe('assets/icons/sun.svg');

    themeService.theme.set('dark');
    fixture.detectChanges();
    const svgIconDebugDark = fixture.debugElement.query(By.directive(SvgIconComponent));
    const srcDark = typeof svgIconDebugDark.componentInstance.src === 'function'
      ? svgIconDebugDark.componentInstance.src()
      : svgIconDebugDark.componentInstance.src;
    expect(srcDark).toBe('assets/icons/moon.svg');
  });
});
