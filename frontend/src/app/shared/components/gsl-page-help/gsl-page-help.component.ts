import {
  Component,
  Input,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-gsl-page-help',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Toggle Help Button -->
    <button
      type="button"
      (click)="openDrawer()"
      class="inline-flex items-center justify-center p-2 text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10 rounded-full transition-all focus:outline-none border border-amber-500/20 bg-amber-500/5 shadow-md active:scale-95 cursor-pointer"
      title="Ajuda e Documentação"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    </button>

    <!-- Drawer Template rendered conditionally -->
    @if (isOpen()) {
      <!-- Backdrop Overlay -->
      <div
        id="gsl-help-backdrop"
        class="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] animate-fade-in"
        (click)="closeDrawer()"
      ></div>

      <!-- Slide-over Drawer -->
      <div
        id="gsl-help-drawer"
        class="fixed inset-y-0 right-0 z-[9999] w-full max-w-2xl bg-[var(--bg-surface)] border-l border-[var(--bg-border)] shadow-2xl flex flex-col animate-slide-in"
        (click)="$event.stopPropagation()"
      >
        <!-- Drawer Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-[var(--bg-border)] bg-[var(--bg-surface)]"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h2 class="text-xl font-serif font-bold text-[var(--text-primary)]">{{ title }}</h2>
          </div>

          <button
            type="button"
            (click)="closeDrawer()"
            class="flex px-4 py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--bg-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-semibold rounded-lg transition-all active:scale-95 items-center gap-1.5 border border-[var(--bg-border)] cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Fechar
          </button>
        </div>

        <!-- Markdown Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto w-full relative bg-[var(--bg-main)] custom-scrollbar">
          <div class="px-8 py-6 pb-24 min-h-full">
            <!-- Loading State -->
            @if (loading()) {
              <div
                class="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]"
              >
                <svg
                  class="animate-spin h-8 w-8 text-amber-500 mb-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Carregando manual de instruções...</span>
              </div>
            }

            <!-- Error Handling -->
            @if (hasError()) {
              <div
                class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center mt-8"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-amber-500 mb-3"
                >
                  <path
                    d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
                  />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h3 class="text-lg font-bold text-amber-200 mb-2">Manual indisponível</h3>
                <p class="text-amber-300/80 text-sm max-w-md">
                  Não foi possível carregar a documentação (<code>{{ document }}</code
                  >). Verifique se o arquivo Markdown correspondente foi criado na pasta pública de
                  manuais.
                </p>
              </div>
            }

            <!-- Native Rendered Markdown HTML -->
            @if (!loading() && !hasError() && safeHtmlContent()) {
              <div
                [innerHTML]="safeHtmlContent()"
                class="prose prose-invert max-w-none text-[var(--text-primary)] leading-relaxed space-y-4"
              ></div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      .animate-fade-in {
        animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .animate-slide-in {
        animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `,
  ],
})
export class GslPageHelp implements OnDestroy {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  @Input() document!: string; // e.g. 'vagas.md'
  @Input() title: string = 'Ajuda e Documentação';

  isOpen = signal(false);
  loading = signal(false);
  hasError = signal(false);
  rawMarkdown = signal<string>('');

  // Computes the absolute path to fetch from the public folder
  documentUrl = computed(() => {
    return `/docs/manuais-usuario/${this.document}`;
  });

  // Translates raw markdown to sanitized SafeHtml natively
  safeHtmlContent = computed<SafeHtml | null>(() => {
    const md = this.rawMarkdown();
    if (!md) return null;
    const parsedHtml = this.parseMarkdown(md);
    return this.sanitizer.bypassSecurityTrustHtml(parsedHtml);
  });

  openDrawer() {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden'; // Prevents background scroll
    this.loadManual();

    // Escapes CSS Transform container limits (like animate-fade-in-up parent rules)
    // by appending backdrop and drawer directly to document.body on open!
    setTimeout(() => {
      const backdrop = document.getElementById('gsl-help-backdrop');
      const drawer = document.getElementById('gsl-help-drawer');
      if (backdrop) document.body.appendChild(backdrop);
      if (drawer) document.body.appendChild(drawer);
    }, 0);
  }

  closeDrawer() {
    this.isOpen.set(false);
    document.body.style.overflow = '';

    // Safely removes from body DOM when closing
    const backdrop = document.getElementById('gsl-help-backdrop');
    const drawer = document.getElementById('gsl-help-drawer');
    if (backdrop) backdrop.remove();
    if (drawer) drawer.remove();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    const backdrop = document.getElementById('gsl-help-backdrop');
    const drawer = document.getElementById('gsl-help-drawer');
    if (backdrop) backdrop.remove();
    if (drawer) drawer.remove();
  }

  private loadManual() {
    if (this.rawMarkdown()) return; // Already cached

    this.loading.set(true);
    this.hasError.set(false);

    this.http
      .get(this.documentUrl(), { responseType: 'text' })
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar o arquivo markdown:', error);
          this.hasError.set(true);
          this.loading.set(false);
          return of('');
        }),
      )
      .subscribe((content) => {
        if (content) {
          this.rawMarkdown.set(content);
          this.hasError.set(false);
        }
        this.loading.set(false);
      });
  }

  private parseMarkdown(md: string): string {
    if (!md) return '';
    let html = md;

    // Escaping standard HTML tags to avoid raw injection (preserving alert/styled tags we make ourselves)
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Restore markdown angle brackets for quotes/alerts
    html = html.replace(/^&gt;\s?/gm, '> ');

    // Titles
    html = html.replace(
      /^# (.*?)$/gm,
      '<h1 class="text-2xl font-bold font-serif text-[var(--text-primary)] border-b border-[var(--bg-border)] pb-2 mb-4 mt-6">$1</h1>',
    );
    html = html.replace(
      /^## (.*?)$/gm,
      '<h2 class="text-xl font-semibold font-serif text-[var(--primary-color)] border-b border-[var(--bg-border)]/50 pb-1 mb-3 mt-5 flex items-center gap-2">$1</h2>',
    );
    html = html.replace(
      /^### (.*?)$/gm,
      '<h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2 mt-4">$1</h3>',
    );
    html = html.replace(
      /^#### (.*?)$/gm,
      '<h4 class="text-base font-semibold text-[var(--text-primary)] mb-1.5 mt-3">$1</h4>',
    );

    // Bold & Italic
    html = html.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold text-[var(--text-primary)]">$1</strong>',
    );
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-[var(--text-secondary)]">$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em class="italic text-[var(--text-secondary)]">$1</em>');

    // Blockquotes & Alerts
    // Support modern alert blocks like > [!NOTE], > [!WARNING], > [!TIP]
    html = html.replace(
      /^>\s+\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n([\s\S]*?)(?=\n\n|\n[^\s>])/gm,
      (match, type, content) => {
        let borderClass = 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-300';
        let title = 'Nota';
        if (type === 'TIP') {
          borderClass =
            'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-300';
          title = 'Dica';
        } else if (type === 'WARNING' || type === 'CAUTION') {
          borderClass = 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-300';
          title = 'Atenção';
        } else if (type === 'IMPORTANT') {
          borderClass = 'border-purple-500 bg-purple-500/5 text-purple-600 dark:text-purple-300';
          title = 'Importante';
        }
        return `<div class="border-l-4 ${borderClass} p-4 my-4 rounded-r-lg"><div class="font-bold text-xs uppercase tracking-wider mb-1.5">${title}</div><div class="text-[var(--text-primary)] text-sm leading-relaxed">${content.replace(/^>\s?/gm, '').trim()}</div></div>`;
      },
    );

    // General blockquotes
    html = html.replace(
      /^>\s+(.*?)$/gm,
      '<blockquote class="border-l-4 border-[var(--bg-border)] bg-[var(--bg-hover)] py-2.5 px-5 my-3 rounded-r-lg text-[var(--text-secondary)] italic">$1</blockquote>',
    );

    // Code blocks & Inline codes
    html = html.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-black/5 dark:bg-black/30 border border-[var(--bg-border)] rounded-xl p-4 my-4 overflow-x-auto text-xs text-amber-700 dark:text-amber-400 font-mono">$1</pre>',
    );
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-amber-500/5 dark:bg-white/5 border border-amber-500/10 dark:border-white/10 rounded px-1.5 py-0.5 text-xs text-amber-600 dark:text-amber-300 font-mono font-semibold">$1</code>',
    );

    // Lists
    html = html.replace(
      /^\s*[-*]\s+(.*?)$/gm,
      '<li class="list-disc list-inside ml-4 mb-1 text-sm text-[var(--text-secondary)]">$1</li>',
    );

    // Tables
    html = html.replace(/^\|(.*?)\|$/gm, (match, content) => {
      const cells = content.split('|').map((c: string) => c.trim());
      // Skip spacer row |-|-|-|
      if (cells.every((c: string) => c.startsWith('-') || c === '')) return '';

      const isHeader = html.indexOf(match) < 300 && cells.every((c: string) => c.length > 0); // Basic heuristic for headers
      const cellTag = isHeader ? 'th' : 'td';
      const cellClass = isHeader
        ? 'px-4 py-2 font-serif font-bold text-[var(--text-primary)] border-b-2 border-[var(--bg-border)]'
        : 'px-4 py-2 border-b border-[var(--bg-border)]/40';
      return `<tr class="hover:bg-[var(--bg-hover)] transition-colors">${cells.map((c: string) => `<${cellTag} class="${cellClass}">${c}</${cellTag}>`).join('')}</tr>`;
    });
    // Wrap table rows in full HTML table tag
    html = html.replace(
      /((?:<tr class="hover:bg-\[var\(--bg-hover\)\] transition-colors">[\s\S]*?<\/tr>\n?)+)/g,
      '<div class="overflow-x-auto my-4"><table class="w-full text-left border-collapse border border-[var(--bg-border)] bg-[var(--bg-surface)] rounded-xl">$1</table></div>',
    );

    // Paragraphs: Wrap lines that are not part of block HTML structures
    html = html.replace(
      /^(?!\s*<(?:div|h1|h2|h3|li|tr|pre|blockquote|table))([^\n]+)$/gm,
      '<p class="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">$1</p>',
    );

    return html;
  }
}
