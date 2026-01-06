'use client';

import { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';

interface Customer {
  id: string;
  type: 'pf' | 'pj';
  name: string;
  cpfCnpj: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
}

interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  title: string;
  description: string | null;
  equipmentType: string | null;
  equipmentBrand: string | null;
  equipmentModel: string | null;
  equipmentSerial: string | null;
  reportedIssue: string | null;
  diagnosis: string | null;
  solution: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'waiting_parts' | 'waiting_approval' | 'completed' | 'cancelled' | 'delivered';
  estimatedCost: string | null;
  laborCost: string | null;
  partsCost: string | null;
  totalCost: string | null;
  warrantyMonths: number | null;
  receivedAt: string;
  estimatedCompletionDate: string | null;
  completedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  customerName: string;
  customerCpfCnpj: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
}

interface ServiceOrderFormData {
  customerId: string;
  title: string;
  description: string;
  equipmentType: string;
  equipmentBrand: string;
  equipmentModel: string;
  equipmentSerial: string;
  reportedIssue: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: string;
  estimatedCompletionDate: string;
  notes: string;
}

interface CustomerFormData {
  type: 'pf' | 'pj';
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  mobile: string;
}

const emptyOrderFormData: ServiceOrderFormData = {
  customerId: '',
  title: '',
  description: '',
  equipmentType: '',
  equipmentBrand: '',
  equipmentModel: '',
  equipmentSerial: '',
  reportedIssue: '',
  priority: 'medium',
  estimatedCost: '',
  estimatedCompletionDate: '',
  notes: '',
};

