# 🚀 ImobiFlow

> **SaaS de Gestão Imobiliária de Alta Performance** | Dark Mode, Gamification & Automation.

O **ImobiFlow** é uma plataforma SaaS (Software as a Service) desenvolvida para imobiliárias que buscam maximizar vendas e engajamento da equipe através de gamificação e automação.

## ✨ Funcionalidades Principais

*   **🏆 Rankings e Gamificação**: Acompanhe o desempenho dos corretores em tempo real com pódios e metas anuais.
*   **💰 Gestão Financeira Avançada**: Controle de comissões, cálculo automático de repasses e despesas de venda.
*   **📱 Integração WhatsApp (Nativa)**:
    *   Envio automático de notificações de venda no grupo da empresa.
    *   Chat de suporte/venda direto na plataforma.
    *   QRCode integrado para conexão simples.
*   **📺 TV Mode**: Dashboard exclusivo para TVs nas salas de vendas, focada em motivação visual (Leaderboard).
*   **🏢 Multi-Tenant**: Arquitetura pronta para SaaS, atendendo múltiplas imobiliárias com isolamento de dados.
*   **🎨 UI Premium**: Interface Dark Mode moderna, com efeitos de neon e animações fluidas (Tailwind CSS + Framer Motion).

## 🛠️ Stack Tecnológica

O projeto utiliza as tecnologias mais modernas do ecossistema React/Node:

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Server Actions)
*   **Linguagem**: TypeScript
*   **Estilização**: Tailwind CSS v4 + Lucide Icons + Shadcn/UI
*   **Banco de Dados**: PostgreSQL (Neon Serverless)
*   **ORM**: Drizzle ORM (Type-safe SQL)
*   **Autenticação**: NextAuth.js v5 (Auth.js)
*   **Automação**: `whatsapp-web.js` + Puppeteer (Backend-side)
*   **Deploy**: Compatível com Railway / Docker.

## 🚀 Como Rodar Localmente

### Pré-requisitos
*   Node.js (v18+)
*   NPM ou PNPM
*   Banco de Dados PostgreSQL (Local ou Neon)

### Instalação

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/seu-usuario/imobiflow.git
    cd imobiflow
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    # Instale dependências de sistema para o Puppeteer (se necessário no Linux)
    ```

3.  **Configure as Variáveis de Ambiente**:
    Crie um arquivo `.env` na raiz baseado no exemplo abaixo:
    ```env
    DATABASE_URL="postgresql://user:pass@host/db"
    NEXTAUTH_SECRET="sua-chave-secreta"
    NEXTAUTH_URL="http://localhost:3000"
    ```

4.  **Execute as Migrations**:
    ```bash
    npm run migrate:prod
    ```

5.  **Inicie o Servidor de Desenvolvimento**:
    ```bash
    npm run dev
    ```

6.  **Acesse**:
    Abra [http://localhost:3000](http://localhost:3000).

## 🐳 Docker & Deploy (Railway)

O projeto está configurado para deploy "zero-config" no Railway, detectando automaticamente o Next.js.
Para o WhatsApp funcionar em produção, certifique-se de configurar as variáveis de ambiente do Puppeteer adequadas (ex: `PUPPETEER_EXECUTABLE_PATH`).

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request para discutir mudanças maiores.

---

© 2025 ImobiFlow SaaS. Todos os direitos reservados.
