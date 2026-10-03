import { TestBed } from '@angular/core/testing';

import { LightsEnergyService } from './lights-energy.service';

describe('LightsEnergyService', () => {
  let service: LightsEnergyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LightsEnergyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
