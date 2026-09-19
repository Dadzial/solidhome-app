import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightsScenesComponent } from './lights-scenes.component';

describe('LightsScenesComponent', () => {
  let component: LightsScenesComponent;
  let fixture: ComponentFixture<LightsScenesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightsScenesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LightsScenesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
