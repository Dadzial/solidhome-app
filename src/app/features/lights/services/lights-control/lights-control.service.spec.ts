import { TestBed } from '@angular/core/testing';

import { LightsControlService } from './lights-control.service';

describe('LightsControlService', () => {
  let service: LightsControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LightsControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
