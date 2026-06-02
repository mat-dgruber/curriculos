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
        class="select-trigger flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left"
        [class.select-trigger-open]="isOpen()"
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
        <div class="select-dropdown absolute top-full left-0 right-0 mt-2 py-1.5 max-h-60 overflow-auto z-50">
          @for (option of options(); track option.value) {
            <button
              class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-all duration-150 select-option"
              [class.select-option-active]="option.value === selectedValue()"
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
  `,
  styles: [`
    .select-trigger {
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      color: var(--text-primary);
    }
    .select-trigger:hover {
      border-color: rgba(var(--primary-color-rgb), 0.3);
    }
    .select-trigger-open {
      border-color: rgba(var(--primary-color-rgb), 0.5);
    }

    .select-dropdown {
      background: color-mix(in srgb, var(--bg-surface) 90%, transparent);
      border: 1px solid var(--glass-border);
      backdrop-filter: blur(20px) saturate(1.4);
      -webkit-backdrop-filter: blur(20px) saturate(1.4);
      border-radius: 14px;
      box-shadow: var(--glass-shadow);
    }

    .select-option {
      color: var(--text-primary);
    }
    .select-option:hover {
      background: var(--bg-hover);
    }
    .select-option-active {
      background: rgba(var(--primary-color-rgb), 0.1);
      color: var(--primary-color);
    }
  `]
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
