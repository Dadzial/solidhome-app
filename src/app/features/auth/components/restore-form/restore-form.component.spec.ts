import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestoreFormComponent } from './restore-form.component';

describe('RestoreFormComponent', () => {
  let component: RestoreFormComponent;
  let fixture: ComponentFixture<RestoreFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestoreFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RestoreFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
