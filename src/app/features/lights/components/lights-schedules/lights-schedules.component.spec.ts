import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightsSchedulesComponent } from './lights-schedules.component';

describe('LightsSchedulesComponent', () => {
  let component: LightsSchedulesComponent;
  let fixture: ComponentFixture<LightsSchedulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightsSchedulesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LightsSchedulesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
