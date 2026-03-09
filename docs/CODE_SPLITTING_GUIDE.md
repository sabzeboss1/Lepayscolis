# Code Splitting Guide

## Vue d'ensemble

Ce guide décrit les stratégies de code splitting pour optimiser les performances de l'application LePaysExpressColis frontend.

## Stratégies de Code Splitting

### 1. Route-based Code Splitting

Next.js effectue automatiquement le code splitting par route. Chaque page dans `app/` est un point de split automatique.

✅ **Automatique - Aucune action requise**

```
app/
├── (app)/
│   ├── dashboard/page.tsx      → dashboard.js
│   ├── trips/search/page.tsx   → trips-search.js
│   └── messages/page.tsx       → messages.js
```

### 2. Component-based Code Splitting

Utilisez `dynamic()` pour lazy load les composants lourds.

#### Exemple: Modal Components

```tsx
import dynamic from 'next/dynamic';

// Lazy load modal (chargé uniquement quand ouvert)
const KYCReviewModal = dynamic(
  () => import('@/components/admin/KYCReviewModal'),
  {
    loading: () => <div>Loading...</div>,
    ssr: false, // Désactiver SSR si nécessaire
  }
);

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      {isOpen && <KYCReviewModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
```

#### Exemple: Charts et Visualisations

```tsx
import dynamic from 'next/dynamic';

// Lazy load chart library (lourd)
const LineChart = dynamic(
  () => import('@/components/admin/LineChart'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
    ssr: false, // Charts nécessitent window
  }
);

export default function Analytics() {
  return (
    <div>
      <h1>Analytics</h1>
      <LineChart data={data} />
    </div>
  );
}
```

### 3. Library Code Splitting

Lazy load les bibliothèques lourdes uniquement quand nécessaire.

#### Exemple: Rich Text Editor

```tsx
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
  () => import('react-quill').then((mod) => mod.default),
  {
    loading: () => <div>Loading editor...</div>,
    ssr: false,
  }
);

export default function MessageComposer() {
  return <RichTextEditor />;
}
```

#### Exemple: Date Picker

```tsx
import dynamic from 'next/dynamic';

const DatePicker = dynamic(
  () => import('react-datepicker'),
  {
    loading: () => <input type="date" />,
    ssr: false,
  }
);
```

## Composants à Lazy Load

### Modals et Dialogs

```tsx
// components/modals/index.ts
import dynamic from 'next/dynamic';

export const ConfirmDialog = dynamic(
  () => import('./ConfirmDialog'),
  { ssr: false }
);

export const KYCReviewModal = dynamic(
  () => import('./KYCReviewModal'),
  { ssr: false }
);

export const WithdrawalApprovalModal = dynamic(
  () => import('./WithdrawalApprovalModal'),
  { ssr: false }
);
```

### Charts et Graphiques

```tsx
// components/charts/index.ts
import dynamic from 'next/dynamic';

export const LineChart = dynamic(
  () => import('./LineChart'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
    ssr: false,
  }
);

export const BarChart = dynamic(
  () => import('./BarChart'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
    ssr: false,
  }
);

export const PieChart = dynamic(
  () => import('./PieChart'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
    ssr: false,
  }
);
```

### Rich Content Components

```tsx
// Markdown renderer
const MarkdownRenderer = dynamic(
  () => import('react-markdown'),
  {
    loading: () => <div>Loading content...</div>,
  }
);

// PDF viewer
const PDFViewer = dynamic(
  () => import('react-pdf'),
  {
    loading: () => <div>Loading PDF...</div>,
    ssr: false,
  }
);
```

## Meilleures Pratiques

### 1. Lazy Load Below-the-Fold Content

```tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'));

export default function Page() {
  const [showHeavy, setShowHeavy] = useState(false);
  
  useEffect(() => {
    // Load after initial render
    setShowHeavy(true);
  }, []);
  
  return (
    <div>
      <h1>Above the fold content</h1>
      {showHeavy && <HeavyComponent />}
    </div>
  );
}
```

### 2. Preload Critical Components

```tsx
import dynamic from 'next/dynamic';

const CriticalModal = dynamic(
  () => import('./CriticalModal'),
  {
    loading: () => <div>Loading...</div>,
  }
);

// Preload on hover
<button
  onMouseEnter={() => {
    import('./CriticalModal');
  }}
  onClick={() => setShowModal(true)}
>
  Open Modal
</button>
```

### 3. Group Related Components

```tsx
// ❌ MAUVAIS: Trop de splits
const Button = dynamic(() => import('./Button'));
const Input = dynamic(() => import('./Input'));
const Card = dynamic(() => import('./Card'));

// ✅ BON: Grouper les composants légers
import { Button, Input, Card } from '@/components/ui';

// ✅ BON: Split uniquement les composants lourds
const RichTextEditor = dynamic(() => import('./RichTextEditor'));
```

### 4. Utiliser Loading States

```tsx
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    ),
  }
);
```

## Analyse du Bundle

### Utiliser @next/bundle-analyzer

```bash
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... config
});
```

```bash
# Analyser le bundle
ANALYZE=true npm run build
```

### Métriques à surveiller

- **First Load JS**: < 100 KB (idéal)
- **Total Bundle Size**: Minimiser autant que possible
- **Shared Chunks**: Maximiser la réutilisation

## Exemples par Cas d'Usage

### Admin Dashboard

```tsx
// app/(admin)/admin/dashboard/page.tsx
import dynamic from 'next/dynamic';

// Lazy load charts (lourds)
const LineChart = dynamic(() => import('@/components/admin/LineChart'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
  ssr: false,
});

const BarChart = dynamic(() => import('@/components/admin/BarChart'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
  ssr: false,
});

export default function AdminDashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <LineChart data={data} />
      <BarChart data={data} />
    </div>
  );
}
```

### Messages Page

```tsx
// app/(app)/messages/page.tsx
import dynamic from 'next/dynamic';

// Lazy load emoji picker (lourd)
const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  {
    loading: () => null,
    ssr: false,
  }
);

export default function Messages() {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
        😊
      </button>
      {showEmojiPicker && <EmojiPicker />}
    </div>
  );
}
```

### KYC Verification

```tsx
// app/(app)/kyc/page.tsx
import dynamic from 'next/dynamic';

// Lazy load file upload component (lourd)
const FileUpload = dynamic(
  () => import('@/components/ui/FileUpload'),
  {
    loading: () => <div>Loading uploader...</div>,
  }
);

export default function KYCPage() {
  return (
    <div>
      <h1>KYC Verification</h1>
      <FileUpload />
    </div>
  );
}
```

## Checklist d'Optimisation

- [ ] Routes automatiquement split par Next.js
- [ ] Modals et dialogs lazy loaded
- [ ] Charts et visualisations lazy loaded
- [ ] Rich text editors lazy loaded
- [ ] Bibliothèques lourdes lazy loaded
- [ ] Loading states pour tous les composants lazy
- [ ] SSR désactivé pour composants client-only
- [ ] Bundle analyzer configuré
- [ ] Métriques de performance surveillées

## Outils de Monitoring

### Lighthouse

```bash
# Analyser les performances
npm run build
npm run start
# Ouvrir Chrome DevTools > Lighthouse
```

### Next.js Analytics

```javascript
// next.config.js
module.exports = {
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
  },
};
```

### Bundle Size Monitoring

```bash
# Comparer les tailles de bundle
npm run build
# Vérifier .next/analyze/
```

## Ressources

- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [React.lazy](https://react.dev/reference/react/lazy)
- [Code Splitting Best Practices](https://web.dev/code-splitting-suspense/)

