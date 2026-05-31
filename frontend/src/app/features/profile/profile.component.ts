import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-white mb-6">Meu Perfil</h1>

      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl">
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Nome completo</label>
            <input type="text" placeholder="Seu nome"
                   class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">E-mail</label>
            <input type="email" placeholder="seu@email.com"
                   class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Cargo alvo</label>
            <input type="text" placeholder="Ex: Desenvolvedor Angular/Python"
                   class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Currículo (PDF)</label>
            <input type="file" accept=".pdf"
                   class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
          </div>
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Salvar Perfil
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent {}
