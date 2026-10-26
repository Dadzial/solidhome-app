import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirWidgetComponent } from './air-widget.component';

describe('AirWidgetComponent', () => {
  let component: AirWidgetComponent;
  let fixture: ComponentFixture<AirWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AirWidgetComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
