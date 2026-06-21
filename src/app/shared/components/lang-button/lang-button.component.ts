import { Component, inject, signal, OnInit } from '@angular/core';
import { TranslationsService} from '@core/services/translations/translations.service';

@Component({
  selector: 'app-lang-button',
  standalone: true,
  imports: [],
  templateUrl: './lang-button.component.html',
  styles: ``,
})
export class LangButtonComponent implements OnInit {
  public translationsService = inject(TranslationsService);
  public isLoaded = signal(false);

  ngOnInit() {
    setTimeout(() => {
      this.isLoaded.set(true);
    }, 50);
  }
}
