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
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">2. Processamento Seguro e Leitura do seu Currículo</h2>
          <p>
            <strong>Como o seu currículo é lido e guardado:</strong> Quando você envia o seu currículo em formato PDF no seu perfil, nossa plataforma realiza uma verificação automática para confirmar que o documento é legítimo, seguro e livre de vírus. Uma vez aprovado, o sistema lê as informações de texto do arquivo apenas uma única vez e as guarda de forma segura em uma memória de acesso rápido.
          </p>
          <p>
            Isso elimina a necessidade de ler o arquivo PDF do zero a cada nova vaga analisada. Essa tecnologia inteligente de leitura única economiza o processamento do seu dispositivo, acelera muito as suas candidaturas diárias e aumenta a sua privacidade, pois os dados não ficam expostos em pastas temporárias do sistema.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">3. Retenção e Descarte de Dados</h2>
          <p>
            Nós guardamos seus dados apenas pelo período necessário para que o assistente inteligente realize as candidaturas em seu nome.
          </p>
          
          <!-- Retention table -->
          <div class="overflow-x-auto my-4 rounded-xl border border-white/10 overflow-hidden">
            <table class="w-full text-left border-collapse bg-white/5 text-xs">
              <thead>
                <tr class="bg-white/10 text-white font-semibold">
                  <th class="px-4 py-3">Tipo de Informação</th>
                  <th class="px-4 py-3">Tempo de Guarda</th>
                  <th class="px-4 py-3">Como é Apagado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr>
                  <td class="px-4 py-3 font-semibold text-white">Vagas Encontradas (Histórico)</td>
                  <td class="px-4 py-3">Até 30 dias</td>
                  <td class="px-4 py-3">Apagadas automaticamente pelo sistema após esse período.</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 font-semibold text-white">Candidaturas Arquivadas</td>
                  <td class="px-4 py-3">Até 30 dias após arquivamento</td>
                  <td class="px-4 py-3">Eliminação definitiva automática através de nossa rotina diária de limpeza.</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 font-semibold text-white">Currículo PDF e Cadastro</td>
                  <td class="px-4 py-3">Enquanto sua conta estiver ativa</td>
                  <td class="px-4 py-3">Você pode apagar definitivamente todas as informações e o currículo a qualquer momento em seu perfil.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">4. Seus Direitos (LGPD)</h2>
          <p>
            Garantimos a você o controle total sobre as suas informações diretamente pela tela do sistema:
          </p>
          <ul class="list-disc list-inside space-y-1.5 ml-2">
            <li><strong>Acesso Livre</strong>: Você pode ver todas as candidaturas feitas, detalhes e relatórios na tela do seu painel.</li>
            <li><strong>Correção Fácil</strong>: Altere seu nome, e-mail, telefone e envie novos currículos sempre que quiser na tela de Perfil.</li>
            <li><strong>Exclusão Definitiva</strong>: Com um único clique, você remove permanentemente todo o seu histórico, informações pessoais e arquivo de currículo de nossos sistemas.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">5. Segurança e Proteção</h2>
          <p>
            Adotamos medidas rigorosas de proteção para manter sua jornada profissional segura:
          </p>
          <ul class="list-disc list-inside space-y-1.5 ml-2">
            <li>Proteções ativas para garantir a integridade dos arquivos enviados.</li>
            <li>Simulação segura de navegação humana para preenchimento de formulários, protegendo sua identidade contra bloqueios.</li>
            <li>Criptografia ativa em todas as comunicações da plataforma.</li>
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
