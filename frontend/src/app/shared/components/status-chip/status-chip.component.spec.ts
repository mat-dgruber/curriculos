import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusChipComponent } from './status-chip.component';

describe('StatusChipComponent', () => {
  let component: StatusChipComponent;
  let fixture: ComponentFixture<StatusChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusChipComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(StatusChipComponent);
    component = fixture.componentInstance;
  });

  function setStatus(status: string) {
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
  }

  it('should create', () => {
    setStatus('Nova');
    expect(component).toBeTruthy();
  });

  it('should return blue for Nova', () => {
    setStatus('Nova');
    expect(component.colorClass()).toBe('bg-blue-500');
  });

  it('should return green for Enviado', () => {
    setStatus('Enviado');
    expect(component.colorClass()).toBe('bg-green-500');
  });

  it('should return red for Falhou', () => {
    setStatus('Falhou');
    expect(component.colorClass()).toBe('bg-red-500');
  });

  it('should return yellow for Pendente', () => {
    setStatus('Pendente');
    expect(component.colorClass()).toBe('bg-yellow-500');
  });

  it('should return gray for Arquivado', () => {
    setStatus('Arquivado');
    expect(component.colorClass()).toBe('bg-gray-500');
  });

  it('should return green for Ativo', () => {
    setStatus('Ativo');
    expect(component.colorClass()).toBe('bg-green-500');
  });

  it('should return yellow for Pausado', () => {
    setStatus('Pausado');
    expect(component.colorClass()).toBe('bg-yellow-500');
  });

  it('should return purple for Respondeu', () => {
    setStatus('Respondeu');
    expect(component.colorClass()).toBe('bg-purple-500');
  });

  it('should return gray for unknown status', () => {
    setStatus('Desconhecido');
    expect(component.colorClass()).toBe('bg-gray-500');
  });

  it('should display status text', () => {
    setStatus('Enviado');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent?.trim()).toBe('Enviado');
  });
});
