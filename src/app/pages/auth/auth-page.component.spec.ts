import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { AuthPageComponent } from './auth-page.component';
import { of } from 'rxjs';

describe('AuthPageComponent', () => {
  let component: AuthPageComponent;
  let fixture: ComponentFixture<AuthPageComponent>;

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
    sessionStorage.clear();

    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AuthPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with authMode set to "login"', () => {
      expect(component.authMode()).toBe('login');
    });
  });

  describe('authMode switching', () => {
    it('should switch to "signUp" mode', () => {
      component.authMode.set('signUp');
      expect(component.authMode()).toBe('signUp');
    });

    it('should switch to "verify" mode', () => {
      component.authMode.set('verify');
      expect(component.authMode()).toBe('verify');
    });

    it('should switch to "restore" mode', () => {
      component.authMode.set('restore');
      expect(component.authMode()).toBe('restore');
    });

    it('should switch back to "login" from any mode', () => {
      component.authMode.set('restore');
      component.authMode.set('login');
      expect(component.authMode()).toBe('login');
    });

    it('should allow complete flow: login → signUp → login', () => {
      expect(component.authMode()).toBe('login');
      component.authMode.set('signUp');
      expect(component.authMode()).toBe('signUp');
      component.authMode.set('login');
      expect(component.authMode()).toBe('login');
    });

    it('should allow complete password recovery flow: login → verify → restore → login', () => {
      expect(component.authMode()).toBe('login');
      component.authMode.set('verify');
      expect(component.authMode()).toBe('verify');
      component.authMode.set('restore');
      expect(component.authMode()).toBe('restore');
      component.authMode.set('login');
      expect(component.authMode()).toBe('login');
    });
  });
});
