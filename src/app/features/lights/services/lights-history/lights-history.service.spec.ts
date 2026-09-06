import { TestBed } from '@angular/core/testing';

import { LightsHistoryService } from './lights-history.service';

describe('LightsHistoryService', () => {
  let service: LightsHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LightsHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
