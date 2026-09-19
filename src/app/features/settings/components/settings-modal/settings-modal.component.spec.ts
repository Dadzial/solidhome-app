import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { SettingsModalComponent } from './settings-modal.component';
import { UserSettingsService } from '@features/settings/services/user-settings/user-settings.service';
import { LoginService } from '@features/auth/services/login/login.service';
import { AccentColorService } from '@core/services/accent-color/accent-color.service';
import { of, throwError } from 'rxjs';
import { ApiError } from '@core/models/core.models';

describe('SettingsModalComponent', () => {
  let component: SettingsModalComponent;
  let fixture: ComponentFixture<SettingsModalComponent>;
  let userSettingsService: UserSettingsService;
  let loginService: LoginService;
  let accentColorService: AccentColorService;

  beforeEach(async () => {
    localStorage.clear();

    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsModalComponent);
    component = fixture.componentInstance;
    userSettingsService = TestBed.inject(UserSettingsService);
    loginService = TestBed.inject(LoginService);
    accentColorService = TestBed.inject(AccentColorService);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
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
      expect(component.expandedSection()).toBeNull();
    });

    it('should have empty form models by default', () => {
      expect(component.usernameModel()).toEqual({ userName: '' });
      expect(component.emailModel()).toEqual({ email: '' });
      expect(component.passwordModel()).toEqual({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    });
  });

  describe('template rendering & sections', () => {
    it('should trigger click outside when isOpen is false and not emit', () => {
      const emitSpy = vi.spyOn(component.closeSettings, 'emit');
      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();

      const modalEl = fixture.nativeElement.firstElementChild as HTMLElement;
      modalEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should trigger click outside when isOpen is true and emit closeSettings', () => {
      const emitSpy = vi.spyOn(component.closeSettings, 'emit');
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should render username form when section is expanded and submit it from template', async () => {
      component.toggleSection('username');
      fixture.detectChanges();

      const formEl = fixture.nativeElement.querySelector('form');
      expect(formEl).toBeTruthy();

      const mockResponse = { _id: 'abc', userName: 'newuser' };
      vi.spyOn(userSettingsService, 'updateUser').mockReturnValue(of(mockResponse));
      component.usernameModel.set({ userName: 'newuser' });
      fixture.detectChanges();

      const submitBtn = formEl.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitBtn.click();
      await Promise.resolve();

      expect(component.usernameModel()).toEqual({ userName: '' });
    });

    it('should display local errors and server error in username template', () => {
      component.toggleSection('username');
      component.showLocalErrors.set(true);
      component.serverError.set('Username error message');
      fixture.detectChanges();

      const errorMsg = fixture.nativeElement.querySelector('form p.text-text-error');
      expect(errorMsg).toBeTruthy();
    });

    it('should render email form when section is expanded and submit it from template', async () => {
      component.toggleSection('email');
      fixture.detectChanges();

      const formEl = fixture.nativeElement.querySelector('form');
      expect(formEl).toBeTruthy();

      const mockResponse = { _id: 'abc', userName: 'testuser' };
      vi.spyOn(userSettingsService, 'updateUser').mockReturnValue(of(mockResponse));
      component.emailModel.set({ email: 'new@email.com' });
      fixture.detectChanges();

      const submitBtn = formEl.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitBtn.click();
      await Promise.resolve();

      expect(component.emailModel()).toEqual({ email: '' });
    });

    it('should display local errors and server error in email template', () => {
      component.toggleSection('email');
      component.showLocalErrors.set(true);
      component.serverError.set('Email error message');
      fixture.detectChanges();

      const errorMsg = fixture.nativeElement.querySelector('form p.text-text-error');
      expect(errorMsg).toBeTruthy();
    });

    it('should render password form when section is expanded and submit it from template', async () => {
      component.toggleSection('password');
      fixture.detectChanges();

      const formEl = fixture.nativeElement.querySelector('form');
      expect(formEl).toBeTruthy();

      const mockResponse = { _id: 'abc', userName: 'testuser' };
      vi.spyOn(userSettingsService, 'updateUser').mockReturnValue(of(mockResponse));
      component.passwordModel.set({
        currentPassword: 'OldPassword1',
        newPassword: 'NewPassword1',
        confirmPassword: 'NewPassword1',
      });
      fixture.detectChanges();

      const submitBtn = formEl.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitBtn.click();
      await Promise.resolve();

      expect(component.passwordModel()).toEqual({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    });

    it('should display local errors and server error in password template', () => {
      component.toggleSection('password');
      component.showLocalErrors.set(true);
      component.serverError.set('Password error message');
      fixture.detectChanges();

      const errorMsg = fixture.nativeElement.querySelector('form p.text-text-error');
      expect(errorMsg).toBeTruthy();
    });

    it('should render color buttons and allow selecting colors', () => {
      fixture.detectChanges();

      const colorButtons = fixture.nativeElement.querySelectorAll('button[style*="background-color"]');
      expect(colorButtons.length).toBe(6);

      const colorSpy = vi.spyOn(accentColorService, 'setAccentColor');
      (colorButtons[0] as HTMLButtonElement).click();
      expect(colorSpy).toHaveBeenCalled();
    });
  });

  describe('outputs', () => {
    it('should emit closeSettings output', () => {
      const emitSpy = vi.spyOn(component.closeSettings, 'emit');
      component.closeSettings.emit();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('toggleSection', () => {
    it('should open a section when called with a new section', () => {
      component.toggleSection('username');
      expect(component.expandedSection()).toBe('username');
    });

    it('should close a section when called with the already open section', () => {
      component.toggleSection('email');
      component.toggleSection('email');
      expect(component.expandedSection()).toBeNull();
    });

    it('should switch between sections', () => {
      component.toggleSection('username');
      expect(component.expandedSection()).toBe('username');

      component.toggleSection('password');
      expect(component.expandedSection()).toBe('password');
    });
  });

  describe('username form submission', () => {
    it('should show local errors when submitting invalid username form', () => {
      vi.useFakeTimers();
      const updateSpy = vi.spyOn(userSettingsService, 'updateUser');
      const event = new Event('submit');

      component.onSubmitUsername(event);

      expect(component.showLocalErrors()).toBe(true);
      expect(updateSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);
      expect(component.showLocalErrors()).toBe(false);
      expect(component.serverError()).toBeNull();
    });

    it('should call updateUser and set loginService.userName on success', async () => {
      vi.useFakeTimers();
      const mockResponse = { _id: 'abc', userName: 'newuser' };
      vi.spyOn(userSettingsService, 'updateUser').mockReturnValue(of(mockResponse));
      const setUserNameSpy = vi.spyOn(loginService.userName, 'set');

      component.usernameModel.set({ userName: 'newuser' });
      const event = new Event('submit');
      component.onSubmitUsername(event);

      await Promise.resolve();

      expect(setUserNameSpy).toHaveBeenCalledWith('newuser');
      expect(component.usernameModel()).toEqual({ userName: '' });
      expect(component.isLoading()).toBe(false);
    });

    it('should handle server error on username update', async () => {
      vi.useFakeTimers();
      const apiError: ApiError = { error: 'Username already taken' };
      vi.spyOn(userSettingsService, 'updateUser').mockReturnValue(throwError(() => apiError));

      component.usernameModel.set({ userName: 'taken' });
      const event = new Event('submit');
      component.onSubmitUsername(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('Username already taken');
      expect(component.showLocalErrors()).toBe(true);
      expect(component.isLoading()).toBe(false);

      vi.advanceTimersByTime(3000);
      expect(component.serverError()).toBeNull();
      expect(component.showLocalErrors()).toBe(false);
    });
  });

  describe('email form submission', () => {
    it('should show local errors when submitting invalid email form', () => {
      vi.useFakeTimers();
      const updateSpy = vi.spyOn(userSettingsService, 'updateUser');
      const event = new Event('submit');

      component.onSubmitEmail(event);

      expect(component.showLocalErrors()).toBe(true);
      expect(updateSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);
      expect(component.showLocalErrors()).toBe(false);
    });

    it('should call updateUser with email and clear model on success', async () => {
      vi.useFakeTimers();
      const mockResponse = { _id: 'abc', userName: 'testuser' };
      const updateSpy = vi.spyOn(userSettingsService, 'updateUser').mockReturnValue(of(mockResponse));

      component.emailModel.set({ email: 'new@test.com' });
      const event = new Event('submit');
      component.onSubmitEmail(event);

      await Promise.resolve();

      expect(updateSpy).toHaveBeenCalledWith({ email: 'new@test.com' });
      expect(component.emailModel()).toEqual({ email: '' });
      expect(component.isLoading()).toBe(false);
    });

    it('should handle server error on email update', async () => {
      vi.useFakeTimers();
      const apiError: ApiError = { error: 'Email already in use' };
      vi.spyOn(userSettingsService, 'updateUser').mockReturnValue(throwError(() => apiError));

      component.emailModel.set({ email: 'taken@test.com' });
      const event = new Event('submit');
      component.onSubmitEmail(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('Email already in use');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('password form submission', () => {
    it('should show local errors when submitting invalid password form', () => {
      vi.useFakeTimers();
      const updateSpy = vi.spyOn(userSettingsService, 'updateUser');
      const event = new Event('submit');

      component.onSubmitPassword(event);

      expect(component.showLocalErrors()).toBe(true);
      expect(updateSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);
      expect(component.showLocalErrors()).toBe(false);
    });

    it('should set serverError when newPassword and confirmPassword do not match', async () => {
      vi.useFakeTimers();
      const updateSpy = vi.spyOn(userSettingsService, 'updateUser');

      component.passwordModel.set({
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
        confirmPassword: 'DifferentPass1',
      });

      const event = new Event('submit');
      component.onSubmitPassword(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('authPagesErrors.passwordsMismatch');
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should call updateUser with currentPassword and new password on success', async () => {
      vi.useFakeTimers();
      const mockResponse = { _id: 'abc', userName: 'testuser' };
      const updateSpy = vi.spyOn(userSettingsService, 'updateUser').mockReturnValue(of(mockResponse));

      component.passwordModel.set({
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
        confirmPassword: 'NewPass1',
      });

      const event = new Event('submit');
      component.onSubmitPassword(event);

      await Promise.resolve();

      expect(updateSpy).toHaveBeenCalledWith({
        currentPassword: 'OldPass1',
        password: 'NewPass1',
      });
      expect(component.passwordModel()).toEqual({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      expect(component.isLoading()).toBe(false);
    });

    it('should handle server error on password update', async () => {
      vi.useFakeTimers();
      const apiError: ApiError = { error: 'Invalid current password' };
      vi.spyOn(userSettingsService, 'updateUser').mockReturnValue(throwError(() => apiError));

      component.passwordModel.set({
        currentPassword: 'WrongPass1',
        newPassword: 'NewPass1',
        confirmPassword: 'NewPass1',
      });

      const event = new Event('submit');
      component.onSubmitPassword(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('Invalid current password');
      expect(component.isLoading()).toBe(false);

      vi.advanceTimersByTime(3000);
      expect(component.serverError()).toBeNull();
      expect(component.showLocalErrors()).toBe(false);
    });

    it('should prefer details[0] over error when both present', async () => {
      vi.useFakeTimers();
      const apiError: ApiError = {
        error: 'Validation failed',
        details: ['Password must be at least 8 characters'],
      };
      vi.spyOn(userSettingsService, 'updateUser').mockReturnValue(throwError(() => apiError));

      component.passwordModel.set({
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
        confirmPassword: 'NewPass1',
      });

      const event = new Event('submit');
      component.onSubmitPassword(event);

      await Promise.resolve();

      expect(component.serverError()).toBe('Password must be at least 8 characters');
    });
  });

  describe('accentColorService', () => {
    it('should call setAccentColor when selecting a color', () => {
      const setColorSpy = vi.spyOn(accentColorService, 'setAccentColor');
      accentColorService.setAccentColor('var(--theme-accent-green)');
      expect(setColorSpy).toHaveBeenCalledWith('var(--theme-accent-green)');
    });

    it('should update currentThemeColor signal after setAccentColor', () => {
      accentColorService.setAccentColor('var(--theme-accent-purple)');
      expect(accentColorService.currentThemeColor()).toBe('var(--theme-accent-purple)');
    });
  });
});
