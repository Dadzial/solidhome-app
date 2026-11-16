import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HumidityDisplayComponent } from './humidity-display.component';

describe('HumidityDisplayComponent', () => {
  let component: HumidityDisplayComponent;
  let fixture: ComponentFixture<HumidityDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HumidityDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HumidityDisplayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
