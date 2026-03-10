---
description: How to start and develop on the LePaysExpressColis frontend
---

# LePaysExpressColis Frontend Workflow

## Prerequisites
- Node.js 18+ installed
- npm or yarn

## Quick Start

// turbo
1. Navigate to the frontend directory:
```bash
cd c:\laragon\www\Lepayscolis\lepaysexpresscolis-frontend
```

// turbo
2. Install dependencies (if needed):
```bash
npm install
```

// turbo
3. Start the development server:
```bash
npm run dev
```

4. Open in browser: http://localhost:3000

---

## Demo Accounts

| Email | Password | Role | KYC Status |
|-------|----------|------|------------|
| `demo@lepaysexpresscolis.com` | demo123 | Traveler (Recommended) | Approved |
| `traveler@lepaysexpresscolis.com` | demo123 | Traveler | Approved |
| `sender@lepaysexpresscolis.com` | demo123 | Sender | Approved |
| `newuser@lepaysexpresscolis.com` | demo123 | New User (with demo data) | Rejected |

**Recommended for testing:** Use `newuser@lepaysexpresscolis.com` - has demo trips and messages.

---

## Project Structure

```
app/
├── (app)/              # Authenticated pages (requires login)
│   ├── dashboard/      # Main user dashboard
│   ├── trips/          # Trip management (search, new, my, [id])
│   ├── shipments/      # Shipment management (new, my, [id])
│   ├── messages/       # Chat/conversations
│   ├── kyc/            # KYC document upload
│   ├── profile/        # User profile & settings
│   └── layout.tsx      # App layout with header
├── (public)/           # Public pages (no auth required)
│   ├── page.tsx        # Home/landing page
│   ├── login/          # Login page
│   └── register/       # Registration page
├── api/                # Mock API routes
│   ├── auth/           # Authentication (login, logout, me, register)
│   ├── trips/          # Trip CRUD
│   ├── shipments/      # Shipment CRUD
│   ├── messages/       # Messages & conversations
│   └── kyc/            # KYC document handling
components/
├── layout/             # Header, Footer, etc.
└── ui/                 # Reusable UI components (Button, Card, Input, etc.)
lib/
├── api/mockData.ts     # Mock data for development
├── auth/               # Authentication context & hooks
├── i18n/               # Internationalization (fr/en)
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

---

## Key Commands

// turbo
### Development Server
```bash
npm run dev
```

// turbo
### Build for Production
```bash
npm run build
```

// turbo
### Run Tests
```bash
npm test
```

// turbo
### Lint Code
```bash
npm run lint
```

---

## Adding Mock Data

Edit `lib/api/mockData.ts` to add:
- New demo users
- Demo trips for specific users
- Demo messages/conversations

The data is linked by user IDs (e.g., `demo-user-4` for newuser account).

---

## Common Issues

### Login Not Working
- Check `app/api/auth/login/route.ts` - ensure user exists in `mockPasswords`

### 404 on Pages
- Ensure page.tsx exists in the route folder
- Check if page uses `'use client'` directive if it needs client-side features

### Hydration Errors
- Usually caused by browser extensions (ColorZilla, React DevTools, etc.)
- Test in incognito mode to confirm

---

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **React Context** - State management (Auth)
- **Faker.js** - Mock data generation
