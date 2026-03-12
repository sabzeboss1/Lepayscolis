# Le Pays Express Colis — Frontend Roadmap

## Résumé du frontend

**Framework** : Next.js 16.1.3 + React 19, TypeScript, Tailwind CSS 4

**Architecture** : App Router avec 3 groupes de routes :
- `(public)` — Pages accessibles sans authentification (accueil, login, register, FAQ, etc.)
- `(app)` — Pages utilisateurs authentifiés (dashboard, trips, shipments, messages, wallet, KYC, profile, ratings, notifications, payments)
- `(admin)` — Pages administration (dashboard, users, KYC, trips, shipments, payments, wallets, withdrawals, ratings, messages, analytics, settings, audit-logs, notifications)

**Providers** : `LocaleProvider` > `AuthProvider` > `PusherProvider` > `NotificationProvider`

**Authentification** :
- **Tous les rôles** : Cookie `auth-token` via `AuthContext` + middleware Next.js
- **Page de login unique** : `/auth/login` avec redirection automatique par rôle
- **Vérification admin** : côté client dans `(admin)/layout.tsx` via `AuthContext.isAdmin`

**Données** : La plupart des pages utilisent des **données mock** (Faker.js) en développement. L'API client (`lib/api/client.ts`) et les endpoints (`lib/api/endpoints.ts`) sont définis mais pas connectés à toutes les pages.

**Librairies clés** : React Hook Form + Zod (formulaires), SWR (data fetching), Pusher.js (WebSocket), Lucide React (icones), date-fns (dates)

---

## Modifications à apporter

### 1. Page de connexion unique avec redirection par rôle ✅

> Actuellement il y a 2 pages de login : `/auth/login` (user, avec react-hook-form + Zod) et `/admin/login` (admin, formulaire manuel avec localStorage). On les fusionne en une seule page.

- [x] Créer une page de login unifiée dans `(public)/auth/login/page.tsx`
- [x] Utiliser un seul endpoint backend `/api/auth/login` qui retourne le `role` de l'utilisateur
- [x] Après login, rediriger automatiquement : `admin`/`super_admin` → `/admin/dashboard`, `user` → `/dashboard`
- [x] Stocker le token de la même manière pour tous les rôles (cookie `auth-token`)
- [x] Modifier `AuthContext` pour inclure la gestion du rôle admin (pas de localStorage séparé)
- [x] Mettre à jour le middleware Next.js pour vérifier le rôle depuis le cookie/session au lieu de `admin-token`
- [x] Mettre à jour le layout admin `(admin)/layout.tsx` pour utiliser `AuthContext` au lieu de localStorage
- [x] Supprimer la page `(admin)/admin/login/page.tsx` (devenue inutile)
- [x] Gérer la redirection post-login si un paramètre `?redirect=` est présent dans l'URL
- [x] Ajouter un bouton de logout dans le header admin qui utilise `AuthContext.logout()`

### 2. Intégration API — Authentification ✅

> Connecter le flux d'authentification au backend réel.

- [x] Vérifier que `AuthContext.login()` fonctionne avec l'endpoint `/api/auth/login` du backend
- [x] Vérifier que `AuthContext.register()` fonctionne avec `/api/auth/register` (inclure `password_confirmation`, `country`)
- [x] Vérifier que `AuthContext.logout()` fonctionne avec `/api/auth/logout`
- [x] Vérifier que `refreshUser()` fonctionne avec `/api/auth/me`
- [x] Tester le flux CSRF (`/sanctum/csrf-cookie`) avant chaque login/register
- [ ] Gérer les erreurs de validation backend (422) avec affichage par champ
- [ ] Gérer l'expiration du token (401) avec redirection vers login

### 3. Intégration API — Dashboard ✅

> Remplacer les données mock du dashboard par des appels API réels.

- [x] Connecter les statistiques utilisateur (rating, nombre de livraisons) via `/api/auth/me`
- [x] Charger les trips actifs via `/api/trips/my`
- [x] Charger les shipments en cours via `/api/shipments/my`
- [x] Charger les conversations récentes via `/api/messages/conversations`
- [x] Remplacer `fetch()` brut par `apiClient` dans le dashboard
- [x] Afficher le statut KYC depuis les données utilisateur backend
- [x] Gérer les états de chargement et d'erreur

### 4. Intégration API — Trips (Voyages)

> Connecter toutes les pages trips au backend.

- [ ] `trips/page.tsx` : Charger la liste des trips via `/api/trips` avec pagination
- [ ] `trips/new/page.tsx` : Créer un trip via `POST /api/trips` (inclure la preuve de voyage)
- [ ] `trips/[id]/page.tsx` : Charger les détails d'un trip via `/api/trips/{id}`
- [ ] `trips/my/page.tsx` : Charger mes trips via `/api/trips/my`
- [ ] `trips/search/page.tsx` : Recherche de trips via `/api/trips/search`
- [ ] Remplacer les données mock par les réponses API réelles
- [ ] Ajouter la gestion de la pagination (composant + logique)
- [ ] Gérer les statuts de trip (`active`, `completed`, `cancelled`) + filtres

