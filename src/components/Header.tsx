'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { PackageIcon, ChartBarIcon, DocumentReportIcon, ShoppingCartIcon, UsersIcon, TruckIcon, CashRegisterIcon, FolderIcon, WarehouseIcon, BankIcon, CurrencyIcon, CogIcon, TagIcon } from './Icons/index';
import { NotificationPanel } from './NotificationPanel/index';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5" /> },
  { href: '/caixa', label: 'PDV', icon: <CashRegisterIcon className="w-5 h-5" /> },
  { href: '/estoque', label: 'Estoque', icon: <PackageIcon className="w-5 h-5" /> },
  { href: '/vendas', label: 'Vendas', icon: <ShoppingCartIcon className="w-5 h-5" /> },
  { href: '/financeiro', label: 'Financeiro', icon: <CurrencyIcon className="w-5 h-5" /> },
  { href: '/relatorios', label: 'Relatórios', icon: <DocumentReportIcon className="w-5 h-5" /> },
];

const cadastrosItems: NavItem[] = [
  { href: '/clientes', label: 'Clientes', icon: <UsersIcon className="w-4 h-4" /> },
  { href: '/fornecedores', label: 'Fornecedores', icon: <TruckIcon className="w-4 h-4" /> },
  { href: '/categorias', label: 'Categorias', icon: <FolderIcon className="w-4 h-4" /> },
  { href: '/depositos', label: 'Depósitos', icon: <WarehouseIcon className="w-4 h-4" /> },
  { href: '/contas-bancarias', label: 'Contas Bancárias', icon: <BankIcon className="w-4 h-4" /> },
  { href: '/etiquetas', label: 'Etiquetas', icon: <TagIcon className="w-4 h-4" /> },
  { href: '/configuracoes', label: 'Configurações', icon: <CogIcon className="w-4 h-4" /> },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isCadastroActive = cadastrosItems.some(item => pathname === item.href || pathname.startsWith(item.href));

  return (
    <header aria-label="Cabeçalho principal" className="bg-card border-b border-border shadow-sm transition-colors backdrop-blur-sm bg-card/95 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center text-xl font-bold text-primary hover:text-primary/80 transition-colors">
                <Image
                  src="/Logo.png"
                  alt="Estoque Simples Logo"
                  width={32}
                  height={32}
                  className="mr-2"
                />
                <span>Estoque Simples</span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-2 sm:items-center">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      ${
                        isActive
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
              
              {/* Dropdown Cadastros */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${
                      isCadastroActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  <CogIcon className="w-5 h-5 mr-1.5" />
                  Cadastros
                  <svg className={`ml-1 w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-lg shadow-lg bg-card border border-border py-2 z-50">
                    {cadastrosItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center px-4 py-2 text-sm transition-colors
                            ${isActive 
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
            </div>
          </div>

          {/* Theme Toggle Button */}
          <div className="flex items-center space-x-2">
            <NotificationPanel />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};