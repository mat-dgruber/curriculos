import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <!-- Back button -->
      <a
        routerLink="/dashboard"
        class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors mb-6 glass-v2 rounded-full px-4 py-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para o Dashboard
      </a>

      <!-- Title Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Termos de Uso</h1>
        <p class="text-sm text-text-muted">Última atualização: 2 de Junho de 2026 | Versão 1.2</p>
      </div>

      <!-- Content Box -->
      <div class="organic-card p-6 md:p-8 space-y-8 text-sm text-text-secondary leading-relaxed">
        <div class="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-text-main">
          <strong>Aviso de Isenção Importante:</strong> O JobHunter é um assistente autônomo de
          automação local desenvolvido de forma independente. O uso desta plataforma é de inteira
          responsabilidade do usuário, que deve estar ciente das regras das plataformas de vagas
          externas.
        </div>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">
            1. Aceitação contratual dos Termos
          </h2>
          <p>
            Ao criar uma conta ou utilizar os serviços do <strong>JobHunter</strong>, você declara
            ter capacidade civil plena e expressa concordância integral e irrevogável com os
            presentes Termos de Uso. Caso discorde de qualquer cláusula estabelecida, você deve
            imediatamente cessar a utilização e deletar todos os arquivos da plataforma.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">
            2. Natureza e Escopo dos Serviços de Automação
          </h2>
          <p>
            O <strong>JobHunter</strong> funciona como um intermediador de automação em nível de
            cliente. O sistema disponibiliza:
          </p>
          <ul class="list-disc list-inside space-y-1.5 ml-2">
            <li>
              <strong>Robôs de Varredura (Scrapers)</strong>: Motores Playwright e HTTP REST APIs
              para localizar, indexar e analisar semanticamente anúncios de vagas públicas em
              portais externos.
            </li>
            <li>
              <strong>Algoritmo de Compatibilidade Semântica (Score Engine)</strong>: Análise de
              correspondência textual entre o currículo do candidato e as exigências do anúncio da
              vaga.
            </li>
            <li>
              <strong>Robôs de Candidatura (Applicators)</strong>: Automação robótica baseada em
              navegadores headless para preencher dados cadastrais e anexar o PDF do currículo
              diretamente nos formulários das plataformas contratantes.
            </li>
          </ul>
          <p class="text-xs text-text-muted">
            Nota: O JobHunter atua estritamente simulando o comportamento de navegação humana para
            preenchimento de formulários públicos. Nós não possuímos acesso privilegiado ou contatos
            diretos (backdoor) com portais de ATS externos.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">
            3. Relação com Portais Externos de Vagas
          </h2>
          <p>
            O candidato declara-se ciente de que portais de vagas de terceiros (incluindo, mas não
            se limitando a: <em>Gupy, LinkedIn, Vagas.com, InfoJobs, Catho</em>) possuem seus
            próprios Termos de Serviço, os quais podem conter restrições ou proibições explícitas ao
            uso de scripts automatizados de preenchimento.
          </p>
          <p>
            <strong>Responsabilidade de Bloqueios:</strong> Qualquer suspensão de conta, banimento,
            ou bloqueio por Captcha avançado nas plataformas de terceiros decorrente do uso das
            automações do JobHunter é de risco exclusivo do usuário.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">
            4. Diretrizes de Uso Aceitável
          </h2>
          <p>O usuário compromete-se a NÃO utilizar a plataforma para:</p>
          <ul class="list-disc list-inside space-y-1.5 ml-2">
            <li>
              Submeter currículos ou perfis com dados falsificados, enganosos ou personificando
              terceiros.
            </li>
            <li>
              Configurar intervalos de varredura excessivamente agressivos capazes de caracterizar
              ataques de negação de serviço (DoS) contra portais de recrutamento.
            </li>
            <li>
              Cadastrar arquivos PDF corrompidos ou contendo scripts, payloads maliciosos ou vírus
              de computador.
            </li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">
            5. Limitação de Garantias e Indenizações
          </h2>
          <p>
            O <strong>JobHunter</strong> é disponibilizado "no estado em que se encontra" (<em
              >as is</em
            >), sem quaisquer garantias implícitas de funcionamento ininterrupto, isenção de bugs ou
            de que haverá sucesso na contratação profissional. O sistema de automação depende
            diretamente da estrutura HTML dos formulários externos; caso uma plataforma de vagas
            mude seu layout ou introduza Captchas impenetráveis, a automação para aquela plataforma
            poderá falhar até que novas correções de código sejam aplicadas.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-white font-serif border-b border-white/10 pb-2">
            6. Resolução de Conflitos e Foro
          </h2>
          <p>
            Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Para
            dirimir quaisquer controvérsias decorrentes deste contrato, fica eleito o Foro da
            Comarca do usuário, com exclusão de qualquer outro, por mais privilegiado que seja.
          </p>
        </section>

        <div class="pt-6 border-t border-white/10 text-center">
          <p class="text-xs text-text-muted">
            Dúvidas sobre a legitimidade da automação? Leia nossa Política de Privacidade ou contate
            o administrador.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class TermsComponent {}
