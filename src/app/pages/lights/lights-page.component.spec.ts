import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { LightsPageComponent } from './lights-page.component';
import { environment } from '@environments/environment';
import { of } from 'rxjs';

describe('LightsPageComponent', () => {
  let component: LightsPageComponent;
  let fixture: ComponentFixture<LightsPageComponent>;
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
      imports: [LightsPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LightsPageComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/lights/status/app`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/lights/history?limit=20`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/lights/rules`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/lights/scenes`).flush([]);
    httpMock
      .expectOne(`${environment.apiUrl}/lights/energy?timeframe=today&room=entireHouse`)
      .flush({
        name: 'entireHouse',
        timeframe: 'today',
        totalKwh: 0,
        chartData: [],
        categories: [],
        topRooms: [],
        lightsKwh: {},
        totalHouseKwh: 0,
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

  describe('global error overlay and allFailed computed', () => {
    it('should evaluate allFailed as false when not all services failed', () => {
      component.lightsControlService.hasError.set(true);
      component.lightsScheduleService.hasError.set(false);
      component.lightsEnergyService.hasError.set(true);
      component.lightsScenesService.hasError.set(true);

      expect(component.allFailed()).toBe(false);
      fixture.detectChanges();

      const globalOverlay = fixture.nativeElement.querySelector(
        'app-error-overlay[data-testid="page-error-overlay"]',
      );
      expect(globalOverlay).toBeNull();
    });

    it('should evaluate allFailed as true and render global error overlay when all services failed', () => {
      component.lightsControlService.hasError.set(true);
      component.lightsScheduleService.hasError.set(true);
      component.lightsEnergyService.hasError.set(true);
      component.lightsScenesService.hasError.set(true);
      component.lightsControlService.errorMessage.set('apiErrors.network');

      expect(component.allFailed()).toBe(true);
      fixture.detectChanges();

      const globalOverlay = fixture.nativeElement.querySelector(
        'app-error-overlay[data-testid="page-error-overlay"]',
      );
      expect(globalOverlay).toBeTruthy();
    });

    it('should call retryAll on all 4 services when retry is clicked on global overlay', () => {
      component.lightsControlService.hasError.set(true);
      component.lightsScheduleService.hasError.set(true);
      component.lightsEnergyService.hasError.set(true);
      component.lightsScenesService.hasError.set(true);
      fixture.detectChanges();

      const loadLightsSpy = vi
        .spyOn(component.lightsControlService, 'loadLights')
        .mockImplementation(() => {});
      const loadRulesSpy = vi
        .spyOn(component.lightsScheduleService, 'loadRules')
        .mockImplementation(() => {});
      const loadEnergySpy = vi
        .spyOn(component.lightsEnergyService, 'loadEnergyStats')
        .mockImplementation(() => {});
      const loadScenesSpy = vi
        .spyOn(component.lightsScenesService, 'loadScenes')
        .mockImplementation(() => {});

      const globalOverlay = fixture.nativeElement.querySelector(
        'app-error-overlay[data-testid="page-error-overlay"]',
      );
      expect(globalOverlay).toBeTruthy();

      const retryBtn = globalOverlay.querySelector('button') as HTMLButtonElement;
      retryBtn.click();

      expect(loadLightsSpy).toHaveBeenCalled();
      expect(loadRulesSpy).toHaveBeenCalled();
      expect(loadEnergySpy).toHaveBeenCalled();
      expect(loadScenesSpy).toHaveBeenCalled();
    });
  });
});
