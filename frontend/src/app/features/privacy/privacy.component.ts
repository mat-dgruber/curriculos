import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
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
        <h1 class="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Política de Privacidade</h1>
        <p class="text-sm text-text-muted">Última atualização: 2 de Junho de 2026</p>
      </div>

      <!-- Content Box -->
      <div class="organic-card p-6 md:p-8 space-y-6 text-sm text-text-secondary leading-relaxed">
        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">1. Coleta de Informações</h2>
          <p>
            Para possibilitar a automação de candidaturas, o <strong>JobHunter</strong> coleta e armazena os seguintes dados fornecidos voluntariamente por você:
          </p>
          <ul class="list-disc list-inside space-y-1.5 ml-2">
            <li>Dados pessoais básicos: Nome completo, endereço de e-mail, telefone e localização.</li>
            <li>Preferências profissionais: Cargos pretendidos, localizações de interesse e palavras-chave.</li>
            <li>Documentação: O arquivo do seu currículo profissional em formato PDF.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">2. Uso dos Dados</h2>
          <p>Seus dados são utilizados exclusivamente para:</p>
          <ul class="list-disc list-inside space-y-1.5 ml-2">
            <li>Identificar e calcular a compatibilidade do seu perfil profissional com vagas de emprego varridas.</li>
            <li>Preencher de forma automatizada os formulários de candidatura em sites terceiros via robôs quando a opção auto-apply estiver habilitada.</li>
            <li>Notificar você por e-mail sobre novas oportunidades compatíveis ou confirmações de envio de candidatura.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">3. Compartilhamento com Terceiros</h2>
          <p>
            O JobHunter <strong>não comercializa</strong> seus dados pessoais com anunciantes ou terceiros. O envio de seus dados e do seu currículo em PDF é feito unicamente para os portais de contratação de empresas às quais você optou ativamente por se candidatar.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">4. Armazenamento e Segurança</h2>
          <p>
            Os dados de perfil e logs de candidatura são armazenados localmente e de forma segura. Implementamos auditorias de validação estritas sobre arquivos enviados (checagem binária de Magic Bytes de PDFs) para mitigar riscos de segurança e invasão de sistema.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">5. Seus Direitos (LGPD)</h2>
          <p>
            Você tem total direito a acessar, editar, exportar ou solicitar a exclusão definitiva de todos os dados do seu perfil, histórico de candidaturas e arquivo de currículo a qualquer momento diretamente pela interface de configurações da plataforma.
          </p>
        </section>

        <div class="pt-6 border-t border-white/10 text-center">
          <p class="text-xs text-text-muted">A privacidade dos seus dados é nossa prioridade máxima no JobHunter.</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PrivacyComponent {}
