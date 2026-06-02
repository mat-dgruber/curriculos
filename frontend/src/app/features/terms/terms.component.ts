import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <!-- Back button -->
      <a routerLink="/dashboard" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors mb-6 glass-v2 rounded-full px-4 py-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Voltar para o Dashboard
      </a>

      <!-- Title Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Termos de Uso</h1>
        <p class="text-sm text-text-muted">Última atualização: 2 de Junho de 2026</p>
      </div>

      <!-- Content Box -->
      <div class="organic-card p-6 md:p-8 space-y-6 text-sm text-text-secondary leading-relaxed">
        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar a plataforma <strong>JobHunter</strong>, você concorda em cumprir e estar legalmente vinculado a estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve acessar ou utilizar nossos serviços de automação.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">2. Descrição do Serviço</h2>
          <p>
            O <strong>JobHunter</strong> é uma ferramenta que realiza a agregação, varredura inteligente de vagas públicas e automatiza o preenchimento e envio de currículos em portais de emprego de terceiros por meio de robôs (automação via Playwright).
          </p>
          <p class="text-text-muted">
            Nota: O JobHunter não é afiliado, associado ou endossado por nenhuma das plataformas de recrutamento varridas (como Gupy, LinkedIn ou Vagas.com).
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">3. Responsabilidades do Usuário</h2>
          <p>Você é inteiramente responsável por:</p>
          <ul class="list-disc list-inside space-y-1.5 ml-2">
            <li>Garantir a veracidade e precisão de todas as informações profissionais e pessoais preenchidas em seu perfil.</li>
            <li>Fornecer um currículo em formato PDF legítimo e livre de vírus ou códigos maliciosos.</li>
            <li>Utilizar a plataforma em conformidade com as leis aplicáveis, regulamentos e diretrizes éticas.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">4. Limitação de Responsabilidade</h2>
          <p>
            O <strong>JobHunter</strong> busca automatizar com máxima eficiência as candidaturas. No entanto, não garantimos que os envios de currículo serão aceitos com sucesso por sistemas externos de recrutamento, especialmente aqueles protegidos por Captchas avançados, ou que o usuário obterá entrevistas de emprego.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">5. Modificações nos Termos</h2>
          <p>
            Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Quaisquer alterações entrarão em vigor imediatamente após a publicação da versão atualizada nesta página. O uso continuado da plataforma implica a aceitação tácita dos novos termos.
          </p>
        </section>

        <div class="pt-6 border-t border-white/10 text-center">
          <p class="text-xs text-text-muted">Dúvidas sobre estes Termos? Entre em contato com o suporte do JobHunter.</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TermsComponent {}
