import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { Router } from '@angular/router';
import { LoginFormComponent } from './login-form.component';
import { LoginService } from '@features/auth/services/login/login.service';
import { LoadingService } from '@core/services/loading/loading.service';
import { of, throwError } from 'rxjs';
import { ApiError } from '@core/models/core.models';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  let loginService: LoginService;
  let router: Router;
  let loadingService: LoadingService;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [LoginFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
    loginService = TestBed.inject(LoginService);
    router = TestBed.inject(Router);
    loadingService = TestBed.inject(LoadingService);

    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have default state values', () => {
      expect(component.isLoading()).toBe(false);
      expect(component.serverError()).toBeNull();
      expect(component.showLocalErrors()).toBe(false);
      expect(component.loginModel()).toEqual({
        userName: '',
        password: '',
        rememberMe: false,
      });
    });
  });

  describe('outputs / switching forms', () => {
    it('should emit switchToSignup output', () => {
      const emitSpy = vi.spyOn(component.switchToSignup, 'emit');
      component.switchToSignup.emit();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit switchToVerify output', () => {
      const emitSpy = vi.spyOn(component.switchToVerify, 'emit');
      component.switchToVerify.emit();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('toggleRememberMe', () => {
    it('should toggle rememberMe flag and update checkbox in template', () => {
      expect(component.loginModel().rememberMe).toBe(false);
      fixture.detectChanges();

      const checkboxContainer = fixture.nativeElement.querySelector('.mt-5.flex.items-center div') as HTMLElement;
      checkboxContainer.click();
      fixture.detectChanges();

      expect(component.loginModel().rememberMe).toBe(true);
      expect(fixture.nativeElement.querySelector('svg-icon[src="assets/icons/checkbox.svg"]')).toBeTruthy();

      checkboxContainer.click();
      fixture.detectChanges();
      expect(component.loginModel().rememberMe).toBe(false);
    });

    it('should toggle rememberMe flag when clicking label in template', () => {
      const label = fixture.nativeElement.querySelector('.mt-5.flex.items-center label') as HTMLElement;
      label.click();
      fixture.detectChanges();
      expect(component.loginModel().rememberMe).toBe(true);
    });
  });

  describe('form submission and validation', () => {
    it('should show local errors when submitting invalid form', () => {
      vi.useFakeTimers();
      const loginSpy = vi.spyOn(loginService, 'login');
      const event = new Event('submit');

      component.onSubmit(event);

      expect(component.showLocalErrors()).toBe(true);
      expect(loginSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);
      expect(component.showLocalErrors()).toBe(false);
      expect(component.serverError()).toBeNull();
    });

    it('should handle successful login with sessionStorage when rememberMe is false', async () => {
      vi.useFakeTimers();
      const mockResponse = { token: 'jwt-session-token' };
      vi.spyOn(loginService, 'login').mockReturnValue(of(mockResponse));
      const initUserSpy = vi.spyOn(loginService, 'initUserFromToken');
      const showLoadingSpy = vi.spyOn(loadingService, 'showLoadingWindow');
      const hideLoadingSpy = vi.spyOn(loadingService, 'hideLoadingWindow');
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.loginModel.set({
        userName: 'testuser',
        password: 'password123',
        rememberMe: false,
      });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(sessionStorage.getItem('token')).toBe('jwt-session-token');
      expect(localStorage.getItem('token')).toBeNull();
      expect(initUserSpy).toHaveBeenCalled();
      expect(showLoadingSpy).toHaveBeenCalled();

      vi.advanceTimersByTime(800);
      expect(navigateSpy).toHaveBeenCalledWith(['home']);

      vi.advanceTimersByTime(300);
      expect(hideLoadingSpy).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should handle successful login with localStorage when rememberMe is true', async () => {
      vi.useFakeTimers();
      const mockResponse = { token: 'jwt-local-token' };
      vi.spyOn(loginService, 'login').mockReturnValue(of(mockResponse));
      vi.spyOn(loginService, 'initUserFromToken');
      vi.spyOn(loadingService, 'showLoadingWindow');
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.loginModel.set({
        userName: 'testuser',
        password: 'password123',
        rememberMe: true,
      });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(localStorage.getItem('token')).toBe('jwt-local-token');
      expect(sessionStorage.getItem('token')).toBeNull();
    });

    it('should handle login error from server and display temporary error', async () => {
      vi.useFakeTimers();
      const apiError: ApiError = { error: 'Invalid username or password' };
      vi.spyOn(loginService, 'login').mockReturnValue(throwError(() => apiError));

      component.loginModel.set({
        userName: 'testuser',
        password: 'wrongpassword',
        rememberMe: false,
      });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('Invalid username or password');
      expect(component.showLocalErrors()).toBe(true);
      expect(component.isLoading()).toBe(false);

      vi.advanceTimersByTime(3000);
      expect(component.serverError()).toBeNull();
      expect(component.showLocalErrors()).toBe(false);
    });
  });
});
