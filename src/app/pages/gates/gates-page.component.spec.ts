import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GatesPageComponent } from './gates-page.component';

describe('GatesPageComponent', () => {
  let component: GatesPageComponent;
  let fixture: ComponentFixture<GatesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GatesPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GatesPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
