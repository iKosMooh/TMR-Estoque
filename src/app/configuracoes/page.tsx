'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  const [isResetting, setIsResetting] = useState(false);

  const handleResetAllData = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá excluir TODOS os produtos, movimentações e dados do sistema. Esta ação não pode ser desfeita. Deseja continuar?')) {
      return;
    }

    if (!confirm('CONFIRMAÇÃO FINAL: Tem certeza absoluta de que deseja resetar todos os dados?')) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('/api/admin/reset-all-data', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Todos os dados foram resetados com sucesso!');
        // Recarregar a página após 2 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao resetar dados');
      }
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      toast.error('Erro ao resetar dados');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">TMR Auto Elétrica</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/estoque" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Estoque
                </Link>
                <Link href="/vendas" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Vendas
                </Link>
                <Link href="/relatorios" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Relatórios
                </Link>
                <Link href="/configuracoes" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Configurações
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Configurações do Sistema</h1>

          <div className="space-y-6">
            {/* Seção de Configurações Gerais */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Configurações Gerais</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Limite padrão para estoque baixo
                  </label>
                  <p className="text-sm text-gray-600">
                    Este valor é usado como padrão quando um produto não tem um limite específico configurado.
                    Atualmente: <strong>5 unidades</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Seção de Dados */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Gerenciamento de Dados</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Zona de Perigo
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          A ação abaixo irá <strong>permanentemente</strong> excluir todos os dados do sistema,
                          incluindo produtos, movimentações, vendas e configurações. Esta ação não pode ser desfeita.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleResetAllData}
                    disabled={isResetting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isResetting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Resetando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Resetar Todos os Dados</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Seção de Informações */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informações do Sistema</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Versão</h3>
                  <p className="text-sm text-gray-600">TMR Auto Elétrica v1.0.0</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Banco de Dados</h3>
                  <p className="text-sm text-gray-600">MySQL com Drizzle ORM</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Framework</h3>
                  <p className="text-sm text-gray-600">Next.js 16 com TypeScript</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">UI</h3>
                  <p className="text-sm text-gray-600">Tailwind CSS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}