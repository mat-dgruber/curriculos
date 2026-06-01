import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('message', 'Nenhum item');
    fixture.componentRef.setInput('icon', 'inbox');
    fixture.componentRef.setInput('actionLabel', '');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display message', () => {
    fixture.componentRef.setInput('message', 'Nenhuma vaga encontrada');
    fixture.componentRef.setInput('icon', 'inbox');
    fixture.componentRef.setInput('actionLabel', '');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Nenhuma vaga encontrada');
  });

  it('should show action button when actionLabel is provided', () => {
    fixture.componentRef.setInput('message', 'Test');
    fixture.componentRef.setInput('icon', 'inbox');
    fixture.componentRef.setInput('actionLabel', 'Buscar vagas');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button');
    expect(button).toBeTruthy();
    expect(button?.textContent?.trim()).toBe('Buscar vagas');
  });

  it('should not show action button when actionLabel is empty', () => {
    fixture.componentRef.setInput('message', 'Test');
    fixture.componentRef.setInput('icon', 'inbox');
    fixture.componentRef.setInput('actionLabel', '');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button');
    expect(button).toBeFalsy();
  });

  it('should emit action event when button is clicked', () => {
    fixture.componentRef.setInput('message', 'Test');
    fixture.componentRef.setInput('icon', 'inbox');
    fixture.componentRef.setInput('actionLabel', 'Buscar');
    fixture.detectChanges();

    let emitted = false;
    component.action.subscribe(() => { emitted = true; });

    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button')!;
    button.click();
    expect(emitted).toBe(true);
  });
});
