import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { TemperatureDisplayComponent } from './temperature-display.component';

describe('TemperatureDisplayComponent', () => {
  let component: TemperatureDisplayComponent;
  let fixture: ComponentFixture<TemperatureDisplayComponent>;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [TemperatureDisplayComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TemperatureDisplayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return comfortable status when temperature is null or between 20 and 24', () => {
    expect(component.temperatureStatusKey()).toBe('temperatureDisplay.comfortable');

    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 22,
      pressure: 1013,
      humidity: 50,
      createdAt: '',
    });
    expect(component.temperatureStatusKey()).toBe('temperatureDisplay.comfortable');
  });

  it('should return neutral status for 18-19.9 and 24.1-26', () => {
    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 19,
      pressure: 1013,
      humidity: 50,
      createdAt: '',
    });
    expect(component.temperatureStatusKey()).toBe('temperatureDisplay.neutral');

    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 25.5,
      pressure: 1013,
      humidity: 50,
      createdAt: '',
    });
    expect(component.temperatureStatusKey()).toBe('temperatureDisplay.neutral');
  });

  it('should return notComfortable status below 18 or above 26', () => {
    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 16,
      pressure: 1013,
      humidity: 50,
      createdAt: '',
    });
    expect(component.temperatureStatusKey()).toBe('temperatureDisplay.notComfortable');

    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 28,
      pressure: 1013,
      humidity: 50,
      createdAt: '',
    });
    expect(component.temperatureStatusKey()).toBe('temperatureDisplay.notComfortable');
  });
});
