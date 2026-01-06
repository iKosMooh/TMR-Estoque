'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { PackageIcon, ChartBarIcon, DocumentReportIcon, ShoppingCartIcon, UsersIcon, TruckIcon, CashRegisterIcon, FolderIcon, WarehouseIcon, BankIcon, CurrencyIcon, CogIcon, TagIcon, ClipboardListIcon } from './Icons/index';
import { NotificationPanel } from './NotificationPanel/index';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavCategory {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

// Itens principais que aparecem diretamente no header
const quickNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5" /> },
  { href: '/caixa', label: 'PDV', icon: <CashRegisterIcon className="w-5 h-5" /> },
];

// Categorias com dropdowns
const navCategories: NavCategory[] = [
  {
    label: 'Vendas',
    icon: <ShoppingCartIcon className="w-5 h-5" />,
    items: [
      { href: '/vendas', label: 'Nova Venda', icon: <ShoppingCartIcon className="w-4 h-4" /> },
      { href: '/gerenciar-vendas', label: 'Gerenciar Vendas', icon: <ClipboardListIcon className="w-4 h-4" /> },
      { href: '/ordens-servico', label: 'Ordens de Serviço', icon: <CogIcon className="w-4 h-4" /> },
    ]
  },
  {
    label: 'Gestão',
    icon: <PackageIcon className="w-5 h-5" />,
    items: [
      { href: '/estoque', label: 'Estoque', icon: <PackageIcon className="w-4 h-4" /> },
      { href: '/financeiro', label: 'Financeiro', icon: <CurrencyIcon className="w-4 h-4" /> },
      { href: '/relatorios', label: 'Relatórios', icon: <DocumentReportIcon className="w-4 h-4" /> },
    ]
  },
  {
    label: 'Cadastros',
    icon: <FolderIcon className="w-5 h-5" />,
    items: [
      { href: '/clientes', label: 'Clientes', icon: <UsersIcon className="w-4 h-4" /> },
      { href: '/fornecedores', label: 'Fornecedores', icon: <TruckIcon className="w-4 h-4" /> },
      { href: '/categorias', label: 'Categorias', icon: <FolderIcon className="w-4 h-4" /> },
      { href: '/depositos', label: 'Depósitos', icon: <WarehouseIcon className="w-4 h-4" /> },
      { href: '/contas-bancarias', label: 'Contas Bancárias', icon: <BankIcon className="w-4 h-4" /> },
      { href: '/etiquetas', label: 'Etiquetas', icon: <TagIcon className="w-4 h-4" /> },
      { href: '/configuracoes', label: 'Configurações', icon: <CogIcon className="w-4 h-4" /> },
    ]
  },
];

// Todos os itens para o menu mobile
const allNavItems: NavItem[] = [
  ...quickNavItems,
  ...navCategories.flatMap(cat => cat.items),
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const ref = dropdownRefs.current[openDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Fechar menu mobile ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCategoryActive = (category: NavCategory) => {
    return category.items.some(item => pathname === item.href || pathname.startsWith(item.href));
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <header aria-label="Cabeçalho principal" className="bg-card border-b border-border shadow-sm transition-colors backdrop-blur-sm bg-card/95 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-xl font-bold text-primary hover:text-primary/80 transition-colors">
              <Image
                src="/Logo.png"
                alt="Estoque Simples Logo"
                width={32}
                height={32}
                className="mr-2"
              />
              <span className="hidden sm:inline">Estoque</span>
              <span className="sm:hidden">ES</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:items-center lg:space-x-1">
            {/* Quick Nav Items */}
            {quickNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="mr-1.5" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}

            {/* Category Dropdowns */}
            {navCategories.map((category) => {
              const isActive = isCategoryActive(category);
              const isOpen = openDropdown === category.label;
              
              return (
                <div 
                  key={category.label} 
                  className="relative"
                  ref={(el) => { dropdownRefs.current[category.label] = el; }}
                >
                  <button
                    onClick={() => toggleDropdown(category.label)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      ${isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                  >
                    <span className="mr-1.5">{category.icon}</span>
                    {category.label}
                    <svg className={`ml-1 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isOpen && (
                    <div className="absolute left-0 mt-2 w-56 rounded-lg shadow-lg border border-border py-2 z-50 card-bg">
                      {category.items.map((item) => {
                        const isItemActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpenDropdown(null)}
                            className={`flex items-center px-4 py-2 text-sm transition-colors
                              ${isItemActive 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-foreground hover:bg-accent'
                              }`}
                          >
                            <span className="mr-2">{item.icon}</span>
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Side: Theme Toggle & Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            <NotificationPanel />
            <ThemeToggle />
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-label="Menu de navegação"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <nav className="px-4 py-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Quick Nav */}
            <div className="pb-2 border-b border-border mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Acesso Rápido</p>
              {quickNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Categories */}
            {navCategories.map((category) => (
              <div key={category.label} className="pb-2 border-b border-border mb-2 last:border-b-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center">
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </p>
                {category.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ml-4
                        ${isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};