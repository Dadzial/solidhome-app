import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { App } from './app';
import { of } from 'rxjs';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let router: Router;
  let httpMock: HttpTestingController;

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
      imports: [App],
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
    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('title signal should equal SolidHomeApp', () => {
    expect((component as any).title()).toBe('SolidHomeApp');
  });

  it('should render spinner loader when loadingService.isLoading is true', () => {
    component.loadingService.isLoading.set(true);
    fixture.detectChanges();

    const spinnerEl = fixture.nativeElement.querySelector('app-spinner-loader');
    expect(spinnerEl).toBeTruthy();
  });

  it('should not render spinner loader when loadingService.isLoading is false', () => {
    component.loadingService.isLoading.set(false);
    fixture.detectChanges();

    const spinnerEl = fixture.nativeElement.querySelector('app-spinner-loader');
    expect(spinnerEl).toBeNull();
  });

  it('onStorageChange should navigate to / when token is removed', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onStorageChange({
      key: 'token',
      newValue: null,
    } as StorageEvent);

    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('onStorageChange should not navigate when other key changes', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onStorageChange({
      key: 'other_key',
      newValue: null,
    } as StorageEvent);

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('onStorageChange should not navigate when token is set (not removed)', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onStorageChange({
      key: 'token',
      newValue: 'some_valid_token',
    } as StorageEvent);

    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