### 5. Intégration API — Shipments (Colis)

> Connecter toutes les pages shipments au backend.

- [ ] `shipments/page.tsx` : Charger la liste des shipments via `/api/shipments`
- [ ] `shipments/new/page.tsx` : Créer un shipment via `POST /api/shipments`
- [ ] `shipments/[id]/page.tsx` : Charger les détails via `/api/shipments/{id}`
- [ ] `shipments/my/page.tsx` : Charger mes colis via `/api/shipments/my`
- [ ] Accepter/refuser un colis : `POST /api/shipments/{id}/accept`, `/cancel`
- [ ] Mettre à jour le statut : `PATCH /api/shipments/{id}/status`
- [ ] Upload des photos de colis via `apiClient.uploadFile()`
- [ ] Gérer les transitions de statut (`pending` → `accepted` → `in_transit` → `delivered`)

### 6. Intégration API — Messagerie

> Connecter la messagerie temps réel au backend.

- [ ] `messages/page.tsx` : Charger les conversations via `/api/messages/conversations`
- [ ] `messages/[conversationId]/page.tsx` : Charger les messages via `/api/messages?conversation_id={id}`
- [ ] Envoyer un message via `POST /api/messages`
- [ ] Marquer comme lu via `POST /api/messages/{id}/read`
- [ ] Intégrer les WebSocket Pusher pour les messages en temps réel (déjà partiellement fait)
- [ ] Afficher le compteur de messages non lus dans le header

### 7. Intégration API — Wallet & Paiements

> Connecter le portefeuille et les paiements au backend.

- [ ] `wallet/page.tsx` : Charger le solde via `/api/wallet` et les transactions via `/api/wallet/transactions`
- [ ] `wallet/withdraw/page.tsx` : Créer un retrait via `POST /api/withdrawals`
- [ ] `wallet/withdrawals/page.tsx` : Historique des retraits via `/api/withdrawals`
- [ ] `payments/checkout/page.tsx` : Créer un checkout Stripe via `/api/payments/create-checkout`
- [ ] `payments/success/page.tsx` : Confirmer le paiement après retour Stripe
- [ ] `payments/cancel/page.tsx` : Gérer l'annulation de paiement
- [ ] Intégrer les mises à jour temps réel du wallet via WebSocket

### 8. Intégration API — KYC

> Connecter la vérification d'identité au backend.

- [ ] `kyc/page.tsx` : Charger le statut KYC via `/api/kyc/status`
- [ ] Soumettre les documents KYC via `POST /api/kyc/submit` (upload de fichiers)
- [ ] Afficher le statut de vérification (pending, approved, rejected avec motif)
- [ ] Bloquer certaines fonctionnalités tant que le KYC n'est pas approuvé (KYCBlocker)

### 9. Intégration API — Ratings & Notifications

> Connecter les évaluations et les notifications.

- [ ] `ratings/submit/page.tsx` : Soumettre une évaluation via `POST /api/ratings`
- [ ] Charger les évaluations d'un utilisateur via `/api/users/{id}/ratings`
- [ ] `notifications/page.tsx` : Charger les notifications via `/api/notifications`
- [ ] Marquer comme lue via `POST /api/notifications/{id}/read`
- [ ] Marquer toutes comme lues via `POST /api/notifications/read-all`
- [ ] Intégrer les notifications temps réel via WebSocket Pusher

### 10. Intégration API — Profil utilisateur

> Connecter la gestion de profil au backend.

- [ ] `profile/page.tsx` : Charger le profil via `/api/users/{id}`
- [ ] `profile/edit/page.tsx` : Mettre à jour via `PUT /api/users/profile`
- [ ] Upload d'avatar via `POST /api/users/avatar`
- [ ] Modifier la langue (locale) via l'API profil
- [ ] Afficher les infos publiques vs privées selon le contexte

### 11. Intégration API — Admin Dashboard

> Connecter toutes les pages admin au backend réel.

