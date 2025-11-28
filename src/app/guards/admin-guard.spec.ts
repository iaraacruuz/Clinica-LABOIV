import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminGuard } from './admin-guard';
import { AuthService } from '../services/auth';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    // Mocks de servicios
    authServiceMock = {
      currentUser: jasmine.createSpy('currentUser'),
      getUserData: jasmine.createSpy('getUserData'),
      waitAuthReady: jasmine.createSpy('waitAuthReady').and.returnValue(Promise.resolve())
    };

    routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(AdminGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should deny access if no user', async () => {
    authServiceMock.currentUser.and.returnValue(null);

    const result = await guard.canActivate();
    expect(result).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should deny access if user is not admin', async () => {
    authServiceMock.currentUser.and.returnValue({ uid: '123' });
    authServiceMock.getUserData.and.returnValue(Promise.resolve({ role: 'patient' }));

    const result = await guard.canActivate();
    expect(result).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should allow access if user is admin', async () => {
    authServiceMock.currentUser.and.returnValue({ uid: '123' });
    authServiceMock.getUserData.and.returnValue(Promise.resolve({ role: 'admin' }));

    const result = await guard.canActivate();
    expect(result).toBeTrue();
  });
});
