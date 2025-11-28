import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {

    const { data: { user } } = await this.supabase.client.auth.getUser();

    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}
