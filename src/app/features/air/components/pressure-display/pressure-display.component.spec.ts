import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { PressureDisplayComponent } from './pressure-display.component';

describe('PressureDisplayComponent', () => {
  let component: PressureDisplayComponent;
  let fixture: ComponentFixture<PressureDisplayComponent>;

  beforeEach(async () => {
    const mockSvgRegistry: Partial<SvgIconRegistryService> = {
      loadSvg: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [PressureDisplayComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        { provide: SvgIconRegistryService, useValue: mockSvgRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PressureDisplayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return normal status when pressure is null or between 1005 and 1020', () => {
    expect(component.pressureStatusKey()).toBe('pressureDisplay.normal');

    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 22,
      pressure: 1013,
      humidity: 50,
      createdAt: '',
    });
    expect(component.pressureStatusKey()).toBe('pressureDisplay.normal');
  });

  it('should return low status below 1005 and high status above 1020', () => {
    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 22,
      pressure: 998,
      humidity: 50,
      createdAt: '',
    });
    expect(component.pressureStatusKey()).toBe('pressureDisplay.low');

    component.airDataService.currentAir.set({
      _id: '1',
      temperature: 22,
      pressure: 1028,
      humidity: 50,
      createdAt: '',
    });
    expect(component.pressureStatusKey()).toBe('pressureDisplay.high');
  });
});
