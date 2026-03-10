# 🐾 Find My Pet

Plataforma de identificação e localização de pets via QR Code personalizado.

## Features

- **Perfil digital do pet** — QR Code vinculado a uma página pública com foto, descrição e dados de contato
- **QR Code customizável** — Cores, estilos de dots, logotipo embutido (Premium/Pro)
- **Cartaz de pet perdido** — Geração 100% gratuita de cartazes prontos para impressão ou compartilhamento digital
- **Tags físicas** — Plaquinhas QR/NFC para coleira (loja integrada)
- **Afiliados** — Planos de saúde animal e produtos pet com links de indicação
- **3 planos** — Free, Premium e Pro

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend + Backend | Next.js 15 (App Router, TypeScript) |
| Database | PostgreSQL 16 + Prisma ORM |
| Storage | MinIO (S3-compatible) + Sharp |
| Cache / Queue | Redis + BullMQ |
| Auth | Auth.js (NextAuth v5) + Google OAuth |
| Payments | Asaas (BR) + Stripe (International) |
| i18n | next-intl (PT-BR + EN) |
| PDF | @react-pdf/renderer |
| QR Code | qr-code-styling + qrcode |
| Deploy | Docker Compose on Proxmox (LXC) |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### Development

```bash
# Clone
git clone https://github.com/oapache/find-my-pet.git
cd find-my-pet

# Install dependencies
npm install

# Copy env
cp .env.example .env.local

# Start infrastructure (DB, MinIO, Redis)
docker compose -f docker-compose.dev.yml up -d

# Run Prisma migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker (Production)

```bash
docker compose up -d --build
```

## Branch Strategy (Git Flow)

| Branch | Purpose |
|--------|---------|
| `main` | Produção — só recebe merges de `develop` via PR |
| `develop` | Integração — base para features |
| `feature/*` | Funcionalidades individuais |
| `hotfix/*` | Correções urgentes em produção |

## License

MIT
