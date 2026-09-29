# Progree Full-Stack Internship Submission

Work by **Omar Mohamed Aly** for the Progree Remote Internship Program.

- GitHub: https://github.com/Frehshi/Progree-Full-stack-internship/
- LinkedIn announcement: https://lnkd.in/p/ezSQn6P2

This repository contains all four internship tasks:

1. LinkedIn announcement materials and report.
2. A responsive portfolio at `/`.
3. A full-stack CRUD task dashboard at `/tasks`.
4. A secure e-commerce sandbox at `/shop`.

## Quick start

Requirements: Node.js 22 or newer.

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:4000`.

Demo account:

- Email: `demo@progree.local`
- Password: `Demo123!`

## Quality checks

```bash
npm run check
```

## Stripe test mode

The project works immediately with its built-in local checkout sandbox. To exercise Stripe-hosted Checkout instead, set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env`, then forward Stripe test webhooks to:

```text
http://localhost:4000/api/checkout/webhook
```

The integration uses Checkout Sessions. Inventory changes only after a verified completed checkout event. Never use live keys for this internship demo.

## Submission files

- Final combined report: `output/pdf/Progree_Full_Stack_Internship_Report.pdf`
- Editable task reports: `reports/`
- Generated design concepts: `design/concepts/`
