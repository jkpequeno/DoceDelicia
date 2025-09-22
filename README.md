# Visão Geral

Este é um aplicativo brasileiro de e-commerce de cupcakes chamado **"Doce Delícia"**, desenvolvido com **React** no frontend e **Express.js** no backend.  
O aplicativo permite que os clientes naveguem pelos cupcakes por categoria, adicionem itens ao carrinho, gerenciem favoritos e façam pedidos.  
Ele conta com **autenticação via Replit Auth**, **design responsivo** usando componentes **shadcn/ui** e um **banco de dados PostgreSQL** para persistência de dados.

# Preferências do Usuário

Estilo de comunicação preferido: Linguagem simples e do dia a dia.

# Arquitetura do Sistema

## Arquitetura do Frontend
- **Framework**: React 18 com TypeScript e Vite para desenvolvimento e build
- **Roteamento**: Wouter para roteamento no lado do cliente com proteção de rotas baseada em autenticação
- **Gerenciamento de Estado**: React Context API para gerenciamento do estado do carrinho combinado com TanStack Query para estado do servidor
- **Componentes de UI**: Biblioteca shadcn/ui com Radix UI para acessibilidade
- **Estilização**: Tailwind CSS com variáveis de CSS personalizadas para temas, com um esquema de cores rosa/tema de cupcake
- **Formulários**: React Hook Form com validação Zod para manipulação de formulários com segurança de tipos

## Arquitetura do Backend
- **Framework**: Express.js com TypeScript rodando em Node.js
- **ORM de Banco de Dados**: Drizzle ORM para operações de banco de dados com segurança de tipos
- **Design da API**: API RESTful com organização baseada em rotas retornando respostas em JSON
- **Gerenciamento de Sessões**: Express sessions com armazenamento de sessão em PostgreSQL para persistência
- **Servidor de Desenvolvimento**: Integração personalizada com Vite para hot module replacement durante o desenvolvimento

## Armazenamento de Dados
- **Banco de Dados Primário**: PostgreSQL via Neon Database com connection pooling
- **Gerenciamento de Schema**: Migrações Drizzle para versionamento do schema do banco de dados
- **Armazenamento de Sessão**: Tabela PostgreSQL para persistência de sessões do Express (necessário para Replit Auth)
- **Schema do Banco de Dados**:
  - Tabela de usuários (necessária para integração com Replit Auth)
  - Produtos com categorias, preços e estoque
  - Itens do carrinho vinculados a usuários autenticados
  - Pedidos e itens de pedido para histórico de compras
  - Sistema de favoritos para preferências dos usuários

## Autenticação e Autorização
- **Provedor**: Integração Replit Auth com OpenID Connect
- **Gerenciamento de Sessões**: Express sessions com configuração de cookies seguros
- **Rotas Protegidas**: Proteção de rotas no backend baseada em middleware
- **Gerenciamento de Usuários**: Criação/atualização automática de usuários via claims do Replit Auth
- **Fluxo de Autorização**: OAuth 2.0 com PKCE via provedor de identidade do Replit

# Dependências Externas

## Infraestrutura Principal
- **Banco de Dados**: Neon Database (PostgreSQL) para armazenamento primário de dados
- **Autenticação**: Serviço Replit Auth para gerenciamento de identidade de usuários
- **Hospedagem**: Projetado para ambiente de implantação no Replit

## Ferramentas de Desenvolvimento
- **Integrações do Replit**: Plugins Cartographer e dev banner para o ambiente Replit
- **Tratamento de Erros**: Overlay de erros em tempo de execução para depuração no desenvolvimento
- **Ferramentas de Build**: ESBuild para empacotamento do servidor e Vite para empacotamento do cliente

## UI e Estilo
- **Biblioteca de Componentes**: Radix UI para componentes acessíveis
- **Ícones**: Lucide React para iconografia consistente
- **Fontes**: Integração Google Fonts (Architects Daughter, Source Code Pro)
- **Hospedagem de Imagens**: Unsplash para imagens de produtos e da página inicial

## Dados e API
- **Gerenciamento de Consultas**: TanStack Query para cache e sincronização do estado do servidor
- **Validação**: Zod para validação de tipos em tempo de execução e definição de schemas
- **Manipulação de Datas**: date-fns para manipulação e formatação de datas
- **Utilitários**: clsx e tailwind-merge para estilização condicional
