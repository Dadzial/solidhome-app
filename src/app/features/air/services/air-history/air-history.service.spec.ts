import { TestBed } from '@angular/core/testing';

import { AirHistoryService } from './air-history.service';

describe('AirHistoryService', () => {
  let service: AirHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
