# ArenaFlow

**Sistema de gestão para arenas esportivas** — desenvolvido com Angular 17 e Tailwind CSS.

Gerencie quadras, reservas, clientes, mensalistas, promoções e relatórios em um painel moderno e responsivo.

**Demo ao vivo:** [arenaflow-alpha.vercel.app](https://arenaflow-alpha.vercel.app)

---

## Funcionalidades

- **Dashboard** — KPIs em tempo real: reservas do dia, receita diária/mensal, clientes cadastrados, faturamento dos últimos 7 dias e horários mais populares
- **Agendamentos** — visualização e controle de todos os agendamentos
- **Quadras** — cadastro e gerenciamento das quadras (nome, esporte, valor/hora, status)
- **Reservas** — criação e acompanhamento de reservas com status de pagamento
- **Clientes** — cadastro de clientes e histórico de reservas
- **Mensalistas** — controle de planos mensais
- **Promoções** — gestão de promoções e descontos
- **Relatórios** — visão consolidada com gráficos (ApexCharts)
- **Perfil** — configurações da arena

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Angular | 17 | Framework principal |
| Tailwind CSS | 3 | Estilização |
| Firebase | 11 | Autenticação |
| ApexCharts | 3 | Gráficos |
| TypeScript | 5.4 | Linguagem |

---

## Autenticação

O ArenaFlow usa **Firebase Authentication** com login via **Google OAuth 2.0**.

### Como funciona

1. O usuário acessa qualquer rota do app
2. O `AuthGuard` verifica se há uma sessão ativa no Firebase
3. Se não estiver autenticado, é redirecionado para `/login`
4. Na tela de login, ao clicar em "Entrar com Google", abre um popup do Google para seleção de conta
5. Após autenticação, o Firebase retorna o `User` com nome, email e foto
6. O avatar e o email do usuário são exibidos no rodapé da sidebar
7. O botão "Sair" encerra a sessão via `signOut()` e redireciona para `/login`

### Serviços envolvidos

- **`AuthService`** (`src/app/services/auth.service.ts`) — encapsula `signInWithPopup`, `signOut` e `onAuthStateChanged`, expondo o usuário atual via Angular `signal`
- **`AuthGuard`** (`src/app/guards/auth.guard.ts`) — guard funcional que protege todas as rotas filhas do layout
- **`firebase.config.ts`** (`src/app/firebase.config.ts`) — inicializa o app Firebase e exporta a instância de `Auth`

### Configuração do Firebase

O projeto está vinculado ao Firebase Console em:
[console.firebase.google.com/project/arenaflow-f0dac](https://console.firebase.google.com/project/arenaflow-f0dac)

> Para que o login funcione em outros domínios, adicione o domínio em **Authentication → Settings → Authorized domains** no Firebase Console.

---

## Deploy

O projeto é hospedado na **Vercel** com deploy contínuo a partir deste repositório.

- **URL de produção:** [arenaflow-alpha.vercel.app](https://arenaflow-alpha.vercel.app)
- **Dashboard Vercel:** [vercel.com/b3r1us-projects/arenaflow](https://vercel.com/b3r1us-projects/arenaflow)

Cada push na branch `master` dispara um novo deploy automático na Vercel.

---

## Como rodar localmente

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento (http://localhost:4200)
npm start

# Build de produção
npm run build
```

---

## Estrutura

```
src/
├── app/
│   ├── firebase.config.ts   # Inicialização do Firebase
│   ├── layout/              # Layout principal com sidebar e navegação
│   ├── models/              # Interfaces e tipos (Court, Booking, Client...)
│   ├── guards/              # AuthGuard — proteção de rotas
│   ├── pages/               # Páginas da aplicação
│   │   ├── login/           # Tela de login com Google
│   │   ├── dashboard/
│   │   ├── agendamentos/
│   │   ├── quadras/
│   │   ├── reservas/
│   │   ├── clientes/
│   │   ├── mensalistas/
│   │   ├── promocoes/
│   │   ├── relatorios/
│   │   └── perfil/
│   └── services/            # AuthService, DataService, ProfileService, ToastService
└── styles.css               # Design system com variáveis CSS
```

---

## Licença

MIT
