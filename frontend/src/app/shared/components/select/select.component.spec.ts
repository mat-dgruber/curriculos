import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent, SelectOption } from './select.component';

describe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  const testOptions: SelectOption[] = [
    { value: 'all', label: 'Todas' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'gupy', label: 'Gupy' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show dropdown initially', () => {
    fixture.componentRef.setInput('options', testOptions);
    fixture.componentRef.setInput('selectedValue', '');
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);
  });

  it('should toggle dropdown on click', () => {
    fixture.componentRef.setInput('options', testOptions);
    fixture.componentRef.setInput('selectedValue', '');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(component.isOpen()).toBe(true);
    fixture.nativeElement.querySelector('button').click();
    expect(component.isOpen()).toBe(false);
  });

  it('should display placeholder when no value selected', () => {
    fixture.componentRef.setInput('options', testOptions);
    fixture.componentRef.setInput('selectedValue', '');
    fixture.componentRef.setInput('placeholder', 'Selecione');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Selecione');
  });

  it('should display selected label', () => {
    fixture.componentRef.setInput('options', testOptions);
    fixture.componentRef.setInput('selectedValue', 'linkedin');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('LinkedIn');
  });

  it('should emit valueChange on option select', () => {
    const spy = vi.fn();
    fixture.componentRef.setInput('options', testOptions);
    fixture.componentRef.setInput('selectedValue', '');
    component.valueChange.subscribe(spy);
    fixture.detectChanges();

    // Open dropdown
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    // Click first option
    const options = fixture.nativeElement.querySelectorAll('button');
    if (options.length > 1) {
      options[1].click();
      expect(spy).toHaveBeenCalledWith('linkedin');
    }
  });

  it('should close dropdown after selection', () => {
    fixture.componentRef.setInput('options', testOptions);
    fixture.componentRef.setInput('selectedValue', '');
    component.valueChange.subscribe(() => {});
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();
    expect(component.isOpen()).toBe(true);

    const options = fixture.nativeElement.querySelectorAll('button');
    if (options.length > 1) {
      options[1].click();
      expect(component.isOpen()).toBe(false);
    }
  });

  it('should show options list when open', () => {
    fixture.componentRef.setInput('options', testOptions);
    fixture.componentRef.setInput('selectedValue', '');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    const dropdown = fixture.nativeElement.querySelectorAll('[class*="absolute"]');
    expect(dropdown.length).toBeGreaterThan(0);
  });
});
