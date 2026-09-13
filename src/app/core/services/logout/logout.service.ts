import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { LogoutResponse } from '@core/models/core.models';

@Injectable({
  providedIn: 'root',
})
export class LogoutService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  public logout() {
    return this.http.delete<LogoutResponse>(`${this.apiUrl}/logout`);
  }
}
