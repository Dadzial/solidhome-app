import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LightsScheduleService } from './lights-schedule.service';

describe('LightsScheduleService', () => {
  let service: LightsScheduleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LightsScheduleService,
      ],
    });
    service = TestBed.inject(LightsScheduleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
