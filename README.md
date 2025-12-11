# Estoque Simples - Sistema de Gerenciamento de Estoque

Sistema web simples e intuitivo para gerenciamento de estoque a partir de XML de notas fiscais (NF-e).

## Funcionalidades

- Importação automática de produtos via XML NF-e
- Controle de estoque com códigos de barras e internos
- Registro de vendas com atualização automática do estoque
- Alertas de estoque baixo
- Dashboard com gráficos e KPIs
- Relatórios diários e semanais
- Exportação de dados em CSV

## Stack Tecnológica

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **ORM**: Drizzle ORM
- **Banco**: PostgreSQL
- **Autenticação**: NextAuth.js
- **Parsing XML**: fast-xml-parser
- **Gráficos**: Recharts

## Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Docker (opcional, para desenvolvimento local)

## Instalação e Configuração

1. **Clone o repositório**
   `ash
   git clone <url-do-repositorio>
   cd estoque-simples
   `

2. **Instale as dependências**
   `ash
   npm install
   `

3. **Configure o banco de dados**

   Opção A: Usando Docker
   `ash
   docker-compose up -d
   `

   Opção B: PostgreSQL local
   - Crie um banco de dados PostgreSQL
   - Configure as credenciais

4. **Configure as variáveis de ambiente**

   Copie .env.local e ajuste as configurações:
   `env
   DATABASE_URL="postgresql://user:password@localhost:5432/estoque_simples"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   `

5. **Execute as migrações do banco**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

6. **Execute o seed para criar usuário admin**
   ```bash
   npx tsx seed.ts
   ```

   Credenciais padrão:
   - Email: admin@estoque.com
   - Senha: admin123

7. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

8. **Acesse o sistema**

   Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Estrutura do Projeto

`
src/
 app/                    # Páginas Next.js
    api/               # API Routes
    auth/              # Páginas de autenticação
    import/            # Página de importação XML
    page.tsx           # Dashboard principal
 lib/                   # Utilitários
    auth.ts            # Configuração NextAuth
    db/                # Configuração banco de dados
        index.ts       # Conexão Drizzle
        schema.ts      # Schemas das tabelas
 types/                 # Tipos TypeScript
`

## Uso Básico

1. **Login**: Use as credenciais padrão ou crie um usuário administrador.

2. **Importar Produtos**: Vá para /import e faça upload de um arquivo XML NF-e.

3. **Gerenciar Estoque**: Na página /estoque, busque produtos por código de barras.

4. **Registrar Vendas**: Use /vendas para registrar saídas de estoque.

5. **Visualizar Relatórios**: Acesse /relatorios para gerar relatórios.

## Formato XML NF-e Esperado

O sistema espera arquivos XML NF-e com a seguinte estrutura básica:

`xml
<NFe>
  <infNFe>
    <det>
      <prod>
        <cProd>CODIGO_PRODUTO</cProd>
        <cEAN>CODIGO_BARRAS</cEAN>
        <xProd>NOME_PRODUTO</xProd>
        <NCM>NCM</NCM>
        <vProd>VALOR_UNITARIO</vProd>
        <qCom>QUANTIDADE</qCom>
      </prod>
    </det>
  </infNFe>
</NFe>
`

## Desenvolvimento

### Comandos Disponíveis

- 
pm run dev - Servidor de desenvolvimento
- 
pm run build - Build de produção
- 
pm run start - Servidor de produção
- 
pm run lint - Executar ESLint

### Migrações do Banco

`ash
# Gerar migração
npx drizzle-kit generate

# Aplicar migração
npx drizzle-kit migrate
`

## Deploy

1. Configure as variáveis de ambiente de produção
2. Execute 
pm run build
3. Execute 
pm run start
4. Ou faça deploy no Vercel/Netlify

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (git checkout -b feature/nova-feature)
3. Commit suas mudanças (git commit -am 'Adiciona nova feature')
4. Push para a branch (git push origin feature/nova-feature)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT.

## Suporte

Para dúvidas ou suporte, abra uma issue no repositório.
