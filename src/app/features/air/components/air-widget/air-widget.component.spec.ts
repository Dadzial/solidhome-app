import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { AirWidgetComponent } from './air-widget.component';

describe('AirWidgetComponent', () => {
  let component: AirWidgetComponent;
  let fixture: ComponentFixture<AirWidgetComponent>;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AirWidgetComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AirWidgetComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadCurrentAir on onRetry', () => {
    const spy = vi.spyOn(component.airDataService, 'loadCurrentAir');
    component.onRetry();
    expect(spy).toHaveBeenCalled();
  });

  it('should render error overlay when errorMessage is set and trigger onRetry on click', () => {
    component.airDataService.errorMessage.set('apiErrors.server');
    fixture.detectChanges();

    const errorOverlay = fixture.nativeElement.querySelector('app-error-overlay');
    expect(errorOverlay).toBeTruthy();

    const onRetrySpy = vi.spyOn(component, 'onRetry');
    const retryBtn = errorOverlay.querySelector('button') as HTMLButtonElement;
    retryBtn.click();

    expect(onRetrySpy).toHaveBeenCalled();
  });

  describe('temperatureStatusKey', () => {
    it('should return comfortable when temperature is null or board is offline', () => {
      component.airDataService.currentAir.set(null);
      expect(component.temperatureStatusKey()).toBe('home.airWidget.comfortable');

      (component.airDataService.hardwareStatus.isBoardOnline as any).set(false);
      component.airDataService.currentAir.set({ temperature: 30, pressure: 1013, humidity: 50 });
      expect(component.temperatureStatusKey()).toBe('home.airWidget.comfortable');
    });

    it('should return comfortable when temperature is between 20 and 24', () => {
      (component.airDataService.hardwareStatus.isBoardOnline as any).set(true);
      component.airDataService.currentAir.set({ temperature: 22, pressure: 1013, humidity: 50 });
      expect(component.temperatureStatusKey()).toBe('home.airWidget.comfortable');
    });

    it('should return neutral when temperature is between 18-20 or 24-26', () => {
      (component.airDataService.hardwareStatus.isBoardOnline as any).set(true);
      component.airDataService.currentAir.set({ temperature: 19, pressure: 1013, humidity: 50 });
      expect(component.temperatureStatusKey()).toBe('home.airWidget.neutral');

      component.airDataService.currentAir.set({ temperature: 25, pressure: 1013, humidity: 50 });
      expect(component.temperatureStatusKey()).toBe('home.airWidget.neutral');
    });

    it('should return notComfortable when temperature is below 18 or above 26', () => {
      (component.airDataService.hardwareStatus.isBoardOnline as any).set(true);
      component.airDataService.currentAir.set({ temperature: 16, pressure: 1013, humidity: 50 });
      expect(component.temperatureStatusKey()).toBe('home.airWidget.notComfortable');

      component.airDataService.currentAir.set({ temperature: 28, pressure: 1013, humidity: 50 });
      expect(component.temperatureStatusKey()).toBe('home.airWidget.notComfortable');
    });
  });

  describe('pressureStatusKey', () => {
    it('should return stable when pressure is null or board is offline', () => {
      component.airDataService.currentAir.set(null);
      expect(component.pressureStatusKey()).toBe('home.airWidget.stable');

      (component.airDataService.hardwareStatus.isBoardOnline as any).set(false);
      component.airDataService.currentAir.set({ temperature: 22, pressure: 980, humidity: 50 });
      expect(component.pressureStatusKey()).toBe('home.airWidget.stable');
    });

    it('should return stable when pressure is between 1010 and 1020', () => {
      (component.airDataService.hardwareStatus.isBoardOnline as any).set(true);
      component.airDataService.currentAir.set({ temperature: 22, pressure: 1015, humidity: 50 });
      expect(component.pressureStatusKey()).toBe('home.airWidget.stable');
    });

    it('should return moderate when pressure is between 1000-1010 or 1020-1030', () => {
      (component.airDataService.hardwareStatus.isBoardOnline as any).set(true);
      component.airDataService.currentAir.set({ temperature: 22, pressure: 1005, humidity: 50 });
      expect(component.pressureStatusKey()).toBe('home.airWidget.moderate');

      component.airDataService.currentAir.set({ temperature: 22, pressure: 1025, humidity: 50 });
      expect(component.pressureStatusKey()).toBe('home.airWidget.moderate');
    });

    it('should return unstable when pressure is below 1000 or above 1030', () => {
      (component.airDataService.hardwareStatus.isBoardOnline as any).set(true);
      component.airDataService.currentAir.set({ temperature: 22, pressure: 988, humidity: 50 });
      expect(component.pressureStatusKey()).toBe('home.airWidget.unstable');

      component.airDataService.currentAir.set({ temperature: 22, pressure: 1035, humidity: 50 });
      expect(component.pressureStatusKey()).toBe('home.airWidget.unstable');
    });
  });
});
