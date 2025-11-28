import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AprobarEspecialistas } from './aprobar-especialistas';

describe('AprobarEspecialistas', () => {
  let component: AprobarEspecialistas;
  let fixture: ComponentFixture<AprobarEspecialistas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AprobarEspecialistas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AprobarEspecialistas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
