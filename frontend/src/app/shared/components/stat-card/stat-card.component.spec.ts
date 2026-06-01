import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let component: StatCardComponent;
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('label', 'Test');
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('suffix', '');
    fixture.componentRef.setInput('icon', '');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display label', () => {
    fixture.componentRef.setInput('label', 'Vagas Encontradas');
    fixture.componentRef.setInput('value', 10);
    fixture.componentRef.setInput('suffix', '');
    fixture.componentRef.setInput('icon', '');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Vagas Encontradas');
  });

  it('should display value', () => {
    fixture.componentRef.setInput('label', 'Test');
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('suffix', '');
    fixture.componentRef.setInput('icon', '');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('42');
  });

  it('should display suffix when provided', () => {
    fixture.componentRef.setInput('label', 'Test');
    fixture.componentRef.setInput('value', 85);
    fixture.componentRef.setInput('suffix', '%');
    fixture.componentRef.setInput('icon', '');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('%');
  });

  it('should not display suffix when empty', () => {
    fixture.componentRef.setInput('label', 'Test');
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('suffix', '');
    fixture.componentRef.setInput('icon', '');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('%');
  });
});
