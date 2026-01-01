'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { CogIcon, ExclamationIcon } from '@/components/Icons';

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
    <>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <CogIcon className="w-8 h-8 mr-3 text-blue-600" aria-hidden={true} />
            Configurações do Sistema
          </h1>
          <p className="text-gray-600">Gerencie as configurações e dados do sistema</p>
        </div>

        <div className="space-y-6">
          {/* Seção de Configurações Gerais */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-medium text-gray-900">Configurações Gerais</h2>
            </Card.Header>
            <Card.Body>
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
            </Card.Body>
          </Card>

          {/* Seção de Dados */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-medium text-gray-900">Gerenciamento de Dados</h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationIcon className="h-5 w-5 text-red-400" aria-hidden={true} />
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
                  <Button
                    onClick={handleResetAllData}
                    disabled={isResetting}
                    variant="danger"
                    isLoading={isResetting}
                  >
                    {isResetting ? 'Resetando...' : 'Resetar Todos os Dados'}
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Seção de Informações */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-medium text-gray-900">Informações do Sistema</h2>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Versão</h3>
                  <p className="text-sm text-gray-600">Estoque Simples v1.0.0</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Banco de Dados</h3>
                  <p className="text-sm text-gray-600">MySQL com Drizzle ORM</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Framework</h3>
                  <p className="text-sm text-gray-600">Next.js 16 com TypeScript</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">UI</h3>
                  <p className="text-sm text-gray-600">Tailwind CSS</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </main>
    </>
  );
}