import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { RegisterFormComponent } from './register-form.component';
import { RegisterService } from '@features/auth/services/register/register.service';
import { of, throwError } from 'rxjs';
import { ApiError } from '@core/models/core.models';

describe('RegisterFormComponent', () => {
  let component: RegisterFormComponent;
  let fixture: ComponentFixture<RegisterFormComponent>;
  let registerService: RegisterService;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterFormComponent);
    component = fixture.componentInstance;
    registerService = TestBed.inject(RegisterService);

    fixture.detectChanges();
  });

  afterEach(() => {
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
      expect(component.registerModel()).toEqual({
        email: '',
        userName: '',
        password: '',
      });
    });
  });

  describe('outputs / switching forms', () => {
    it('should emit switchToLogin output', () => {
      const emitSpy = vi.spyOn(component.switchToLogin, 'emit');
      component.switchToLogin.emit();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('template loading spinner', () => {
    it('should render loading spinner when isLoading is true', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });

  describe('form submission and validation', () => {
    it('should show local errors when submitting invalid form', () => {
      vi.useFakeTimers();
      const registerSpy = vi.spyOn(registerService, 'register');
      const event = new Event('submit');

      component.onSubmit(event);

      expect(component.showLocalErrors()).toBe(true);
      expect(registerSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);
      expect(component.showLocalErrors()).toBe(false);
      expect(component.serverError()).toBeNull();
    });

    it('should call register service with correct data on valid form submit', async () => {
      vi.useFakeTimers();
      const mockResponse = { _id: 'abc123', email: 'test@test.com', userName: 'testuser' };
      const registerSpy = vi.spyOn(registerService, 'register').mockReturnValue(of(mockResponse));

      component.registerModel.set({
        email: 'test@test.com',
        userName: 'testuser',
        password: 'password123',
      });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(registerSpy).toHaveBeenCalledWith({
        email: 'test@test.com',
        userName: 'testuser',
        password: 'password123',
      });
    });

    it('should emit switchToLogin after successful registration', async () => {
      vi.useFakeTimers();
      const mockResponse = { _id: 'abc123', email: 'test@test.com', userName: 'testuser' };
      vi.spyOn(registerService, 'register').mockReturnValue(of(mockResponse));
      const emitSpy = vi.spyOn(component.switchToLogin, 'emit');

      component.registerModel.set({
        email: 'test@test.com',
        userName: 'testuser',
        password: 'password123',
      });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(emitSpy).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should handle server error and display temporary error message', async () => {
      vi.useFakeTimers();
      const apiError: ApiError = { error: 'Username already taken' };
      vi.spyOn(registerService, 'register').mockReturnValue(throwError(() => apiError));

      component.registerModel.set({
        email: 'test@test.com',
        userName: 'existinguser',
        password: 'password123',
      });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('Username already taken');
      expect(component.showLocalErrors()).toBe(true);
      expect(component.isLoading()).toBe(false);

      vi.advanceTimersByTime(3000);
      expect(component.serverError()).toBeNull();
      expect(component.showLocalErrors()).toBe(false);
    });

    it('should prefer details[0] over error message when both present', async () => {
      vi.useFakeTimers();
      const apiError: ApiError = {
        error: 'Validation failed',
        details: ['Email is already in use'],
      };
      vi.spyOn(registerService, 'register').mockReturnValue(throwError(() => apiError));

      component.registerModel.set({
        email: 'taken@test.com',
        userName: 'testuser',
        password: 'password123',
      });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('Email is already in use');
    });
  });
});
