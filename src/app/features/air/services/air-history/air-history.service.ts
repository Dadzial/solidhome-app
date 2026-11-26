import { Injectable, inject } from '@angular/core';
import {ApiConnectService} from '@core/services/api/api-connect.service';

@Injectable({
  providedIn: 'root',
})
export class AirHistoryService {
  /** Inject ApiConnectService do wykonywania żądań do backendu. */
  private api = inject(ApiConnectService);
}
