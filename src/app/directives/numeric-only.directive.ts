import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appNumericOnly]',
  standalone: true
})
export class NumericOnlyDirective {
  constructor(private el: ElementRef) {}

  /** Permite solo caracteres numéricos en el campo de entrada */
  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const initialValue = input.value;

    input.value = initialValue.replace(/[^0-9]/g, '');

    if (initialValue !== input.value) {
      event.stopPropagation();
    }
  }

  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedInput = event.clipboardData?.getData('text/plain');
    if (pastedInput) {
      const numericValue = pastedInput.replace(/[^0-9]/g, '');
      document.execCommand('insertText', false, numericValue);
    }
  }
}