- [x] `admin/dashboard/page.tsx` : Stats via `/api/admin/dashboard` (metrics, charts, activity)
- [x] `admin/profile/page.tsx` : Profil admin via `/api/user` (mise à jour profil + avatar)
- [x] `admin/users/page.tsx` : Liste des utilisateurs via `/api/admin/users` avec pagination, filtres, tri, suspension en masse
- [ ] `admin/users/[id]/page.tsx` : Détails utilisateur, suspension, ban
- [x] `admin/kyc/page.tsx` : KYC en attente via `/api/admin/kyc` avec approuver/rejeter individuel et en masse
- [ ] `admin/kyc/[id]/page.tsx` : Revue KYC détaillée avec aperçu des documents
- [x] `admin/trips/page.tsx` : Liste des trips via `/api/admin/trips` avec pagination et filtres
- [ ] `admin/trips/[id]/page.tsx` : Détails trip, validation preuve de voyage
- [x] `admin/shipments/page.tsx` : Liste des shipments via `/api/admin/shipments` avec pagination, filtres, tri
- [ ] `admin/shipments/[id]/page.tsx` : Détails et actions sur les shipments
- [x] `admin/payments/page.tsx` : Paiements via `/api/admin/payments` avec pagination, filtres, tri
- [ ] `admin/payments/[id]/page.tsx` : Détails paiement
- [x] `admin/wallets/page.tsx` : Wallets via `/api/admin/wallets` avec pagination, filtres, tri
- [x] `admin/withdrawals/page.tsx` : Retraits via `/api/admin/withdrawals` (approuver/rejeter/compléter)
- [x] `admin/ratings/page.tsx` : Ratings via `/api/admin/ratings` (modération) avec pagination, filtres, tri
- [x] `admin/messages/page.tsx` : Messages via `/api/admin/messages` avec pagination et filtres
- [x] `admin/analytics/page.tsx` : Analytics via `/api/admin/analytics` avec filtres par date et export
- [x] `admin/settings/page.tsx` : Paramètres plateforme via `/api/admin/settings` (lecture + mise à jour)
- [x] `admin/notifications/page.tsx` : Envoi notifications via `/api/admin/notifications` + historique
- [ ] `admin/audit-logs/page.tsx` : Logs d'audit via `/api/admin/audit-logs` (⚠️ utilise encore des données mock)
- [x] `admin/currencies/page.tsx` : Gestion des devises via `/api/admin/currencies` (CRUD complet, taux de change, activation)
- [x] `admin/countries/page.tsx` : Gestion des pays via `/api/admin/countries` (CRUD complet, activation, devise/locale par défaut)
- [x] `admin/cities/page.tsx` : Gestion des villes via `/api/admin/cities` (CRUD complet, activation, filtre par pays)
- [ ] Supprimer toutes les données mock admin (`lib/api/adminMockData.ts`) — reste audit-logs à connecter
- [ ] Migrer les pages utilisant `fetch` direct vers `apiClient` pour uniformiser (users, kyc, trips, shipments, payments, wallets, withdrawals, ratings, messages, settings)

### 12. Suppression des données mock

> Remplacer toutes les données Faker.js par des appels API réels.

- [ ] Supprimer `lib/api/mockData.ts` une fois toutes les pages connectées
- [ ] Supprimer `lib/api/adminMockData.ts` une fois l'admin connecté
- [ ] Retirer la dépendance `@faker-js/faker` du `package.json`
- [ ] Vérifier qu'aucune page n'importe encore de données mock
- [ ] Supprimer les demo credentials de l'interface

### 13. Alignement des types TypeScript avec le backend

> S'assurer que les interfaces frontend correspondent exactement aux réponses API du backend.

- [ ] Mettre à jour `lib/types/api.ts` : ajouter les champs manquants (ex: `locale`, `verification_status`)
- [ ] Ajouter les types pour les nouvelles entités backend (`Country`, `City`, `Currency`)
- [ ] Mettre à jour le type `Trip` pour inclure `verification_status`, `travel_proof_url` obligatoire, `currency_code`, relations pays/villes
- [ ] Mettre à jour le type `Payment` pour inclure `sender_fee`, `traveler_fee` au lieu de `platform_fee`, `currency_code`
- [x] Mettre à jour le type `User` pour inclure `currency_code`
- [ ] Ajouter les types pour les réponses paginées Laravel (`PaginatedResponse<T>`)
- [ ] Vérifier que tous les types correspondent aux Resources Laravel

### 14. Support multi-devises (frontend)

> Afficher les montants dans la devise de l'utilisateur et gérer les conversions. Le backend multi-devises est entièrement implémenté (table `currencies`, `CurrencyService`, `currency_code` sur tous les modèles financiers).

- [x] Page admin de gestion des devises (`admin/currencies`) : CRUD, taux de change, activation/désactivation
- [x] Endpoints API frontend définis (`currencies.list`, `admin.currencies.*`)
- [x] Traductions FR/EN pour la gestion des devises admin
- [x] Type `User` mis à jour avec `currency_code`
- [x] Menu sidebar admin avec lien vers la gestion des devises
- [ ] Créer un helper `formatCurrency(amount, currencyCode)` pour afficher les montants
- [ ] Charger les devises actives via `/api/currencies` pour les formulaires (création trip, inscription)
- [ ] Afficher les prix des trips dans la devise du voyageur
- [ ] Afficher le solde wallet et les transactions dans la devise de l'utilisateur
- [ ] Afficher le détail des frais (commission) dans la devise appropriée
- [ ] Permettre à l'utilisateur de changer sa devise préférée dans le profil
- [ ] Ajouter un sélecteur de devise dans le formulaire de création de trip

