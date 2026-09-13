import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { LightHistoryItem, ResetHistoryResponse } from '@features/lights/models/lights.models';

@Injectable({
  providedIn: 'root',
})
export class LightsHistoryService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lights`;

  public getHistory(limit?: number): Observable<LightHistoryItem[]> {
    const options = limit ? { params: { limit: limit.toString() } } : {};
    return this.http.get<LightHistoryItem[]>(`${this.apiUrl}/history`, options);
  }

  public resetHistory(): Observable<ResetHistoryResponse> {
    return this.http.delete<ResetHistoryResponse>(`${this.apiUrl}/history/reset`);
  }
}
