import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { HomePageComponent } from './home-page.component';
import { LoginService } from '@features/auth/services/login/login.service';
import { environment } from '@environments/environment';
import { of } from 'rxjs';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;
  let httpMock: HttpTestingController;
  let loginService: LoginService;

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
      imports: [HomePageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    loginService = TestBed.inject(LoginService);
    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/lights/status/app`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/lights/history?limit=20`).flush([]);

    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    httpMock.verify();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loginService', () => {
    it('should expose loginService publicly for the template', () => {
      expect(component.loginService).toBeTruthy();
    });

    it('should display empty userName when no token is present', () => {
      expect(component.loginService.userName()).toBe('');
    });

    it('should display userName from localStorage token', () => {
      const fakeToken =
        'eyJhbGciOiJIUzI1NiJ9.' +
        btoa(JSON.stringify({ userName: 'testUser' })) +
        '.signature';
      localStorage.setItem('token', fakeToken);

      loginService.initUserFromToken();

      expect(component.loginService.userName()).toBe('testUser');
    });
  });
});
