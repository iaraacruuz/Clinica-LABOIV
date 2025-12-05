import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../app/services/supabase.service';
import { AuthService } from '../app/services/auth';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private authService: AuthService
  ) {}

  async canActivate(): Promise<boolean> {
    // Esperar a que el AuthService termine de verificar la sesión
    await this.authService.waitAuthReady();
    
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }

    const userData = await this.authService.getUserData(currentUser.uid);

    if (!userData || userData.role !== 'admin') {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
