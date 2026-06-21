import { Injectable , signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  public isLoading = signal<boolean>(false);

  public showLoadingWindow(): void {
    this.isLoading.set(true);
  }

  public hideLoadingWindow(): void {
    this.isLoading.set(false);
  }
}
