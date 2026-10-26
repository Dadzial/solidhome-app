import { TestBed } from '@angular/core/testing';

import { AirDataReadService } from './air-data-read.service';

describe('AirDataReadService', () => {
  let service: AirDataReadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirDataReadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
