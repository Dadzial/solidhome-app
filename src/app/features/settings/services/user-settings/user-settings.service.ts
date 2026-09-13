import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { UpdateUserRequest, UpdateUserResponse } from '@features/settings/models/settings.models';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  public updateUser(data: UpdateUserRequest) {
    return this.http.post<UpdateUserResponse>(`${this.apiUrl}/update`, data);
  }
}
