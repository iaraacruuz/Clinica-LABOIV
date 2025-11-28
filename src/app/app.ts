import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/loader/loader';
import { MessageToastComponent } from './shared/message-toast/message-toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoaderComponent, MessageToastComponent],
  template: `
    <app-loader></app-loader>
    <app-message-toast></app-message-toast>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {}
