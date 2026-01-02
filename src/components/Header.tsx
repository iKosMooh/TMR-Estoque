'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React from 'react';
import { PackageIcon, ChartBarIcon, DocumentReportIcon, ShoppingCartIcon } from './Icons/index';
import { NotificationPanel } from './NotificationPanel/index';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5" /> },
  { href: '/estoque', label: 'Estoque', icon: <PackageIcon className="w-5 h-5" /> },
  { href: '/vendas', label: 'Vendas', icon: <ShoppingCartIcon className="w-5 h-5" /> },
  { href: '/relatorios', label: 'Relatórios', icon: <DocumentReportIcon className="w-5 h-5" /> },
];

export const Header: React.FC = () => {
  const pathname = usePathname();

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
            <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="mr-2" aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
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