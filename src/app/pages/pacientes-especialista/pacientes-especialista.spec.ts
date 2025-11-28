import { TestBed } from '@angular/core/testing';
import { PacientesEspecialistaComponent } from './pacientes-especialista';

describe('PacientesEspecialistaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacientesEspecialistaComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PacientesEspecialistaComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
