import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorBanerComponent } from './error-baner.component';

describe('ErrorBanerComponent', () => {
  let component: ErrorBanerComponent;
  let fixture: ComponentFixture<ErrorBanerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBanerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorBanerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