const emptyCustomerFormData: CustomerFormData = {
  type: 'pf',
  name: '',
  cpfCnpj: '',
  email: '',
  phone: '',
  mobile: '',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  waiting_parts: { label: 'Aguard. Peças', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  waiting_approval: { label: 'Aguard. Aprovação', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  delivered: { label: 'Entregue', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
};

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

export default function OrdensServico() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Modal de cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1); // 1 = Selecionar/Criar Cliente, 2 = Dados da OS
  const [formData, setFormData] = useState<ServiceOrderFormData>(emptyOrderFormData);
  const [customerFormData, setCustomerFormData] = useState<CustomerFormData>(emptyCustomerFormData);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal de detalhes/edição
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Modal de confirmação de exclusão
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/service-orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        toast.error('Erro ao carregar ordens de serviço');
      }
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
      toast.error('Erro ao carregar ordens de serviço');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/customers?active=true');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, [fetchOrders, fetchCustomers]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.cpfCnpj && customer.cpfCnpj.includes(customerSearch)) ||
    (customer.phone && customer.phone.includes(customerSearch))
  );

  const openNewOrderModal = () => {
    setFormData(emptyOrderFormData);
    setCustomerFormData(emptyCustomerFormData);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setIsCreatingNewCustomer(false);
    setModalStep(1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptyOrderFormData);
    setCustomerFormData(emptyCustomerFormData);
    setSelectedCustomer(null);
    setModalStep(1);
    setIsCreatingNewCustomer(false);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...formData, customerId: customer.id });
    setCustomerSearch('');
  };

  const startNewCustomer = () => {
    setIsCreatingNewCustomer(true);
    setCustomerFormData(emptyCustomerFormData);
  };

  const cancelNewCustomer = () => {
    setIsCreatingNewCustomer(false);
    setCustomerFormData(emptyCustomerFormData);
  };

  const formatCpfCnpj = (value: string, type: 'pf' | 'pj') => {
    const numbers = value.replace(/\D/g, '');
    if (type === 'pf') {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .slice(0, 18);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    }
  };

  const handleCustomerInputChange = (field: keyof CustomerFormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'cpfCnpj') {
      formattedValue = formatCpfCnpj(value, customerFormData.type);
    } else if (field === 'phone' || field === 'mobile') {
      formattedValue = formatPhone(value);
    }
    
    setCustomerFormData({ ...customerFormData, [field]: formattedValue });
  };

  const createCustomerAndContinue = async () => {
    if (!customerFormData.name.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerFormData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Cliente criado com sucesso!');
        
        // Criar objeto do cliente com dados do formulário
        const newCustomer: Customer = {
          id: data.customer?.id || data.id,
          type: customerFormData.type,
          name: customerFormData.name,
          cpfCnpj: customerFormData.cpfCnpj || null,
          email: customerFormData.email || null,
          phone: customerFormData.phone || null,
          mobile: customerFormData.mobile || null,
        };
        
        setSelectedCustomer(newCustomer);
        setFormData({ ...formData, customerId: newCustomer.id });
        setIsCreatingNewCustomer(false);
        fetchCustomers(); // Atualizar lista
      } else {
        toast.error(data.error || 'Erro ao criar cliente');
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente');
    } finally {
      setIsSaving(false);
    }
  };

  const goToStep2 = () => {
    if (!selectedCustomer) {
      toast.error('Selecione ou cadastre um cliente primeiro');
      return;
    }
    setModalStep(2);
  };

  const goBackToStep1 = () => {
    setModalStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      toast.error('Cliente é obrigatório');
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Ordem de serviço criada com sucesso!');
        closeModal();
        fetchOrders();
      } else {
        toast.error(data.error || 'Erro ao criar ordem de serviço');
      }
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      toast.error('Erro ao criar ordem de serviço');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/service-orders/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Ordem de serviço excluída!');
        setDeleteConfirmId(null);
        fetchOrders();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao excluir');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir ordem de serviço');
    } finally {
      setIsDeleting(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/service-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Status atualizado!');
        fetchOrders();
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Ordens de Serviço
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie suas ordens de serviço e assistência técnica
          </p>
        </div>
        <Button onClick={openNewOrderModal}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Ordem
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            placeholder="Buscar por número, título, cliente..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="in_progress">Em Andamento</option>
          <option value="waiting_parts">Aguardando Peças</option>
          <option value="waiting_approval">Aguardando Aprovação</option>
          <option value="completed">Concluído</option>
          <option value="delivered">Entregue</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Lista de Ordens */}
      {isLoading ? (
        <LoadingState message="Carregando ordens de serviço..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Nenhuma ordem de serviço encontrada"
          description={searchTerm || statusFilter ? 'Tente outros filtros' : 'Comece criando sua primeira ordem de serviço'}
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          action={
            !searchTerm && !statusFilter && (
              <Button onClick={openNewOrderModal}>
                Criar Ordem de Serviço
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-card border border-border shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-level-1">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ordem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Equipamento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-level-1">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {order.orderNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.title.length > 30 ? order.title.substring(0, 30) + '...' : order.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {order.customerName}
                      </div>
                      {order.customerPhone && (
                        <div className="text-xs text-muted-foreground">
                          {order.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {order.equipmentType || '-'}
                      </div>
                      {order.equipmentBrand && (
                        <div className="text-xs text-muted-foreground">
                          {order.equipmentBrand} {order.equipmentModel}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityLabels[order.priority]?.color}`}>
                        {priorityLabels[order.priority]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${statusLabels[order.status]?.color}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="waiting_parts">Aguard. Peças</option>
                        <option value="waiting_approval">Aguard. Aprovação</option>
                        <option value="completed">Concluído</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(order.receivedAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setDeleteConfirmId(order.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Cadastro - Etapas */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalStep === 1 ? 'Nova OS - Etapa 1/2: Cliente' : 'Nova OS - Etapa 2/2: Dados da Ordem'}
        size="lg"
      >
        {modalStep === 1 ? (
          /* Etapa 1: Selecionar ou Criar Cliente */
          <div className="space-y-6">
            {!isCreatingNewCustomer ? (
              <>
                {/* Cliente selecionado */}
                {selectedCustomer && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-green-800 dark:text-green-200">
                          ✓ Cliente selecionado
                        </div>
                        <div className="text-lg font-semibold text-foreground mt-1">
                          {selectedCustomer.name}
                        </div>
                        {selectedCustomer.cpfCnpj && (
                          <div className="text-sm text-muted-foreground">
                            {selectedCustomer.type === 'pf' ? 'CPF' : 'CNPJ'}: {selectedCustomer.cpfCnpj}
                          </div>
                        )}
                        {selectedCustomer.phone && (
                          <div className="text-sm text-muted-foreground">
                            Tel: {selectedCustomer.phone}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedCustomer(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Buscar cliente existente */}
                {!selectedCustomer && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Buscar Cliente Existente
                      </label>
                      <Input
                        placeholder="Digite nome, CPF/CNPJ ou telefone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                      
                      {customerSearch && filteredCustomers.length > 0 && (
                        <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-lg bg-level-1">
                          {filteredCustomers.slice(0, 10).map((customer) => (
                            <div
                              key={customer.id}
                              onClick={() => selectCustomer(customer)}
                              className="p-3 hover:bg-level-2 cursor-pointer border-b border-border last:border-b-0"
                            >
                              <div className="font-medium text-foreground">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {customer.cpfCnpj || 'Sem documento'} 
                                {customer.phone && ` • ${customer.phone}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {customerSearch && filteredCustomers.length === 0 && (
                        <div className="mt-2 p-4 text-center text-muted-foreground border border-border rounded-lg">
                          Nenhum cliente encontrado
                        </div>
                      )}
                    </div>

                    {/* Divisor */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          ou
                        </span>
                      </div>
                    </div>

                    {/* Botão para novo cliente */}
                    <div className="text-center">
                      <Button variant="secondary" onClick={startNewCustomer}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Cadastrar Novo Cliente
                      </Button>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Formulário de novo cliente */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">Cadastrar Novo Cliente</h3>
                  <button
                    onClick={cancelNewCustomer}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ← Voltar para busca
                  </button>
                </div>

                {/* Tipo de Cliente */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tipo de Cliente
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="customerType"
                        value="pf"
                        checked={customerFormData.type === 'pf'}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, type: e.target.value as 'pf' | 'pj', cpfCnpj: '' })}
                        className="form-radio h-4 w-4 text-primary"
                      />
                      <span className="ml-2 text-sm text-foreground">Pessoa Física</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="customerType"
                        value="pj"
                        checked={customerFormData.type === 'pj'}
                        onChange={(e) => setCustomerFormData({ ...customerFormData, type: e.target.value as 'pf' | 'pj', cpfCnpj: '' })}
                        className="form-radio h-4 w-4 text-primary"
                      />
                      <span className="ml-2 text-sm text-foreground">Pessoa Jurídica</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label={customerFormData.type === 'pf' ? 'Nome Completo *' : 'Razão Social *'}
                      value={customerFormData.name}
                      onChange={(e) => handleCustomerInputChange('name', e.target.value)}
                      placeholder={customerFormData.type === 'pf' ? 'Ex: João da Silva' : 'Ex: Empresa Ltda'}
                    />
                  </div>
                  <Input
                    label={customerFormData.type === 'pf' ? 'CPF' : 'CNPJ'}
                    value={customerFormData.cpfCnpj}
                    onChange={(e) => handleCustomerInputChange('cpfCnpj', e.target.value)}
                    placeholder={customerFormData.type === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={customerFormData.email}
                    onChange={(e) => handleCustomerInputChange('email', e.target.value)}
                    placeholder="exemplo@email.com"
                  />
                  <Input
                    label="Telefone"
                    value={customerFormData.phone}
                    onChange={(e) => handleCustomerInputChange('phone', e.target.value)}
                    placeholder="(00) 0000-0000"
                  />
                  <Input
                    label="Celular"
                    value={customerFormData.mobile}
                    onChange={(e) => handleCustomerInputChange('mobile', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={cancelNewCustomer}>
                    Cancelar
                  </Button>
                  <Button onClick={createCustomerAndContinue} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar e Continuar'}
                  </Button>
                </div>
              </div>
            )}

            {/* Botões de navegação (quando não está criando cliente) */}
            {!isCreatingNewCustomer && (
              <div className="flex justify-between gap-3 pt-4 border-t border-border">
                <Button variant="secondary" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button onClick={goToStep2} disabled={!selectedCustomer}>
                  Próximo →
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Etapa 2: Dados da Ordem de Serviço */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info do cliente selecionado */}
            <div className="p-3 bg-level-1 rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">
                  {selectedCustomer?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium text-foreground">{selectedCustomer?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedCustomer?.cpfCnpj || selectedCustomer?.phone || 'Cliente selecionado'}
                </div>
              </div>
              <button
                type="button"
                onClick={goBackToStep1}
                className="ml-auto text-sm text-primary hover:underline"
              >
                Alterar
              </button>
            </div>

            {/* Título */}
            <Input
              label="Título / Descrição do Serviço *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reparo de notebook, Troca de tela, Manutenção preventiva..."
              required
            />

            {/* Equipamento */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground mb-4">Dados do Equipamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tipo de Equipamento"
                  value={formData.equipmentType}
                  onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
                  placeholder="Ex: Notebook, Celular, Impressora..."
                />
                <Input
                  label="Marca"
                  value={formData.equipmentBrand}
                  onChange={(e) => setFormData({ ...formData, equipmentBrand: e.target.value })}
                  placeholder="Ex: Dell, Samsung, HP..."
                />
                <Input
                  label="Modelo"
                  value={formData.equipmentModel}
                  onChange={(e) => setFormData({ ...formData, equipmentModel: e.target.value })}
                  placeholder="Ex: Inspiron 15, Galaxy S21..."
                />
                <Input
                  label="Número de Série"
                  value={formData.equipmentSerial}
                  onChange={(e) => setFormData({ ...formData, equipmentSerial: e.target.value })}
                  placeholder="Número de série do equipamento"
                />
              </div>
            </div>

            {/* Problema Relatado */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Problema Relatado pelo Cliente
              </label>
              <textarea
                value={formData.reportedIssue}
                onChange={(e) => setFormData({ ...formData, reportedIssue: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                placeholder="Descreva o problema informado pelo cliente..."
              />
            </div>

            {/* Prioridade e Previsão */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <Input
                label="Custo Estimado (R$)"
                type="number"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="0,00"
              />
              <Input
                label="Previsão de Conclusão"
                type="date"
                value={formData.estimatedCompletionDate}
                onChange={(e) => setFormData({ ...formData, estimatedCompletionDate: e.target.value })}
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                placeholder="Observações adicionais..."
              />
            </div>

            {/* Botões */}
            <div className="flex justify-between gap-3 pt-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={goBackToStep1}>
                ← Voltar
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Criar Ordem de Serviço'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
