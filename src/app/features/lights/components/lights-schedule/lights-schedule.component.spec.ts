import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightsScheduleComponent } from './lights-schedule.component';

describe('LightsScheduleComponent', () => {
  let component: LightsScheduleComponent;
  let fixture: ComponentFixture<LightsScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightsScheduleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LightsScheduleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
