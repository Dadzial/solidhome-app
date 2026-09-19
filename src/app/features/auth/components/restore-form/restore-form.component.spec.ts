import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { RestoreFormComponent } from './restore-form.component';
import { ConfirmPasswordService } from '@features/auth/services/confirm/confirm-password.service';
import { of, throwError } from 'rxjs';
import { ApiError } from '@core/models/core.models';

describe('RestoreFormComponent', () => {
  let component: RestoreFormComponent;
  let fixture: ComponentFixture<RestoreFormComponent>;
  let confirmPasswordService: ConfirmPasswordService;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [RestoreFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RestoreFormComponent);
    component = fixture.componentInstance;
    confirmPasswordService = TestBed.inject(ConfirmPasswordService);

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
      expect(component.restoreModel()).toEqual({
        code: '',
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
      const confirmSpy = vi.spyOn(confirmPasswordService, 'confirmNewPassword');
      const event = new Event('submit');

      component.onSubmit(event);

      expect(component.showLocalErrors()).toBe(true);
      expect(confirmSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);
      expect(component.showLocalErrors()).toBe(false);
      expect(component.serverError()).toBeNull();
    });

    it('should call confirmNewPassword service with correct data on valid form submit', async () => {
      vi.useFakeTimers();
      const mockResponse = { message: 'Password changed successfully' };
      const confirmSpy = vi
        .spyOn(confirmPasswordService, 'confirmNewPassword')
        .mockReturnValue(of(mockResponse));

      component.restoreModel.set({ code: 'ABC123', password: 'newPassword1' });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(confirmSpy).toHaveBeenCalledWith({ code: 'ABC123', password: 'newPassword1' });
    });

    it('should emit switchToLogin after successful password reset', async () => {
      vi.useFakeTimers();
      const mockResponse = { message: 'Password changed successfully' };
      vi.spyOn(confirmPasswordService, 'confirmNewPassword').mockReturnValue(of(mockResponse));
      const emitSpy = vi.spyOn(component.switchToLogin, 'emit');

      component.restoreModel.set({ code: 'ABC123', password: 'newPassword1' });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(emitSpy).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should handle server error and display temporary error message', async () => {
      vi.useFakeTimers();
      const apiError: ApiError = { error: 'Invalid or expired code' };
      vi.spyOn(confirmPasswordService, 'confirmNewPassword').mockReturnValue(
        throwError(() => apiError),
      );

      component.restoreModel.set({ code: 'WRONG', password: 'newPassword1' });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('Invalid or expired code');
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
        details: ['Code has expired'],
      };
      vi.spyOn(confirmPasswordService, 'confirmNewPassword').mockReturnValue(
        throwError(() => apiError),
      );

      component.restoreModel.set({ code: 'EXPIRED', password: 'newPassword1' });

      const event = new Event('submit');
      component.onSubmit(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('Code has expired');
    });
  });
});
