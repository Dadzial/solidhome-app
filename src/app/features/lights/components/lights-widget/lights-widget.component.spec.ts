import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightsWidgetComponent } from './lights-widget.component';

describe('LightsWidgetComponent', () => {
  let component: LightsWidgetComponent;
  let fixture: ComponentFixture<LightsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightsWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LightsWidgetComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
