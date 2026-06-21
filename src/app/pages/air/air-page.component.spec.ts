import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirComponent } from './air.component';

describe('AirComponent', () => {
  let component: AirComponent;
  let fixture: ComponentFixture<AirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AirComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
