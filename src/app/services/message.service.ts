import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private currentMessage: { text: string; type: 'success' | 'error' | 'warning' | 'info'; visible: boolean } = {
    text: '',
    type: 'info',
    visible: false
  };

  constructor() {}

  showSuccess(message: string) {
    this.showMessage(message, 'success');
  }

  showError(message: string) {
    this.showMessage(message, 'error');
  }

  showWarning(message: string) {
    this.showMessage(message, 'warning');
  }

  showInfo(message: string) {
    this.showMessage(message, 'info');
  }

  private showMessage(text: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.currentMessage = { text, type, visible: true };
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideMessage();
    }, 5000);
  }

  hideMessage() {
    this.currentMessage.visible = false;
  }

  getCurrentMessage() {
    return this.currentMessage;
  }

  isVisible() {
    return this.currentMessage.visible;
  }
}