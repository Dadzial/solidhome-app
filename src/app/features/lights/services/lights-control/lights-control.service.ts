import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { LightItem } from '@features/lights/models/lights.models';

@Injectable({
  providedIn: 'root',
})
export class LightsControlService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lights`;

  public getStatus(): Observable<LightItem[]> {
    return this.http.get<LightItem[]>(`${this.apiUrl}/status/app`);
  }

  public updateStatus(name: string, state: boolean): Observable<LightItem> {
    const payload = {
      name,
      state: state ? 1 : 0,
    };

    return this.http.post<LightItem>(`${this.apiUrl}/update`, payload);
  }
}
