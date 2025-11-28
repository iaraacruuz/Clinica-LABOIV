import { TestBed } from '@angular/core/testing';
import { UsuariosAdminComponent } from './usuarios-admin';

describe('UsuariosAdminComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosAdminComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(UsuariosAdminComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
