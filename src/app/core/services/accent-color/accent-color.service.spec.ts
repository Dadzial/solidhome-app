import { TestBed } from '@angular/core/testing';

import { AccentColorService } from './accent-color.service';

describe('AccentColorService', () => {
  let service: AccentColorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccentColorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
