'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string | null;
  agency: string | null;
  accountNumber: string | null;
  accountType: 'checking' | 'savings' | 'payment';
  balance: string;
  isActive: number;
}

const accountTypeLabels: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  payment: 'Conta Pagamento',
};

export default function ContasBancariasPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const [formData, setFormData] = useState({
    bankName: '',
    bankCode: '',
    agency: '',
    accountNumber: '',
    accountType: 'checking' as 'checking' | 'savings' | 'payment',
    balance: '0',
  });

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchAccounts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const res = await fetch(`/api/bank-accounts?${params}`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      bankCode: '',
      agency: '',
      accountNumber: '',
      accountType: 'checking',
      balance: '0',
    });
    setEditingAccount(null);
  };

  const openModal = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        bankName: account.bankName,
        bankCode: account.bankCode || '',
        agency: account.agency || '',
        accountNumber: account.accountNumber || '',
        accountType: account.accountType,
        balance: account.balance,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingAccount 
        ? `/api/bank-accounts/${editingAccount.id}` 
        : '/api/bank-accounts';
      
      const method = editingAccount ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success(editingAccount ? 'Conta atualizada!' : 'Conta criada!');
      setIsModalOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      
      toast.success('Conta excluída!');
      fetchAccounts();
    } catch {
      toast.error('Erro ao excluir conta');
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || '0'), 0);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas Bancárias</h1>
            <p className="text-muted-foreground">Gerencie suas contas e saldos</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Conta
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow p-6 mb-6 text-white">
          <p className="text-blue-100 text-sm">Saldo Total</p>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="text-blue-100 text-sm mt-1">{accounts.length} conta(s) ativa(s)</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar contas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground bg-card border border-border rounded-lg shadow">
              Nenhuma conta encontrada
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="bg-card border border-border rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{account.bankName}</h3>
                    <span className="text-xs text-muted-foreground bg-level-1 px-2 py-0.5 rounded">
                      {accountTypeLabels[account.accountType]}
                    </span>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    parseFloat(account.balance) >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <svg className={`w-6 h-6 ${parseFloat(account.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-2xl font-bold ${parseFloat(account.balance) >= 0 ? 'text-foreground' : 'text-red-600'}`}>
                    {formatCurrency(account.balance)}
                  </p>
                </div>

                {(account.agency || account.accountNumber) && (
                  <div className="text-sm text-muted-foreground mb-4 flex gap-4">
                    {account.agency && (
                      <div>
                        <span className="text-muted-foreground/60">Ag:</span> {account.agency}
                      </div>
                    )}
                    {account.accountNumber && (
                      <div>
                        <span className="text-muted-foreground/60">Conta:</span> {account.accountNumber}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button
                    onClick={() => openModal(account)}
                    className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-foreground mb-4">
                {editingAccount ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Banco *</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    required
                    placeholder="Ex: Banco do Brasil, Nubank..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Código do Banco</label>
                    <input
                      type="text"
                      value={formData.bankCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankCode: e.target.value }))}
                      placeholder="001, 260..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Tipo *</label>
                    <select
                      value={formData.accountType}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value as 'checking' | 'savings' | 'payment' }))}
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring"
                    >
                      <option value="checking">Conta Corrente</option>
                      <option value="savings">Poupança</option>
                      <option value="payment">Conta Pagamento</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Agência</label>
                    <input
                      type="text"
                      value={formData.agency}
                      onChange={(e) => setFormData(prev => ({ ...prev, agency: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Conta</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
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
                    {editingAccount ? 'Salvar' : 'Criar'}
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
