'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Transaction {
  transaction: {
    id: string;
    transactionType: 'income' | 'expense' | 'transfer';
    description: string;
    amount: string;
    dueDate: string;
    paymentDate: string | null;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partially_paid';
    paidAmount: string;
    paymentMethod: string | null;
    notes: string | null;
  };
  bankAccount: { bankName: string } | null;
  customer: { name: string } | null;
  supplier: { companyName: string } | null;
  category: { name: string; type: string } | null;
}

interface Totals {
  income: number;
  expense: number;
  pending: number;
  overdue: number;
  balance: number;
}

const typeLabels: Record<string, string> = {
  income: 'Receita',
  expense: 'Despesa',
  transfer: 'Transferência',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
  partially_paid: 'Parcialmente Pago',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  partially_paid: 'bg-orange-100 text-orange-800',
};

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState<Totals>({ income: 0, expense: 0, pending: 0, overdue: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    transactionType: 'expense' as 'income' | 'expense' | 'transfer',
    description: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    paymentDate: '',
    paymentMethod: '',
    notes: '',
  });

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, statusFilter]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('type', filter);
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await fetch(`/api/financial/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotals(data.totals || { income: 0, expense: 0, pending: 0, overdue: 0, balance: 0 });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      transactionType: 'expense',
      description: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: '',
      paymentMethod: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/financial/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          paymentDate: formData.paymentDate || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success('Transação criada!');
      setIsModalOpen(false);
      resetForm();
      fetchTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const transaction = transactions.find(t => t.transaction.id === id);
      if (!transaction) return;

      const res = await fetch(`/api/financial/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transaction.transaction,
          paymentDate: new Date().toISOString().split('T')[0],
          paidAmount: transaction.transaction.amount,
          status: 'paid',
        }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar');

      toast.success('Marcado como pago!');
      fetchTransactions();
    } catch {
      toast.error('Erro ao atualizar transação');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta transação?')) return;
    
    try {
      const res = await fetch(`/api/financial/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao cancelar');
      
      toast.success('Transação cancelada!');
      fetchTransactions();
    } catch {
      toast.error('Erro ao cancelar transação');
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">Controle de receitas e despesas</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Transação
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg shadow p-4">
            <p className="text-sm text-muted-foreground">Receitas (Pagas)</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totals.income)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg shadow p-4">
            <p className="text-sm text-muted-foreground">Despesas (Pagas)</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totals.expense)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg shadow p-4">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className={`text-xl font-bold ${totals.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(totals.balance)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg shadow p-4">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg shadow p-4">
            <p className="text-sm text-muted-foreground">Vencidos</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totals.overdue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-card text-foreground'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('income')}
              className={`px-4 py-2 text-sm ${filter === 'income' ? 'bg-green-600 text-white' : 'bg-card text-foreground'}`}
            >
              Receitas
            </button>
            <button
              onClick={() => setFilter('expense')}
              className={`px-4 py-2 text-sm ${filter === 'expense' ? 'bg-red-600 text-white' : 'bg-card text-foreground'}`}
            >
              Despesas
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="paid">Pagos</option>
            <option value="overdue">Vencidos</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-level-1">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vencimento</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {transactions.map(({ transaction, category }) => (
                  <tr key={transaction.id} className="hover:bg-level-1">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        transaction.transactionType === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : transaction.transactionType === 'expense'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {typeLabels[transaction.transactionType]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{transaction.description}</div>
                      {category && (
                        <div className="text-sm text-muted-foreground">{category.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(transaction.dueDate)}
                      {transaction.paymentDate && (
                        <div className="text-xs text-green-600">
                          Pago: {formatDate(transaction.paymentDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`font-semibold ${
                        transaction.transactionType === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transactionType === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[transaction.status]}`}>
                        {statusLabels[transaction.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {transaction.status === 'pending' && (
                        <button
                          onClick={() => handleMarkAsPaid(transaction.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Pagar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-foreground mb-4">Nova Transação</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tipo *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, transactionType: 'income' }))}
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        formData.transactionType === 'income'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-card text-foreground border-border'
                      }`}
                    >
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, transactionType: 'expense' }))}
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        formData.transactionType === 'expense'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-card text-foreground border-border'
                      }`}
                    >
                      Despesa
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Descrição *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    placeholder="Ex: Venda de produto, Pagamento fornecedor..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Valor *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Vencimento *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Data Pagamento</label>
                    <input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Preencha para marcar como pago</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Forma Pagamento</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Selecione...</option>
                      <option value="cash">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="credit_card">Cartão Crédito</option>
                      <option value="debit_card">Cartão Débito</option>
                      <option value="boleto">Boleto</option>
                      <option value="transfer">Transferência</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                    className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-level-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Criar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
