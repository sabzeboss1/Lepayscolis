# Image Optimization Guide

## Vue d'ensemble

Ce guide décrit les meilleures pratiques pour l'optimisation des images dans l'application LePaysExpressColis frontend.

## Composant OptimizedImage

Utilisez toujours le composant `OptimizedImage` au lieu de `next/image` directement pour bénéficier des optimisations par défaut.

### Exemple d'utilisation

```tsx
import { OptimizedImage } from '@/components/ui/OptimizedImage';

// Image above the fold (prioritaire)
<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero section"
  width={1200}
  height={600}
  priority={true}
/>

// Image below the fold (lazy loading)
<OptimizedImage
  src="/images/feature.jpg"
  alt="Feature description"
  width={800}
  height={400}
  priority={false}
/>
```

## Meilleures pratiques

### 1. Utiliser next/image pour toutes les images

✅ **BON:**
```tsx
<OptimizedImage src="/avatar.jpg" alt="User avatar" width={100} height={100} />
```

❌ **MAUVAIS:**
```tsx
<img src="/avatar.jpg" alt="User avatar" />
```

### 2. Toujours spécifier width et height

✅ **BON:**
```tsx
<OptimizedImage 
  src="/logo.png" 
  alt="Logo" 
  width={200} 
  height={50} 
/>
```

❌ **MAUVAIS:**
```tsx
<OptimizedImage src="/logo.png" alt="Logo" />
```

### 3. Utiliser priority pour les images above-the-fold

✅ **BON:**
```tsx
// Hero image visible immédiatement
<OptimizedImage 
  src="/hero.jpg" 
  alt="Hero" 
  width={1200} 
  height={600}
  priority={true}
/>
```

❌ **MAUVAIS:**
```tsx
// Hero image avec lazy loading (mauvais LCP)
<OptimizedImage 
  src="/hero.jpg" 
  alt="Hero" 
  width={1200} 
  height={600}
/>
```

### 4. Utiliser des tailles appropriées

```tsx
// Avatar utilisateur
<OptimizedImage 
  src={user.avatar} 
  alt={user.name}
  width={48}
  height={48}
  className="rounded-full"
/>

// Card image
<OptimizedImage 
  src={trip.image} 
  alt={trip.title}
  width={400}
  height={300}
/>

// Hero image
<OptimizedImage 
  src="/hero.jpg" 
  alt="Hero"
  width={1920}
  height={1080}
  priority={true}
/>
```

### 5. Utiliser fill pour les images responsive

```tsx
<div className="relative w-full h-64">
  <OptimizedImage
    src="/background.jpg"
    alt="Background"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

## Configuration Next.js

### next.config.js

```javascript
module.exports = {
  images: {
    domains: [
      'cdn.lepaysexpresscolis.com',
      'storage.googleapis.com',
      // Ajoutez d'autres domaines autorisés
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

## Formats d'image

### Formats supportés (par ordre de préférence)

1. **AVIF** - Meilleure compression, support moderne
2. **WebP** - Bonne compression, large support
3. **JPEG/PNG** - Fallback pour anciens navigateurs

Next.js génère automatiquement les formats optimaux selon le navigateur.

## Lazy Loading

### Par défaut (recommandé)

```tsx
// Lazy loading automatique pour images below-the-fold
<OptimizedImage 
  src="/feature.jpg" 
  alt="Feature"
  width={800}
  height={600}
/>
```

### Désactiver le lazy loading

```tsx
// Pour images above-the-fold uniquement
<OptimizedImage 
  src="/hero.jpg" 
  alt="Hero"
  width={1200}
  height={600}
  priority={true}
/>
```

## Placeholder Blur

### Avec blur data URL personnalisé

```tsx
<OptimizedImage 
  src="/photo.jpg" 
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>
```

### Avec blur par défaut

```tsx
// OptimizedImage fournit un placeholder gris par défaut
<OptimizedImage 
  src="/photo.jpg" 
  alt="Photo"
  width={800}
  height={600}
/>
```

## Responsive Images

### Utiliser sizes pour images responsive

```tsx
<OptimizedImage 
  src="/banner.jpg" 
  alt="Banner"
  width={1200}
  height={400}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Breakpoints communs

```tsx
// Mobile: 100% de la largeur
// Tablet: 50% de la largeur
// Desktop: 33% de la largeur
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
```

## Performance Metrics

### Objectifs

- **LCP (Largest Contentful Paint)**: < 2.5s
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID (First Input Delay)**: < 100ms

### Optimisations pour LCP

1. Utiliser `priority={true}` pour l'image LCP
2. Précharger les images critiques
3. Utiliser des CDN pour les images
4. Optimiser la taille des images

### Optimisations pour CLS

1. Toujours spécifier width et height
2. Utiliser aspect-ratio CSS
3. Réserver l'espace pour les images

## Checklist d'optimisation

- [ ] Toutes les images utilisent OptimizedImage ou next/image
- [ ] Width et height spécifiés pour toutes les images
- [ ] priority={true} pour les images above-the-fold
- [ ] Lazy loading pour les images below-the-fold
- [ ] Formats modernes (AVIF, WebP) configurés
- [ ] Domaines externes ajoutés à next.config.js
- [ ] Sizes appropriées pour images responsive
- [ ] Placeholder blur pour meilleure UX
- [ ] Alt text descriptif pour accessibilité

## Exemples par cas d'usage

### Avatar utilisateur

```tsx
<OptimizedImage
  src={user.avatar}
  alt={`${user.name} avatar`}
  width={48}
  height={48}
  className="rounded-full"
/>
```

### Card image

```tsx
<OptimizedImage
  src={trip.image}
  alt={trip.title}
  width={400}
  height={300}
  className="rounded-lg"
/>
```

### Hero image

```tsx
<OptimizedImage
  src="/hero.jpg"
  alt="Welcome to LePaysExpressColis"
  width={1920}
  height={1080}
  priority={true}
  className="w-full h-auto"
/>
```

### Background image

```tsx
<div className="relative w-full h-96">
  <OptimizedImage
    src="/background.jpg"
    alt="Background"
    fill
    style={{ objectFit: 'cover' }}
    priority={true}
  />
</div>
```

### Logo

```tsx
<OptimizedImage
  src="/logo.svg"
  alt="LePaysExpressColis"
  width={200}
  height={50}
  priority={true}
/>
```

## Ressources

- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Core Web Vitals](https://web.dev/vitals/)

