# NexaBank — Next.js Banking App

A fully functional, production-grade banking web application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Lucide React** icons.

## 🏦 Features

### User Features
- **Dashboard** — Live balance card, quick actions, savings goal, spending summary
- **Checking Account** — Full account details (routing, account #, card, KYC), monthly summary
- **Deposit** — Bank transfer, debit/credit card, crypto (BTC/ETH/USDT/BNB/SOL + QR + wallet address copy), PayPal
- **Withdraw** — ACH/Wire toggle, debit card, crypto withdrawal with fee breakdown
- **Transfer** — Send money to any user, live balance deduction, success animation
- **Transaction History** — Filter by type, search, paginated (10/page), export
- **Profile** — Edit info, 2FA toggle, linked methods, notifications

### Admin Panel (`/admin`)
- **Dashboard** — System-wide stats, all recent transactions
- **User Management** — View/adjust balances, suspend/activate accounts
- **Transaction Management** — Approve/reject/fail pending transactions, add manual credits/debits
- **App Customization** — Live rename app, change accent + sidebar colors (color picker + presets), dark mode toggle, logo upload
- **Notifications** — Send messages to specific users or all users, notification history

### Design
- **Zero gradients** — Flat, solid color throughout
- **60/30/10 color rule** — Background / Sidebar / Accent
- **CSS variables** — Instant global theme updates
- **DM Sans + DM Mono** typography
- **Lucide React** icons throughout

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it will redirect to `/dashboard`.

## 📁 Project Structure

```
nexabank/
├── app/
│   ├── dashboard/         # Main dashboard
│   ├── account/           # Checking account details
│   ├── deposit/           # Deposit funds
│   ├── withdraw/          # Withdraw funds
│   ├── transfer/          # Send money
│   ├── history/           # Transaction history
│   ├── profile/           # User profile
│   └── admin/
│       ├── page.tsx        # Admin dashboard
│       ├── users/          # User management
│       ├── transactions/   # Transaction management
│       ├── settings/       # App customization
│       └── notifications/  # Send notifications
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx    # Sidebar + topbar
│   │   └── ThemeInjector.tsx
│   ├── ui/
│   │   ├── index.tsx       # Card, Button, Badge, Input, etc.
│   │   └── Toast.tsx
│   └── shared/
│       └── TxRow.tsx       # Transaction row component
├── store/
│   └── index.tsx           # Global state (useReducer + Context)
└── lib/
    └── utils.ts            # Formatting helpers
```

## 🎨 Theme Customization

Go to **Admin → App Customization** to:
- Rename the app (updates sidebar instantly)
- Upload a logo
- Change accent color (10% — buttons, highlights)
- Change sidebar/primary color (30%)
- Toggle dark mode

All changes are applied via CSS variables and reflected immediately everywhere.

## ⚡ Technical Notes

- **Single state store** — `useReducer` + React Context (no Redux, no Zustand)
- **No localStorage** — All state in memory
- **Next.js App Router** — Each route is a page component
- **Type-safe** — Full TypeScript throughout
- **No external UI library** — All components hand-built
