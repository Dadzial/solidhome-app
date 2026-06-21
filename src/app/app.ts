import { Component, signal, HostListener, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { LoadingService } from '@core/services/loading/loading.service';
import { SpinnerLoaderComponent } from '@shared/components/spinner-loader/spinner-loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerLoaderComponent],
  standalone : true,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('SolidHomeApp');
  private router = inject(Router);
  public loadingService = inject(LoadingService);

  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent) {
    if (event.key === 'token' && !event.newValue) {
      this.router.navigate(['/']);
    }
  }
}