### 15. Support pays/villes (frontend)

> Remplacer les champs texte par des sélecteurs de pays/villes depuis l'API. Le backend pays/villes est entièrement implémenté (tables `countries`/`cities`, endpoints publics et admin, seeder avec 22 pays et 42 villes).

- [x] Page admin de gestion des pays (`admin/countries`) : CRUD, activation, devise/locale par défaut
- [x] Page admin de gestion des villes (`admin/cities`) : CRUD, activation, filtre par pays
- [x] Endpoints API frontend définis (`countries.list`, `countries.cities(id)`, `admin.countries.*`, `admin.cities.*`)
- [x] Traductions FR/EN pour la gestion des pays et villes admin
- [x] Menu sidebar admin avec liens vers pays et villes (icônes Globe, MapPin)
- [ ] Créer un composant `CountrySelect` qui charge les pays depuis `/api/countries`
- [ ] Créer un composant `CitySelect` dynamique (filtre par pays sélectionné) depuis `/api/countries/{id}/cities`
- [ ] Remplacer les inputs texte dans le formulaire de création de trip par `CountrySelect` + `CitySelect`
- [ ] Remplacer les inputs texte dans le formulaire de création de shipment
- [ ] Remplacer le champ pays dans le formulaire d'inscription
- [ ] Mettre à jour la page de recherche de trips avec les sélecteurs pays/villes
- [ ] Remplacer `lib/data/locations.ts` (données locales) par les appels API

### 16. Support preuve de voyage (frontend)

> Ajouter l'upload de preuve obligatoire lors de la création d'un trip.

- [ ] Ajouter un champ upload de fichier (image/PDF) dans le formulaire de création de trip
- [ ] Rendre ce champ obligatoire avec validation Zod
- [ ] Afficher un apercu du document uploadé
- [ ] Afficher le statut de vérification du trip (`pending`, `verified`, `rejected`)
- [ ] Afficher un badge de statut sur les cards de trips
- [ ] Afficher le motif de rejet si applicable
- [ ] Côté admin : page de validation des preuves avec apercu du document

### 17. Support double commission (frontend)

> Afficher le détail des frais (commission expéditeur + commission voyageur).

- [ ] Afficher le détail des frais à l'expéditeur avant paiement : prix de base + frais de service = total
- [ ] Afficher le détail au voyageur : prix de base - commission plateforme = montant net recu
- [ ] Mettre à jour la page checkout avec le récapitulatif des frais
- [ ] Mettre à jour la page de détails du shipment avec les montants détaillés
- [ ] Côté admin : afficher les deux commissions séparément dans les analytics

### 18. Internationalisation (i18n) — Compléter les traductions

> Le système i18n existe (`lib/i18n/`) avec `fr.json` et `en.json`. Vérifier la couverture.

- [ ] Vérifier que toutes les pages utilisent `useTranslation()` au lieu de textes en dur
- [ ] Compléter les traductions manquantes dans `fr.json` et `en.json`
- [ ] Synchroniser les clés de traduction frontend avec les messages backend
- [ ] Traduire les messages d'erreur de validation (aligner avec `lang/fr/validation.php` du backend)
- [ ] Traduire les statuts affichés (trip status, shipment status, KYC status, payment status)
- [ ] Tester le switch de langue FR/EN sur toutes les pages

---

## Ordre de priorité suggéré

1. **Page de connexion unique** — Fondation : unifie l'authentification
2. **Intégration API — Auth** — Nécessaire pour tout le reste
3. **Alignement des types TypeScript** — Prépare l'intégration API
4. **Intégration API — Dashboard** — Page principale après login
5. **Intégration API — Trips** — Fonctionnalité core
6. **Intégration API — Shipments** — Fonctionnalité core
7. **Intégration API — Messagerie** — Communication entre utilisateurs
8. **Intégration API — Wallet & Paiements** — Flux financier
9. **Intégration API — KYC** — Vérification obligatoire
10. **Intégration API — Ratings & Notifications** — Fonctionnalités secondaires
11. **Intégration API — Profil** — Gestion utilisateur
12. **Intégration API — Admin Dashboard** — Panel d'administration
13. **Support pays/villes** — Sélecteurs dynamiques (après backend point 3)
14. **Support preuve de voyage** — Upload obligatoire (après backend point 7)
15. **Support multi-devises** — Affichage des devises (après backend point 2)
16. **Support double commission** — Détail des frais (après backend point 6)
17. **i18n complet** — Couverture traduction
18. **Suppression des données mock** — Nettoyage final
