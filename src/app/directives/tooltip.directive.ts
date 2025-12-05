import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective {
  @Input() appTooltip: string = '';
  private tooltipElement: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  /** Muestra el tooltip al pasar el mouse sobre el elemento */
  @HostListener('mouseenter') onMouseEnter() {
    if (!this.appTooltip) return;
    this.showTooltip();
  }

  /** Oculta el tooltip al quitar el mouse del elemento */
  @HostListener('mouseleave') onMouseLeave() {
    this.hideTooltip();
  }

  private showTooltip() {
    this.tooltipElement = this.renderer.createElement('span');
    this.renderer.appendChild(
      this.tooltipElement,
      this.renderer.createText(this.appTooltip)
    );

    this.renderer.appendChild(document.body, this.tooltipElement);

    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipElement, 'background-color', '#333');
    this.renderer.setStyle(this.tooltipElement, 'color', '#fff');
    this.renderer.setStyle(this.tooltipElement, 'padding', '5px 10px');
    this.renderer.setStyle(this.tooltipElement, 'border-radius', '4px');
    this.renderer.setStyle(this.tooltipElement, 'font-size', '12px');
    this.renderer.setStyle(this.tooltipElement, 'z-index', '1000');
    this.renderer.setStyle(this.tooltipElement, 'white-space', 'nowrap');

    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltipPos = this.tooltipElement?.getBoundingClientRect();

    if (tooltipPos) {
      const top = hostPos.top - tooltipPos.height - 5;
      const left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;

      this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
      this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
    }
  }

  private hideTooltip() {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }
}
