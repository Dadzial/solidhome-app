import { Injectable , inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, throwError } from 'rxjs';


interface LightRequest {
  numberOfLight: number;
  state :number
}

interface LightResponse {
  status:number;
}

interface ApiError {
  error: string;
  details?: string[];
  value?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LightsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lights`;
}
