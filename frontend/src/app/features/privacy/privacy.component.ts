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
        <p class="text-sm text-text-muted">Última atualização: 2 de Junho de 2026 | Em total conformidade com a LGPD</p>
      </div>

      <!-- Content Box -->
      <div class="organic-card p-6 md:p-8 space-y-8 text-sm text-text-secondary leading-relaxed">
        
        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">1. Finalidade do Tratamento de Dados (LGPD Art. 7)</h2>
          <p>
            O tratamento de dados pessoais no <strong>JobHunter</strong> é amparado pelas bases legais de <strong>Execução de Contrato</strong> (preparação de candidatura a pedido do titular) e <strong>Legítimo Interesse</strong>.
          </p>
          
          <!-- Data collection table -->
          <div class="overflow-x-auto my-4 rounded-xl border border-white/10 overflow-hidden">
            <table class="w-full text-left border-collapse bg-white/5 text-xs">
              <thead>
                <tr class="bg-white/10 text-white font-semibold">
                  <th class="px-4 py-3">Dado Coletado</th>
                  <th class="px-4 py-3">Finalidade Específica</th>
                  <th class="px-4 py-3">Base Legal (LGPD)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr>
                  <td class="px-4 py-3 font-semibold text-white">Nome, E-mail, Telefone</td>
                  <td class="px-4 py-3">Preenchimento automático do formulário de candidatura.</td>
                  <td class="px-4 py-3">Execução de Contrato</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 font-semibold text-white">Currículo PDF</td>
                  <td class="px-4 py-3">Envio anexado nas candidaturas robóticas externas.</td>
                  <td class="px-4 py-3">Execução de Contrato</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 font-semibold text-white">Palavras-chave e Preferências</td>
                  <td class="px-4 py-3">Cálculo e refinamento do Score de compatibilidade.</td>
                  <td class="px-4 py-3">Legítimo Interesse</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 font-semibold text-white">Evidência (Screenshot)</td>
                  <td class="px-4 py-3">Comprovação visual de sucesso de candidatura robótica.</td>
                  <td class="px-4 py-3">Legítimo Interesse</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">2. Caching e Processamento de Arquivos PDF</h2>
          <p>
            <strong>Como funciona o Caching de Currículo:</strong> Ao enviar seu currículo em PDF pela interface de perfil, o backend realiza uma validação binária de segurança (Magic Bytes <code>%PDF</code>) e extrai o texto textual completo uma única vez, salvando o cache diretamente no campo <code>cv_extracted_text</code> no banco de dados.
          </p>
          <p>
            Essa arquitetura impede que o disco rígido seja acessado repetidamente a cada requisição de análise de compatibilidade semântica, proporcionando maior performance, privacidade e impedindo vazamento de dados de arquivos em cache temporário de sistema.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">3. Retenção e Descarte de Dados</h2>
          <p>
            Nós retemos seus dados apenas pelo período necessário para cumprir as finalidades descritas nesta política.
          </p>
          
          <!-- Retention table -->
          <div class="overflow-x-auto my-4 rounded-xl border border-white/10 overflow-hidden">
            <table class="w-full text-left border-collapse bg-white/5 text-xs">
              <thead>
                <tr class="bg-white/10 text-white font-semibold">
                  <th class="px-4 py-3">Tipo de Dado</th>
                  <th class="px-4 py-3">Prazo de Retenção</th>
                  <th class="px-4 py-3">Regra de Descarte</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr>
                  <td class="px-4 py-3 font-semibold text-white">Vagas Varridas (Histórico)</td>
                  <td class="px-4 py-3">Até 30 dias (dinâmico)</td>
                  <td class="px-4 py-3">Removidas e arquivadas automaticamente pelo serviço de Auto-Delete.</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 font-semibold text-white">Candidaturas Arquivadas</td>
                  <td class="px-4 py-3">Até 30 dias após arquivamento</td>
                  <td class="px-4 py-3">Deleção definitiva automatizada via serviço de Auto-Delete diário.</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 font-semibold text-white">Currículo PDF e Cadastro</td>
                  <td class="px-4 py-3">Vitalício sob uso ativo</td>
                  <td class="px-4 py-3">Exclusão manual definitiva pelo usuário através da tela de Perfil.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">4. Exercício de Direitos do Titular (LGPD)</h2>
          <p>
            Garantimos a você o pleno exercício dos seus direitos assegurados pelo Artigo 18 da LGPD, os quais podem ser realizados de forma autônoma pela interface do JobHunter:
          </p>
          <ul class="list-disc list-inside space-y-1.5 ml-2">
            <li><strong>Confirmação e Acesso</strong>: Visualização de todos os logs cadastrados e informações de perfil na interface gráfica.</li>
            <li><strong>Correção de Dados</strong>: Edição instantânea de nome, e-mail, telefone e currículo pela aba de Perfil.</li>
            <li><strong>Portabilidade e Eliminação</strong>: Botão de exclusão para remoção imediata e definitiva de logs, dados e arquivo de currículo do banco e disco.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">5. Segurança da Informação</h2>
          <p>
            O JobHunter adota controles rígidos de segurança da informação:
          </p>
          <ul class="list-disc list-inside space-y-1.5 ml-2">
            <li>Validação rigorosa de uploads para barrar a inserção de vírus no diretório local.</li>
            <li>Navegadores Playwright encapsulados para simular navegação padrão de forma isolada.</li>
            <li>Conexão de APIs externas protegidas.</li>
          </ul>
        </section>

        <div class="pt-6 border-t border-white/10 text-center">
          <p class="text-xs text-text-muted">A segurança e privacidade das suas informações pessoais e profissionais são nossa maior premissa de desenvolvimento.</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PrivacyComponent {}
