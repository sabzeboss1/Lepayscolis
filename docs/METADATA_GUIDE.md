# Metadata Guide

## Vue d'ensemble

Ce guide décrit comment ajouter et gérer les métadonnées pour toutes les pages de l'application LePaysExpressColis frontend.

## Structure des Métadonnées

### Métadonnées de Base

Chaque page doit avoir:
- **title**: Titre de la page (50-60 caractères)
- **description**: Description de la page (150-160 caractères)
- **keywords**: Mots-clés pertinents (optionnel)
- **openGraph**: Métadonnées pour partage social
- **twitter**: Métadonnées pour Twitter

### Exemple Complet

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rechercher des Voyages | LePaysExpressColis',
  description: 'Trouvez des voyageurs de confiance pour livrer vos colis entre la Russie et l\'Afrique. Livraison sécurisée et abordable.',
  keywords: ['livraison colis', 'Russie Afrique', 'voyageurs', 'envoi colis'],
  openGraph: {
    title: 'Rechercher des Voyages | LePaysExpressColis',
    description: 'Trouvez des voyageurs de confiance pour livrer vos colis',
    url: 'https://lepaysexpresscolis.com/trips/search',
    siteName: 'LePaysExpressColis',
    images: [
      {
        url: 'https://lepaysexpresscolis.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LePaysExpressColis',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rechercher des Voyages | LePaysExpressColis',
    description: 'Trouvez des voyageurs de confiance pour livrer vos colis',
    images: ['https://lepaysexpresscolis.com/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

## Métadonnées par Type de Page

### Pages Publiques

#### Home Page

```typescript
export const metadata: Metadata = {
  title: 'LePaysExpressColis - Livraison de Colis Russie ↔ Afrique',
  description: 'Envoyez des colis entre la Russie et l\'Afrique avec des voyageurs de confiance. Service sécurisé, abordable et communautaire.',
  keywords: ['livraison colis', 'Russie Afrique', 'envoi colis', 'voyageurs', 'communauté'],
  openGraph: {
    title: 'LePaysExpressColis - Livraison de Colis Communautaire',
    description: 'Connectez-vous avec des voyageurs pour une livraison sécurisée',
    url: 'https://lepaysexpresscolis.com',
    siteName: 'LePaysExpressColis',
    images: ['/og-home.jpg'],
    locale: 'fr_FR',
    type: 'website',
  },
};
```

#### How It Works

```typescript
export const metadata: Metadata = {
  title: 'Comment Ça Marche | LePaysExpressColis',
  description: 'Découvrez comment envoyer ou livrer des colis entre la Russie et l\'Afrique en toute sécurité avec notre plateforme communautaire.',
  openGraph: {
    title: 'Comment Ça Marche | LePaysExpressColis',
    description: 'Guide complet pour envoyer et livrer des colis',
    url: 'https://lepaysexpresscolis.com/how-it-works',
  },
};
```

#### Security & Trust

```typescript
export const metadata: Metadata = {
  title: 'Sécurité et Confiance | LePaysExpressColis',
  description: 'Vérification KYC, paiement sécurisé en escrow, et système de notation pour garantir la sécurité de vos envois.',
  openGraph: {
    title: 'Sécurité et Confiance | LePaysExpressColis',
    description: 'Découvrez nos mesures de sécurité',
    url: 'https://lepaysexpresscolis.com/security',
  },
};
```

#### Destinations

```typescript
export const metadata: Metadata = {
  title: 'Destinations Russie ↔ Afrique | LePaysExpressColis',
  description: 'Explorez les routes populaires entre la Russie et l\'Afrique. Moscou, Saint-Pétersbourg, Dakar, Abidjan, Douala et plus.',
  openGraph: {
    title: 'Destinations | LePaysExpressColis',
    description: 'Routes populaires Russie ↔ Afrique',
    url: 'https://lepaysexpresscolis.com/destinations',
  },
};
```

#### FAQ

```typescript
export const metadata: Metadata = {
  title: 'FAQ - Questions Fréquentes | LePaysExpressColis',
  description: 'Trouvez des réponses aux questions fréquentes sur l\'envoi de colis, les tarifs, la sécurité et plus encore.',
  openGraph: {
    title: 'FAQ | LePaysExpressColis',
    description: 'Questions fréquentes et réponses',
    url: 'https://lepaysexpresscolis.com/faq',
  },
};
```

### Pages Authentifiées

#### Dashboard

```typescript
export const metadata: Metadata = {
  title: 'Tableau de Bord | LePaysExpressColis',
  description: 'Gérez vos voyages, envois et messages sur votre tableau de bord personnel.',
  robots: {
    index: false, // Ne pas indexer les pages privées
    follow: false,
  },
};
```

#### Trip Search

```typescript
export const metadata: Metadata = {
  title: 'Rechercher des Voyages | LePaysExpressColis',
  description: 'Trouvez des voyageurs disponibles pour livrer vos colis entre la Russie et l\'Afrique.',
  robots: {
    index: false,
    follow: false,
  },
};
```

#### My Trips

```typescript
export const metadata: Metadata = {
  title: 'Mes Voyages | LePaysExpressColis',
  description: 'Gérez vos voyages publiés et suivez vos livraisons en cours.',
  robots: {
    index: false,
    follow: false,
  },
};
```

#### Messages

```typescript
export const metadata: Metadata = {
  title: 'Messages | LePaysExpressColis',
  description: 'Communiquez avec les voyageurs et expéditeurs pour coordonner vos livraisons.',
  robots: {
    index: false,
    follow: false,
  },
};
```

## Métadonnées Dynamiques

### Page de Détail de Voyage

```typescript
import { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Fetch trip data
  const trip = await getTrip(params.id);
  
  return {
    title: `${trip.departure.city} → ${trip.arrival.city} | LePaysExpressColis`,
    description: `Voyage de ${trip.traveler.name} de ${trip.departure.city} à ${trip.arrival.city}. ${trip.availableCapacity}kg disponible à ${trip.pricePerKg}€/kg.`,
    openGraph: {
      title: `${trip.departure.city} → ${trip.arrival.city}`,
      description: `${trip.availableCapacity}kg disponible`,
      images: [trip.traveler.avatar],
    },
  };
}
```

### Page de Profil Utilisateur

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getUser(params.id);
  
  return {
    title: `${user.name} | LePaysExpressColis`,
    description: `Profil de ${user.name}. Note: ${user.rating}/5 ⭐ - ${user.completedDeliveries} livraisons réussies.`,
    openGraph: {
      title: user.name,
      description: `Note: ${user.rating}/5 ⭐`,
      images: [user.avatar],
    },
  };
}
```

## Métadonnées Globales

### Root Layout

```typescript
// app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://lepaysexpresscolis.com'),
  title: {
    default: 'LePaysExpressColis - Livraison de Colis Communautaire',
    template: '%s | LePaysExpressColis',
  },
  description: 'Plateforme communautaire de livraison de colis entre la Russie et l\'Afrique',
  keywords: ['livraison colis', 'Russie', 'Afrique', 'voyageurs', 'communauté'],
  authors: [{ name: 'LePaysExpressColis' }],
  creator: 'LePaysExpressColis',
  publisher: 'LePaysExpressColis',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://lepaysexpresscolis.com',
    siteName: 'LePaysExpressColis',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'LePaysExpressColis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lepaysexpresscolis',
    creator: '@lepaysexpresscolis',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};
```

## Favicon et Icons

### Fichiers Requis

```
public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── android-chrome-192x192.png
├── android-chrome-512x512.png
└── site.webmanifest
```

### site.webmanifest

```json
{
  "name": "LePaysExpressColis",
  "short_name": "LePaysExpressColis",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

## Open Graph Images

### Dimensions Recommandées

- **Facebook/LinkedIn**: 1200 x 630 px
- **Twitter**: 1200 x 675 px
- **Instagram**: 1080 x 1080 px

### Création d'Images OG

```typescript
// app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'LePaysExpressColis';
  
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          fontSize: 60,
          color: 'white',
          background: 'linear-gradient(to bottom, #3b82f6, #f97316)',
          width: '100%',
          height: '100%',
          padding: '50px 80px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {title}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

## Checklist de Métadonnées

### Pour Chaque Page

- [ ] Title unique et descriptif (50-60 caractères)
- [ ] Description unique et engageante (150-160 caractères)
- [ ] Keywords pertinents (optionnel)
- [ ] OpenGraph title et description
- [ ] OpenGraph image (1200x630)
- [ ] Twitter card metadata
- [ ] Robots meta (index/noindex)
- [ ] Canonical URL

### Global

- [ ] Favicon (16x16, 32x32)
- [ ] Apple touch icon (180x180)
- [ ] Android chrome icons (192x192, 512x512)
- [ ] site.webmanifest
- [ ] Default OG image
- [ ] metadataBase configuré

## Outils de Validation

### Meta Tags Validator

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### SEO Tools

- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Lighthouse SEO Audit](https://developers.google.com/web/tools/lighthouse)

## Meilleures Pratiques

### Title

- Unique pour chaque page
- 50-60 caractères
- Inclure le nom du site
- Mots-clés au début

### Description

- Unique pour chaque page
- 150-160 caractères
- Appel à l'action
- Résumé du contenu

### Keywords

- 5-10 mots-clés pertinents
- Pas de keyword stuffing
- Variantes et synonymes

### Images

- Dimensions correctes (1200x630)
- Texte lisible
- Branding cohérent
- Optimisées (< 300 KB)

## Ressources

- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)

