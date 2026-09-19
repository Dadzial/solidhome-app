import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';
/**
 * Dyrektywa wykrywająca kliknięcia poza elementem, do którego została przypisana.
 *
 * Używana głównie do automatycznego zamykania rozwijanych menu, modali i paneli bocznych.
 *
 * ### Zasady działania:
 * - Nasłuchuje globalnych kliknięć w dokumencie (`document:click`).
 * - Ignoruje kliknięcia w elementy o identyfikatorze `#mobile-menu-btn` oraz klasie `.settings-toggle-btn`.
 * - Jeśli kliknięty element znajduje się poza granicami elementu docelowego, emituje sygnał wyjściowy `appClickOutside`.
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  /** Referencja do elementu DOM, na którym umieszczono dyrektywę. */
  private elementRef = inject(ElementRef);
  /** Zdarzenie emitowane w momencie kliknięcia poza obszarem elementu. */
  public appClickOutside = output<void>();
  /**
   * Obsługuje globalne zdarzenie kliknięcia dokumentu.
   *
   * @param {MouseEvent} event Obiekt zdarzenia kliknięcia myszą.
   * @returns {void}
   */
  @HostListener('document:click', ['$event'])
  public onClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    if (!targetElement) return;

    if (
      targetElement.closest &&
      (targetElement.closest('#mobile-menu-btn') ||
        targetElement.closest('.settings-toggle-btn'))
    ) {
      return;
    }

    const clickedInside = this.elementRef.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.appClickOutside.emit();
    }
  }
}
