# Phase 1: Foundation - Configuration de Base ✅

## Vue d'ensemble

La Phase 1 établit les fondations de l'intégration frontend-backend en créant une couche de communication API robuste avec retry logic, gestion d'erreurs centralisée, et types TypeScript complets.

## Tâches complétées

### ✅ 1.1 Client API centralisé avec configuration

**Fichier**: `lib/api/client.ts`

**Fonctionnalités implémentées**:
- Classe `ApiClient` singleton configurée avec variables d'environnement
- Configuration depuis `NEXT_PUBLIC_API_URL`
- Timeout configurable (30s par défaut)
- Support CORS avec credentials (`credentials: 'include'`)
- Méthodes HTTP complètes: GET, POST, PUT, PATCH, DELETE

**Configuration**:
```typescript
const config = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
};
```

### ✅ 1.2 Gestion des headers HTTP

**Fonctionnalités implémentées**:
- Injection automatique des headers requis (Content-Type, Accept)
- Injection automatique du token Bearer pour requêtes authentifiées
- Support du token CSRF pour requêtes state-changing (POST, PUT, PATCH, DELETE)
- Headers configurables par requête

**Headers automatiques**:
```typescript
{
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {token}', // Si authentifié
  'X-XSRF-TOKEN': '{csrf_token}',   // Pour state-changing
}
```

### ✅ 1.4 Retry logic avec exponential backoff

**Fonctionnalités implémentées**:
- 3 tentatives maximum pour erreurs réseau
- Exponential backoff: 1s, 2s, 4s
- Détection intelligente des erreurs retryables
- Pas de retry pour erreurs API (4xx, 5xx)

**Algorithme**:
```typescript
delay = retryDelay * Math.pow(2, maxRetries - retriesLeft)
// Tentative 1: 1000ms
// Tentative 2: 2000ms
// Tentative 3: 4000ms
```

### ✅ 1.6 Support upload de fichiers

**Fonctionnalités implémentées**:
- Méthode `uploadFile()` pour upload simple
- Méthode `uploadMultipleFiles()` pour uploads multiples
- Support multipart/form-data
- Callback de progression d'upload
- Gestion des headers d'authentification

**Utilisation**:
```typescript
await apiClient.uploadFile('/api/kyc/submit', file, (progress) => {
  console.log(`Upload: ${progress}%`);
});
```

### ✅ 1.8 Gestionnaire d'erreurs centralisé

**Fichier**: `lib/errors/ErrorHandler.ts`

**Fonctionnalités implémentées**:
- Classification des erreurs par type
- Mapping status HTTP → messages utilisateur
- Support multilingue (FR/EN)
- Logging en mode développement
- Gestion des erreurs de validation (422)
- Détection des erreurs réseau

**Types d'erreurs gérés**:
- Network errors (retry automatique)
- 401 Unauthorized (redirect login)
- 403 Forbidden (accès refusé)
- 404 Not Found
- 422 Validation (erreurs par champ)
- 429 Rate Limit
- 500+ Server errors

**Utilisation**:
```typescript
try {
  await apiClient.get('/api/trips');
} catch (error) {
  const errorResponse = ErrorHandler.handle(error, 'fr');
  console.log(errorResponse.message);
  if (errorResponse.fieldErrors) {
    // Afficher erreurs par champ
  }
}
```

### ✅ 1.10 Interfaces TypeScript pour l'API

**Fichier**: `lib/types/api.ts`

**Types créés**:
- User, Trip, Shipment
- Message, Conversation
- Payment, Wallet, WalletTransaction
- WithdrawalRequest
- KYCDocument
- Rating, Notification
- ApiResponse, PaginatedResponse, ValidationError
- Tous les types de requêtes (LoginRequest, RegisterRequest, etc.)

**Utilisation**:
```typescript
import { User, Trip, ApiResponse } from '@/lib/types/api';

const response = await apiClient.get<ApiResponse<User>>('/api/user');
const user: User = response.data;
```

### ✅ 1.11 Mapping des endpoints API

**Fichier**: `lib/api/endpoints.ts`

**Endpoints organisés par catégorie**:
- Authentication (login, register, logout, me)
- KYC (submit, status)
- Trips (list, create, show, update, delete, my, search)
- Shipments (list, create, show, update, my, accept, cancel)
- Messages (conversations, list, send, markRead)
- Payments (createCheckout, webhook)
- Wallet (balance, transactions)
- Withdrawals (create, list, show)
- Ratings (submit, list)
- Notifications (list, markRead, markAllRead)
- Admin (tous les endpoints admin)

**Utilisation**:
```typescript
import { API_ENDPOINTS } from '@/lib/api/endpoints';

// Endpoint simple
await apiClient.get(API_ENDPOINTS.trips.my);

// Endpoint paramétré
await apiClient.get(API_ENDPOINTS.trips.show('trip-id'));
```

## Configuration requise

### Variables d'environnement

Créer un fichier `.env.local` basé sur `.env.example`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Utilisation

### Exemple complet

```typescript
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { Trip, ApiResponse } from '@/lib/types/api';

async function fetchMyTrips() {
  try {
    const response = await apiClient.get<ApiResponse<Trip[]>>(
      API_ENDPOINTS.trips.my
    );
    return response.data;
  } catch (error) {
    const errorResponse = ErrorHandler.handle(error, 'fr');
    console.error(errorResponse.message);
    throw error;
  }
}
```

## Tests à effectuer

### Tests manuels

1. **Configuration API Client**:
   - Vérifier que `NEXT_PUBLIC_API_URL` est correctement lu
   - Tester timeout (30s)
   - Vérifier CORS avec credentials

2. **Headers HTTP**:
   - Vérifier injection Content-Type et Accept
   - Vérifier injection Bearer token si authentifié
   - Vérifier injection CSRF token pour POST/PUT/PATCH/DELETE

3. **Retry Logic**:
   - Simuler erreur réseau → vérifier 3 tentatives
   - Vérifier exponential backoff (1s, 2s, 4s)
   - Vérifier pas de retry pour erreurs API

4. **Upload de fichiers**:
   - Tester upload simple
   - Tester upload multiple
   - Vérifier progression
   - Vérifier multipart/form-data

5. **Gestion d'erreurs**:
   - Tester chaque type d'erreur (401, 403, 404, 422, 429, 500)
   - Vérifier messages localisés (FR/EN)
   - Vérifier erreurs de validation par champ

## Prochaines étapes

La Phase 1 est maintenant complète. Vous pouvez passer à la **Phase 2: Authentification Sanctum**.

### Phase 2 inclura:
- Contexte d'authentification global
- Flow de login/register/logout
- Gestion des tokens Sanctum
- Refresh automatique des tokens
- Persistance de session
- Protection des routes

## Notes importantes

- Le client API est un singleton accessible via `apiClient`
- Tous les appels API incluent automatiquement les headers requis
- Les erreurs sont automatiquement gérées et formatées
- Le retry logic ne s'applique qu'aux erreurs réseau
- Les types TypeScript assurent la type safety
- Les endpoints sont centralisés pour faciliter la maintenance

## Validation

✅ Client API centralisé créé  
✅ Gestion des headers HTTP implémentée  
✅ Retry logic avec exponential backoff fonctionnel  
✅ Support upload de fichiers ajouté  
✅ Gestionnaire d'erreurs centralisé créé  
✅ Interfaces TypeScript complètes  
✅ Mapping des endpoints organisé  
✅ Documentation complète  
✅ Variables d'environnement documentées  

**Status**: Phase 1 complète et prête pour la Phase 2 ✅
