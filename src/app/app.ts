import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  isMenuOpen = false;

  constructor(private router: Router) {}

  // Navegación real usando Router
  navigateTo(page: string): void {
    this.isMenuOpen = false;
    this.router.navigate([`/${page}`]);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
