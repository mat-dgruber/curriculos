import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-white mb-6">Configurações</h1>

      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl space-y-6">
        <div>
          <h3 class="text-white font-semibold mb-3">Frequência de varredura</h3>
          <select class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500">
            <option value="3">A cada 3 horas</option>
            <option value="6" selected>A cada 6 horas</option>
            <option value="12">A cada 12 horas</option>
            <option value="24">Diariamente</option>
          </select>
        </div>

        <div>
          <h3 class="text-white font-semibold mb-3">Candidatura automática</h3>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" class="w-4 h-4 rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-blue-500" />
            <span class="text-gray-300 text-sm">Enviar currículo automaticamente para vagas com score ≥ 80%</span>
          </label>
        </div>

        <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          Salvar Configurações
        </button>
      </div>
    </div>
  `
})
export class SettingsComponent {}
