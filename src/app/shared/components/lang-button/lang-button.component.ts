import { Component , inject } from '@angular/core';
import { TranslationsService} from '@core/services/translations/translations.service';

@Component({
  selector: 'app-lang-button',
  standalone: true,
  imports: [],
  templateUrl: './lang-button.component.html',
  styles: ``,
})
export class LangButtonComponent {
  public translationsService = inject(TranslationsService);
}
