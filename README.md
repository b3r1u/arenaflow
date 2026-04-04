# ArenaFlow

**Sistema de gestão para arenas esportivas** — desenvolvido com Angular 17 e Tailwind CSS.

Gerencie quadras, reservas, clientes, mensalistas, promoções e relatórios em um painel moderno e responsivo.

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

| Tecnologia | Versão |
|---|---|
| Angular | 17 |
| Tailwind CSS | 3 |
| ApexCharts | 3 |
| Lucide Angular | 1 |
| TypeScript | 5.4 |

---

## Como rodar

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
│   ├── layout/          # Layout principal com sidebar e navegação
│   ├── models/          # Interfaces e tipos (Court, Booking, Client...)
│   ├── pages/           # Páginas da aplicação
│   │   ├── dashboard/
│   │   ├── agendamentos/
│   │   ├── quadras/
│   │   ├── reservas/
│   │   ├── clientes/
│   │   ├── mensalistas/
│   │   ├── promocoes/
│   │   ├── relatorios/
│   │   └── perfil/
│   └── services/        # DataService, ProfileService, ToastService
└── styles.css           # Design system com variáveis CSS
```

---

## Licença

MIT
