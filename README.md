# Green Pages (الصفحات الخضراء)

A comprehensive business directory system with geographic focus, built with modern technologies.

## Tech Stack

- **Backend**: NestJS 11 + PostgreSQL 17 + PostGIS 3.5 + Prisma 6 + Redis 7
- **Frontend**: Next.js 15 (App Router) + Tailwind CSS + Leaflet
- **Mobile**: Flutter
- **Infrastructure**: Docker + Coolify

## Project Structure

```
packages/
├── api/              # NestJS Backend API
├── prisma/           # Prisma schema and migrations
├── shared/           # Shared types and contracts
├── web-admin/        # Admin dashboard (Next.js)
├── web-directory/    # Public directory (Next.js)
├── mobile-agent/     # Agent app (Flutter)
└── mobile-user/      # User app (Flutter)
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop
- npm or yarn

### Setup

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Start Docker containers (PostgreSQL + Redis):
```bash
npm run docker:up
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Add PostGIS geography column (after migration):
```bash
cd packages/prisma
psql $DATABASE_URL -f scripts/add-geography.sql
```

7. Seed the database:
```bash
npm run prisma:seed -w @green-pages/prisma
```

8. Start the API server:
```bash
npm run api:dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="postgresql://greenpages:greenpages_dev@localhost:5432/greenpages"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
```

## Development

### API Server
```bash
npm run api:dev          # Start in watch mode
npm run api:test         # Run tests
```

### Web Directory
```bash
npm run web-directory:dev
```

### Web Admin
```bash
npm run web-admin:dev
```

### Database
```bash
npm run prisma:studio    # Open Prisma Studio
npm run prisma:migrate   # Run migrations
npm run prisma:generate  # Generate client
```

### Docker
```bash
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs
```

## License

UNLICENSED - Private project
