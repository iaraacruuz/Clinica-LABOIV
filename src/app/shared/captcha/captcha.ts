import { Component, EventEmitter, Output, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { enviroment } from '../../../environments/environment';

// Declarar grecaptcha para TypeScript
declare const grecaptcha: any;

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './captcha.html',
  styleUrls: ['./captcha.scss']
})
export class CaptchaComponent implements OnInit, OnDestroy {
  @Output() onValidated = new EventEmitter<boolean>();
  
  siteKey = enviroment.recaptchaSiteKey;
  
  captchaReady = false;
  isBrowser = false;
  widgetId: number | null = null;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    
    // Esperar a que grecaptcha esté disponible
    this.waitForRecaptcha();
  }

  waitForRecaptcha() {
    const checkRecaptcha = setInterval(() => {
      if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
        clearInterval(checkRecaptcha);
        this.renderRecaptcha();
      }
    }, 100);

    // Timeout después de 10 segundos
    setTimeout(() => {
      clearInterval(checkRecaptcha);
      if (!this.captchaReady) {
        console.error('Google reCAPTCHA no se cargó correctamente');
      }
    }, 10000);
  }

  renderRecaptcha() {
    try {
      const container = document.getElementById('recaptcha-container');
      if (!container) return;

      this.widgetId = grecaptcha.render('recaptcha-container', {
        sitekey: this.siteKey,
        callback: (response: string) => this.onCaptchaResolved(response),
        'expired-callback': () => this.onCaptchaExpired()
      });
      
      this.captchaReady = true;
    } catch (error) {
      console.error('Error rendering reCAPTCHA:', error);
    }
  }

  onCaptchaResolved(response: string) {
    if (response) {
      this.onValidated.emit(true);
    }
  }

  onCaptchaExpired() {
    this.onValidated.emit(false);
  }

  reset() {
    if (this.widgetId !== null && typeof grecaptcha !== 'undefined') {
      grecaptcha.reset(this.widgetId);
      this.onValidated.emit(false);
    }
  }

  ngOnDestroy() {
    // Limpiar el widget al destruir el componente
    if (this.widgetId !== null && typeof grecaptcha !== 'undefined') {
      try {
        grecaptcha.reset(this.widgetId);
      } catch (e) {
        // Ignorar errores al limpiar
      }
    }
  }
}
