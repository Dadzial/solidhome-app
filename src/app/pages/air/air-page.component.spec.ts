import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { AirPageComponent } from './air-page.component';
import { of } from 'rxjs';

describe('AirPageComponent', () => {
  let component: AirPageComponent;
  let fixture: ComponentFixture<AirPageComponent>;
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

    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AirPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AirPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/air/current');
    req.flush({
      _id: 'air1',
      temperature: 22,
      pressure: 1013,
      humidity: 50,
      createdAt: '2026-11-25T20:00:00Z',
    });
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error overlay when errorMessage is set and retry on click', () => {
    component.airDataService.errorMessage.set('apiErrors.server');
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('app-error-overlay');
    expect(overlay).toBeTruthy();

    const retryButton: HTMLButtonElement | null = overlay.querySelector('button');
    retryButton?.click();

    const retryReq = httpMock.expectOne('/api/air/current');
    retryReq.flush({
      _id: 'air2',
      temperature: 23,
      pressure: 1015,
      humidity: 48,
      createdAt: '2026-11-25T20:05:00Z',
    });
    expect(component.airDataService.errorMessage()).toBeNull();
  });
});
