import { TestBed } from '@angular/core/testing';

import { OutsideDataReadService } from './outside-data-read.service';

describe('OutsideDataReadService', () => {
  let service: OutsideDataReadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OutsideDataReadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
