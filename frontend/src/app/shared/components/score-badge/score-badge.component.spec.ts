import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScoreBadgeComponent } from './score-badge.component';

describe('ScoreBadgeComponent', () => {
  let component: ScoreBadgeComponent;
  let fixture: ComponentFixture<ScoreBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoreBadgeComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(ScoreBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('score', 50);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show green for score >= 80', () => {
    fixture.componentRef.setInput('score', 85);
    fixture.detectChanges();
    expect(component.colorClass()).toBe('bg-green-500');
  });

  it('should show yellow for score >= 60', () => {
    fixture.componentRef.setInput('score', 65);
    fixture.detectChanges();
    expect(component.colorClass()).toBe('bg-yellow-500');
  });

  it('should show orange for score >= 40', () => {
    fixture.componentRef.setInput('score', 45);
    fixture.detectChanges();
    expect(component.colorClass()).toBe('bg-orange-500');
  });

  it('should show red for score < 40', () => {
    fixture.componentRef.setInput('score', 20);
    fixture.detectChanges();
    expect(component.colorClass()).toBe('bg-red-500');
  });

  it('should show green at exact boundary of 80', () => {
    fixture.componentRef.setInput('score', 80);
    fixture.detectChanges();
    expect(component.colorClass()).toBe('bg-green-500');
  });

  it('should show red for score 0', () => {
    fixture.componentRef.setInput('score', 0);
    fixture.detectChanges();
    expect(component.colorClass()).toBe('bg-red-500');
  });

  it('should show green for score 100', () => {
    fixture.componentRef.setInput('score', 100);
    fixture.detectChanges();
    expect(component.colorClass()).toBe('bg-green-500');
  });

  it('should display percentage in template', () => {
    fixture.componentRef.setInput('score', 75);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent?.trim()).toBe('75%');
  });
});
