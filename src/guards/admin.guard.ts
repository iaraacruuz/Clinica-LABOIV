import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../app/services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.supabase.getCurrentUser();

    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    const { data } = await this.supabase.getProfile(user.id);

    if (!data || data.role !== 'admin') {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
