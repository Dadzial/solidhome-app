import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { VerifyFormComponent } from './verify-form.component';
import { VerifyEmailService } from '@features/auth/services/verify/verify-email.service';
import { of, throwError } from 'rxjs';
import { ApiError } from '@core/models/core.models';

describe('VerifyFormComponent', () => {
  let component: VerifyFormComponent;
  let fixture: ComponentFixture<VerifyFormComponent>;
  let verifyEmailService: VerifyEmailService;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [VerifyFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyFormComponent);
    component = fixture.componentInstance;
    verifyEmailService = TestBed.inject(VerifyEmailService);

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
      expect(component.verifyEmailModel()).toEqual({ email: '' });
    });
  });

  describe('outputs / switching forms', () => {
    it('should emit switchToLogin output', () => {
      const emitSpy = vi.spyOn(component.switchToLogin, 'emit');
      component.switchToLogin.emit();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit switchToNewPassword output', () => {
      const emitSpy = vi.spyOn(component.switchToNewPassword, 'emit');
      component.switchToNewPassword.emit();
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
      const verifySpy = vi.spyOn(verifyEmailService, 'verifyEmail');
      const event = new Event('submit');

      component.onSubmit(event);

      expect(component.showLocalErrors()).toBe(true);
      expect(verifySpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);
      expect(component.showLocalErrors()).toBe(false);
      expect(component.serverError()).toBeNull();
    });

    it('should call verifyEmail service with correct data on valid form submit', async () => {
      vi.useFakeTimers();
      const mockResponse = { message: 'Verification email sent' };
      const verifySpy = vi
        .spyOn(verifyEmailService, 'verifyEmail')
        .mockReturnValue(of(mockResponse));

      component.verifyEmailModel.set({ email: 'test@test.com' });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(verifySpy).toHaveBeenCalledWith({ email: 'test@test.com' });
    });

    it('should emit switchToNewPassword after successful email verification', async () => {
      vi.useFakeTimers();
      const mockResponse = { message: 'Verification email sent' };
      vi.spyOn(verifyEmailService, 'verifyEmail').mockReturnValue(of(mockResponse));
      const emitSpy = vi.spyOn(component.switchToNewPassword, 'emit');

      component.verifyEmailModel.set({ email: 'test@test.com' });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(emitSpy).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should handle server error and display temporary error message', async () => {
      vi.useFakeTimers();
      const apiError: ApiError = { error: 'User not found' };
      vi.spyOn(verifyEmailService, 'verifyEmail').mockReturnValue(throwError(() => apiError));

      component.verifyEmailModel.set({ email: 'notexist@test.com' });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('User not found');
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
        details: ['Email address is not registered'],
      };
      vi.spyOn(verifyEmailService, 'verifyEmail').mockReturnValue(throwError(() => apiError));

      component.verifyEmailModel.set({ email: 'unknown@test.com' });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('Email address is not registered');
    });
  });
});
