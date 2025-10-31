import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent {
  constructor(private router: Router) {}

  // Método de navegación que usan los botones
  navigateTo(route: string): void {
    this.router.navigate([`/${route}`]);
  }
}
