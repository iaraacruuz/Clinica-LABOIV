import { Directive, ElementRef, Renderer2, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';

@Directive({
  selector: '[appCaptcha]',
  standalone: true
})
export class CaptchaDirective implements OnInit, OnDestroy {
  @Input() appCaptcha: boolean = true;
  @Output() captchaValidated = new EventEmitter<boolean>();
  
  private captchaContainer: HTMLElement | null = null;
  private captchaCanvas: HTMLCanvasElement | null = null;
  private captchaInput: HTMLInputElement | null = null;
  private captchaButton: HTMLButtonElement | null = null;
  private resultMessage: HTMLElement | null = null;
  
  private num1: number = 0;
  private num2: number = 0;
  private correctAnswer: number = 0;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    if (!this.appCaptcha) {
      this.captchaValidated.emit(true);
      return;
    }
    
    this.createCaptchaUI();
    this.generateNewCaptcha();
  }

  ngOnDestroy(): void {
    if (this.captchaContainer && this.el.nativeElement.contains(this.captchaContainer)) {
      this.renderer.removeChild(this.el.nativeElement, this.captchaContainer);
    }
  }

  /** Crea la interfaz visual del captcha con canvas, input y botones */
  private createCaptchaUI(): void {
    // Contenedor principal
    this.captchaContainer = this.renderer.createElement('div');
    this.renderer.setStyle(this.captchaContainer, 'background', '#f8f9fa');
    this.renderer.setStyle(this.captchaContainer, 'border', '2px solid #dee2e6');
    this.renderer.setStyle(this.captchaContainer, 'border-radius', '8px');
    this.renderer.setStyle(this.captchaContainer, 'padding', '15px');
    this.renderer.setStyle(this.captchaContainer, 'margin', '15px 0');
    this.renderer.setStyle(this.captchaContainer, 'text-align', 'center');

    const title = this.renderer.createElement('p');
    const titleText = this.renderer.createText('🔒 Verificación de Seguridad');
    this.renderer.setStyle(title, 'font-weight', 'bold');
    this.renderer.setStyle(title, 'margin-bottom', '10px');
    this.renderer.setStyle(title, 'color', '#495057');
    this.renderer.appendChild(title, titleText);
    this.renderer.appendChild(this.captchaContainer, title);

    this.captchaCanvas = this.renderer.createElement('canvas');
    this.renderer.setAttribute(this.captchaCanvas, 'width', '200');
    this.renderer.setAttribute(this.captchaCanvas, 'height', '60');
    this.renderer.setStyle(this.captchaCanvas, 'border', '1px solid #ced4da');
    this.renderer.setStyle(this.captchaCanvas, 'border-radius', '4px');
    this.renderer.setStyle(this.captchaCanvas, 'background', 'white');
    this.renderer.setStyle(this.captchaCanvas, 'margin-bottom', '10px');
    this.renderer.appendChild(this.captchaContainer, this.captchaCanvas);

    this.captchaInput = this.renderer.createElement('input');
    this.renderer.setAttribute(this.captchaInput, 'type', 'number');
    this.renderer.setAttribute(this.captchaInput, 'placeholder', 'Ingresá el resultado');
    this.renderer.setStyle(this.captchaInput, 'width', '180px');
    this.renderer.setStyle(this.captchaInput, 'padding', '8px');
    this.renderer.setStyle(this.captchaInput, 'margin', '5px');
    this.renderer.setStyle(this.captchaInput, 'border', '1px solid #ced4da');
    this.renderer.setStyle(this.captchaInput, 'border-radius', '4px');
    this.renderer.setStyle(this.captchaInput, 'font-size', '14px');
    this.renderer.appendChild(this.captchaContainer, this.captchaInput);

    this.captchaButton = this.renderer.createElement('button');
    const btnText = this.renderer.createText('Verificar');
    this.renderer.setStyle(this.captchaButton, 'background', '#28a745');
    this.renderer.setStyle(this.captchaButton, 'color', 'white');
    this.renderer.setStyle(this.captchaButton, 'border', 'none');
    this.renderer.setStyle(this.captchaButton, 'padding', '8px 20px');
    this.renderer.setStyle(this.captchaButton, 'border-radius', '4px');
    this.renderer.setStyle(this.captchaButton, 'cursor', 'pointer');
    this.renderer.setStyle(this.captchaButton, 'font-size', '14px');
    this.renderer.setStyle(this.captchaButton, 'margin', '5px');
    this.renderer.setAttribute(this.captchaButton, 'type', 'button');
    this.renderer.appendChild(this.captchaButton, btnText);
    this.renderer.listen(this.captchaButton, 'click', () => this.verifyCaptcha());
    this.renderer.appendChild(this.captchaContainer, this.captchaButton);

    const refreshButton = this.renderer.createElement('button');
    const refreshText = this.renderer.createText('🔄 Nuevo');
    this.renderer.setStyle(refreshButton, 'background', '#6c757d');
    this.renderer.setStyle(refreshButton, 'color', 'white');
    this.renderer.setStyle(refreshButton, 'border', 'none');
    this.renderer.setStyle(refreshButton, 'padding', '8px 20px');
    this.renderer.setStyle(refreshButton, 'border-radius', '4px');
    this.renderer.setStyle(refreshButton, 'cursor', 'pointer');
    this.renderer.setStyle(refreshButton, 'font-size', '14px');
    this.renderer.setStyle(refreshButton, 'margin', '5px');
    this.renderer.setAttribute(refreshButton, 'type', 'button');
    this.renderer.appendChild(refreshButton, refreshText);
    this.renderer.listen(refreshButton, 'click', () => this.generateNewCaptcha());
    this.renderer.appendChild(this.captchaContainer, refreshButton);

    this.resultMessage = this.renderer.createElement('p');
    this.renderer.setStyle(this.resultMessage, 'margin-top', '10px');
    this.renderer.setStyle(this.resultMessage, 'font-size', '14px');
    this.renderer.setStyle(this.resultMessage, 'font-weight', 'bold');
    this.renderer.setStyle(this.resultMessage, 'min-height', '20px');
    this.renderer.appendChild(this.captchaContainer, this.resultMessage);

    this.renderer.appendChild(this.el.nativeElement, this.captchaContainer);
  }

  /** Genera una nueva operación matemática aleatoria para el captcha */
  private generateNewCaptcha(): void {
    this.num1 = Math.floor(Math.random() * 20) + 1;
    this.num2 = Math.floor(Math.random() * 20) + 1;
    
    const operation = Math.random() > 0.5 ? '+' : '-';
    
    if (operation === '+') {
      this.correctAnswer = this.num1 + this.num2;
    } else {
      if (this.num1 < this.num2) {
        [this.num1, this.num2] = [this.num2, this.num1];
      }
      this.correctAnswer = this.num1 - this.num2;
    }

    this.drawCaptcha(operation);
    
    if (this.captchaInput) {
      this.captchaInput.value = '';
    }
    if (this.resultMessage) {
      this.resultMessage.textContent = '';
    }
    
    this.captchaValidated.emit(false);
  }

  /** Dibuja la operación matemática en el canvas con efectos de seguridad */
  private drawCaptcha(operation: string): void {
    if (!this.captchaCanvas) return;

    const ctx = this.captchaCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 200, 60);

    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, 200, 60);
    gradient.addColorStop(0, '#e3f2fd');
    gradient.addColorStop(1, '#bbdefb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 60);

    ctx.strokeStyle = '#90caf9';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 200, Math.random() * 60);
      ctx.lineTo(Math.random() * 200, Math.random() * 60);
      ctx.stroke();
    }

    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#1976d2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = `${this.num1} ${operation} ${this.num2} = ?`;
    ctx.fillText(text, 100, 30);

    ctx.fillStyle = '#64b5f6';
    for (let i = 0; i < 30; i++) {
      ctx.fillRect(Math.random() * 200, Math.random() * 60, 2, 2);
    }
  }

  /** Verifica si la respuesta ingresada es correcta */
  private verifyCaptcha(): void {
    if (!this.captchaInput) return;

    const userAnswer = parseInt(this.captchaInput.value);

    if (isNaN(userAnswer)) {
      this.showMessage('⚠️ Por favor ingresá un número', '#ffc107');
      return;
    }

    if (userAnswer === this.correctAnswer) {
      this.showMessage('✓ ¡Correcto! Verificación exitosa', '#28a745');
      this.captchaValidated.emit(true);
      
      if (this.captchaInput) this.captchaInput.disabled = true;
      if (this.captchaButton) this.captchaButton.disabled = true;
    } else {
      this.showMessage('✗ Respuesta incorrecta. Intentá de nuevo', '#dc3545');
      this.captchaValidated.emit(false);
      setTimeout(() => {
        this.generateNewCaptcha();
      }, 1500);
    }
  }

  private showMessage(message: string, color: string): void {
    if (!this.resultMessage) return;
    
    this.resultMessage.textContent = message;
    this.renderer.setStyle(this.resultMessage, 'color', color);
  }

  public reset(): void {
    this.generateNewCaptcha();
    if (this.captchaInput) {
      this.captchaInput.disabled = false;
    }
    if (this.captchaButton) {
      this.captchaButton.disabled = false;
    }
  }
}
