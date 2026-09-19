import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { NavbarComponent } from './navbar.component';
import { LogoutService } from '@core/services/logout/logout.service';
import { of, throwError } from 'rxjs';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let router: Router;
  let logoutService: LogoutService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    logoutService = TestBed.inject(LogoutService);
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleMobileMenu', () => {
    it('should toggle isMobileMenuOpen signal', () => {
      expect(component.isMobileMenuOpen()).toBe(false);
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen()).toBe(true);
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen()).toBe(false);
    });

    it('should close settings when opening mobile menu', () => {
      component.isSettingsOpen.set(true);
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen()).toBe(true);
      expect(component.isSettingsOpen()).toBe(false);
    });
  });

  describe('toggleSettings', () => {
    it('should toggle isSettingsOpen signal', () => {
      expect(component.isSettingsOpen()).toBe(false);
      component.toggleSettings();
      expect(component.isSettingsOpen()).toBe(true);
      component.toggleSettings();
      expect(component.isSettingsOpen()).toBe(false);
    });

    it('should close mobile menu when opening settings', () => {
      component.isMobileMenuOpen.set(true);
      component.toggleSettings();
      expect(component.isSettingsOpen()).toBe(true);
      expect(component.isMobileMenuOpen()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear tokens and navigate to / on successful logout', () => {
      localStorage.setItem('token', 'fake_local_token');
      sessionStorage.setItem('token', 'fake_session_token');

      vi.spyOn(logoutService, 'logout').mockReturnValue(of({ message: 'Logged out successfully' }));
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('token')).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should clear tokens and navigate to / even if logout service returns an error', () => {
      localStorage.setItem('token', 'fake_local_token');
      sessionStorage.setItem('token', 'fake_session_token');

      vi.spyOn(logoutService, 'logout').mockReturnValue(throwError(() => new Error('Server error')));
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('token')).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
  });
});
