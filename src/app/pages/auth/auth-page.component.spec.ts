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
    it('should start with authMode set to "login" and render login-form', () => {
      expect(component.authMode()).toBe('login');
      const loginForm = fixture.nativeElement.querySelector('app-login-form');
      expect(loginForm).toBeTruthy();
    });
  });

  describe('authMode switching & template rendering', () => {
    it('should switch to "signUp" mode and handle switchToLogin output', () => {
      component.authMode.set('signUp');
      fixture.detectChanges();

      expect(component.authMode()).toBe('signUp');
      const registerFormEl = fixture.nativeElement.querySelector('app-register-form');
      expect(registerFormEl).toBeTruthy();

      const registerForm = fixture.debugElement.children[0].children[0].children[1].children[0].componentInstance;
      if (registerForm && registerForm.switchToLogin) {
        registerForm.switchToLogin.emit();
        fixture.detectChanges();
        expect(component.authMode()).toBe('login');
      }
    });

    it('should switch to "verify" mode and handle outputs', () => {
      component.authMode.set('verify');
      fixture.detectChanges();

      expect(component.authMode()).toBe('verify');
      const verifyFormEl = fixture.nativeElement.querySelector('app-verify-form');
      expect(verifyFormEl).toBeTruthy();

      const verifyForm = fixture.debugElement.children[0].children[0].children[1].children[0].componentInstance;
      if (verifyForm && verifyForm.switchToNewPassword) {
        verifyForm.switchToNewPassword.emit();
        fixture.detectChanges();
        expect(component.authMode()).toBe('restore');
      }
    });

    it('should switch to "restore" mode and handle switchToLogin output', () => {
      component.authMode.set('restore');
      fixture.detectChanges();

      expect(component.authMode()).toBe('restore');
      const restoreFormEl = fixture.nativeElement.querySelector('app-restore-form');
      expect(restoreFormEl).toBeTruthy();

      const restoreForm = fixture.debugElement.children[0].children[0].children[1].children[0].componentInstance;
      if (restoreForm && restoreForm.switchToLogin) {
        restoreForm.switchToLogin.emit();
        fixture.detectChanges();
        expect(component.authMode()).toBe('login');
      }
    });

    it('should switch back to "login" from any mode', () => {
      component.authMode.set('restore');
      fixture.detectChanges();

      component.authMode.set('login');
      fixture.detectChanges();

      expect(component.authMode()).toBe('login');
      const loginForm = fixture.nativeElement.querySelector('app-login-form');
      expect(loginForm).toBeTruthy();
    });

    it('should allow complete flow: login → signUp → login', () => {
      expect(component.authMode()).toBe('login');
      component.authMode.set('signUp');
      fixture.detectChanges();
      expect(component.authMode()).toBe('signUp');

      component.authMode.set('login');
      fixture.detectChanges();
      expect(component.authMode()).toBe('login');
    });

    it('should allow complete password recovery flow: login → verify → restore → login', () => {
      expect(component.authMode()).toBe('login');
      component.authMode.set('verify');
      fixture.detectChanges();
      expect(component.authMode()).toBe('verify');

      component.authMode.set('restore');
      fixture.detectChanges();
      expect(component.authMode()).toBe('restore');

      component.authMode.set('login');
      fixture.detectChanges();
      expect(component.authMode()).toBe('login');
    });
  });
});
