import { TestBed } from '@angular/core/testing';
import { MedicalHistoryService } from './medical-history.service';
import { SupabaseService } from './supabase.service';

describe('MedicalHistoryService', () => {
  let service: MedicalHistoryService;
  let supabaseMock: any;

  beforeEach(() => {
    supabaseMock = jasmine.createSpyObj('SupabaseService', [
      'createMedicalHistory',
      'getMedicalHistory',
      'getMedicalHistoryByPatient',
      'createMedicalHistoryField',
      'getMedicalHistoryFields',
      'deleteMedicalHistoryField'
    ]);

    TestBed.configureTestingModule({
      providers: [MedicalHistoryService, { provide: SupabaseService, useValue: supabaseMock }]
    });

    service = TestBed.inject(MedicalHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createMedicalHistory delegates to supabase', async () => {
    const payload = { appointment_id: 'a1', patient_id: 'p1' };
    supabaseMock.createMedicalHistory.and.returnValue(Promise.resolve({ data: [{ id: 'm1' }] }));
    const res: any = await service.createMedicalHistory(payload);
    expect(supabaseMock.createMedicalHistory).toHaveBeenCalledWith(payload);
    expect(res).toBeDefined();
  });

  it('createField delegates to supabase.createMedicalHistoryField', async () => {
    const field = { medical_history_id: 'm1', key: 'peso', value: '70' };
    supabaseMock.createMedicalHistoryField.and.returnValue(Promise.resolve({ data: [{ id: 'f1' }] }));
    const res: any = await service.createField(field);
    expect(supabaseMock.createMedicalHistoryField).toHaveBeenCalledWith(field);
    expect(res).toBeDefined();
  });
});
