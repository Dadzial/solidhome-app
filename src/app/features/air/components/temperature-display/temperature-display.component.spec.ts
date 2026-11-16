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
});
