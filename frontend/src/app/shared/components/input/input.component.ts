import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  forwardRef,
} from '@angular/core';

import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="input-wrapper"
      [class.input-focused]="focused()"
      [class.input-disabled]="disabled()"
    >
      @if (icon()) {
        <span class="input-icon" [innerHTML]="sanitizedIcon()"></span>
      }
      <input
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [class]="inputClasses()"
        [value]="value()"
        (input)="onInput($event)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
      />
      @if (suffix()) {
        <span class="input-suffix">{{ suffix() }}</span>
      }
    </div>
  `,
  styles: [
    `
      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
      }

      input {
        width: 100%;
        padding: 0.625rem 0.875rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
        border-radius: 0.75rem;
        border: 1px solid var(--input-border);
        background: var(--input-bg);
        color: var(--text-primary);
        transition: all 0.2s ease;
        outline: none;
      }

      input::placeholder {
        color: var(--text-muted);
      }

      input:focus {
        border-color: rgba(37, 99, 235, 0.5);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .input-icon {
        position: absolute;
        left: 0.75rem;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        pointer-events: none;
      }

      .input-wrapper:has(.input-icon) input {
        padding-left: 2.5rem;
      }

      .input-suffix {
        position: absolute;
        right: 0.75rem;
        color: var(--text-muted);
        font-size: 0.75rem;
        pointer-events: none;
      }

      .input-wrapper:has(.input-suffix) input {
        padding-right: 2.5rem;
      }
    `,
  ],
})
export class InputComponent implements ControlValueAccessor {
  private sanitizer = inject(DomSanitizer);

  type = input<string>('text');
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  icon = input<string>('');
  suffix = input<string>('');
  valueChange = output<string>();

  value = signal('');
  focused = signal(false);

  sanitizedIcon = computed<SafeHtml>(() => {
    return this.sanitizer.bypassSecurityTrustHtml(this.icon());
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  inputClasses(): string {
    return 'w-full';
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
    this.valueChange.emit(target.value);
  }

  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled by input signal
  }
}
