import { Component, input, output, signal, computed, inject, HostListener, ElementRef } from '@angular/core';
import { ChevronDownIconComponent } from '../chevron-down-icon/chevron-down-icon.component';
import { CheckIconComponent } from '../check-icon/check-icon.component';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [ChevronDownIconComponent, CheckIconComponent],
  host: {
    '(click)': 'toggleDropdown($event)',
  },
  template: `
    <div class="relative">
      <!-- Trigger -->
      <button
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left"
        [class]="isOpen() ? 'bg-dark-bg border-primary/40 text-white' : 'bg-dark-surface border-dark-border text-text-main hover:border-primary/20 hover:bg-dark-bg'"
        style="border: 1px solid;"
      >
        @if (selectedLabel()) {
          <span class="truncate flex-1">{{ selectedLabel() }}</span>
        } @else {
          <span class="truncate flex-1 text-text-muted">{{ placeholder() }}</span>
        }
        <app-chevron-down-icon [size]="16" [strokeWidth]="2" class="shrink-0 transition-transform duration-200" [class.rotate-180]="isOpen()"/>
      </button>

      <!-- Dropdown -->
      @if (isOpen()) {
        <div
          class="absolute top-full left-0 right-0 mt-2 py-1.5 max-h-60 overflow-auto z-50"
          style="background: rgba(17, 24, 39, 0.95);
                 backdrop-filter: blur(20px) saturate(1.8);
                 -webkit-backdrop-filter: blur(20px) saturate(1.8);
                 border: 1px solid rgba(255,255,255,0.08);
                 border-radius: 14px;
                 box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);"
        >
          @for (option of options(); track option.value) {
            <button
              class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-all duration-150"
              [class]="option.value === selectedValue() ? 'bg-primary/15 text-primary' : 'text-text-main hover:bg-white/5'"
              (click)="selectOption(option, $event)"
            >
              @if (option.icon) {
                <span class="text-base opacity-80">{{ option.icon }}</span>
              }
              <span class="flex-1">{{ option.label }}</span>
              @if (option.value === selectedValue()) {
                <app-check-icon [size]="16" [strokeWidth]="2" class="text-primary"/>
              }
            </button>
          }
        </div>
      }
    </div>
  `
})
export class SelectComponent {
  private elementRef = inject(ElementRef);

  options = input<SelectOption[]>([]);
  selectedValue = input<string>('');
  placeholder = input<string>('Selecione...');
  valueChange = output<string>();

  isOpen = signal(false);

  selectedLabel = computed(() => {
    const opt = this.options().find(o => o.value === this.selectedValue());
    return opt?.label || '';
  });

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen.update(v => !v);
  }

  selectOption(option: SelectOption, event: Event): void {
    event.stopPropagation();
    this.valueChange.emit(option.value);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
