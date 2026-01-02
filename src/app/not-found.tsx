import Link from 'next/link';
import { PackageIcon, ArrowRightIcon } from '@/components/Icons/index';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <PackageIcon className="w-24 h-24 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">Página não encontrada</h2>
            <p className="text-muted-foreground">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aqui estão algumas opções para continuar navegando:
            </p>

            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full justify-center">
                  <ArrowRightIcon className="w-4 h-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="text-xs text-muted-foreground">
          <p>Se você acredita que isso é um erro, entre em contato com o suporte.</p>
        </div>
      </div>
    </div>
  );
}