import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-message-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="messageService.isVisible()" 
      class="message-toast"
      [ngClass]="'toast-' + messageService.getCurrentMessage().type"
    >
      <div class="toast-content">
        <span class="toast-icon">{{ getIcon() }}</span>
        <span class="toast-text">{{ messageService.getCurrentMessage().text }}</span>
        <button class="toast-close" (click)="closeMessage()">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .message-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      min-width: 320px;
      max-width: 500px;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
      font-family: 'Segoe UI', sans-serif;
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toast-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .toast-text {
      flex: 1;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
      flex-shrink: 0;
    }

    .toast-success {
      background: #d4edda;
      color: #155724;
      border-left: 4px solid #28a745;
    }

    .toast-success .toast-close:hover {
      background: rgba(21, 87, 36, 0.1);
    }

    .toast-error {
      background: #f8d7da;
      color: #721c24;
      border-left: 4px solid #dc3545;
    }

    .toast-error .toast-close:hover {
      background: rgba(114, 28, 36, 0.1);
    }

    .toast-warning {
      background: #fff3cd;
      color: #856404;
      border-left: 4px solid #ffc107;
    }

    .toast-warning .toast-close:hover {
      background: rgba(133, 100, 4, 0.1);
    }

    .toast-info {
      background: #d1ecf1;
      color: #0c5460;
      border-left: 4px solid #17a2b8;
    }

    .toast-info .toast-close:hover {
      background: rgba(12, 84, 96, 0.1);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .message-toast {
        top: 10px;
        right: 10px;
        left: 10px;
        min-width: auto;
        max-width: none;
      }
    }
  `]
})
export class MessageToastComponent implements OnInit {

  constructor(public messageService: MessageService) {}

  ngOnInit() {}

  getIcon(): string {
    const message = this.messageService.getCurrentMessage();
    switch (message.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  closeMessage() {
    this.messageService.hideMessage();
  }
}