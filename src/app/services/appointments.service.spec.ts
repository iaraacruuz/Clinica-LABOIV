import { TestBed } from '@angular/core/testing';
import { AppointmentsService } from './appointments.service';
import { SupabaseService } from './supabase.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let supabaseMock: any;

  beforeEach(() => {
    supabaseMock = jasmine.createSpyObj('SupabaseService', [
      'createAppointment',
      'getSpecialistAppointments',
      'getPatientAppointments'
    ]);

    TestBed.configureTestingModule({
      providers: [AppointmentsService, { provide: SupabaseService, useValue: supabaseMock }]
    });

    service = TestBed.inject(AppointmentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createAppointment delegates to SupabaseService.createAppointment', async () => {
    supabaseMock.createAppointment.and.returnValue(Promise.resolve({ data: [{ id: '1' }] }));
    const data = { patient_id: 'p1', specialist_id: 's1' };
    const res: any = await service.createAppointment(data);
    expect(supabaseMock.createAppointment).toHaveBeenCalledWith(data);
    expect(res).toBeDefined();
  });

  it('isSlotAvailable detects overlap', async () => {
    const now = new Date();
    const iso = now.toISOString();
    // existing appointment that overlaps
    supabaseMock.getSpecialistAppointments.and.returnValue(Promise.resolve([
      { appointment_date: iso, duration: 60 }
    ]));

    const available = await service.isSlotAvailable('s1', iso, 30);
    expect(available).toBeFalse();
  });
});
