import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirChartsComponent } from './air-charts.component';

describe('AirChartsComponent', () => {
  let component: AirChartsComponent;
  let fixture: ComponentFixture<AirChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirChartsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AirChartsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
