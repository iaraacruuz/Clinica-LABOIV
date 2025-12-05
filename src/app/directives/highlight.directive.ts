import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective {
  @Input() highlightColor: string = '#e3f2fd';

  constructor(private el: ElementRef) {}

  /** Aplica el color de resaltado al pasar el mouse */
  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.highlightColor);
  }

  /** Remueve el color de resaltado al quitar el mouse */
  @HostListener('mouseleave') onMouseLeave() {
    this.highlight('');
  }

  private highlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
    this.el.nativeElement.style.transition = 'background-color 0.3s ease';
  }
}
