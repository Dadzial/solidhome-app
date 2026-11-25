import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { HumidityDisplayComponent } from './humidity-display.component';

describe('HumidityDisplayComponent', () => {
  let component: HumidityDisplayComponent;
  let fixture: ComponentFixture<HumidityDisplayComponent>;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [HumidityDisplayComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HumidityDisplayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return optimal status when humidity is null or between 40 and 60', () => {
    expect(component.humidityStatusKey()).toBe('humidityDisplay.optimal');

    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 22,
      pressure: 1013,
      humidity: 50,
      createdAt: '',
    });
    expect(component.humidityStatusKey()).toBe('humidityDisplay.optimal');
  });

  it('should return dry status below 40 and humid status above 60', () => {
    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 22,
      pressure: 1013,
      humidity: 32,
      createdAt: '',
    });
    expect(component.humidityStatusKey()).toBe('humidityDisplay.dry');

    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 22,
      pressure: 1013,
      humidity: 72,
      createdAt: '',
    });
    expect(component.humidityStatusKey()).toBe('humidityDisplay.humid');
  });
});
