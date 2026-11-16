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
});
