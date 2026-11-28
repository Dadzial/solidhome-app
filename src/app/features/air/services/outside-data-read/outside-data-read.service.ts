import { Injectable, inject } from '@angular/core';
import { ApiConnectService } from '@core/services/api/api-connect.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OutsideDataReadService {
  /** Inject ApiConnectService do wykonywania żądań do backendu. */
  private api = inject(ApiConnectService);
}
