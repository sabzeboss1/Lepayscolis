# Le Pays Express Colis — Backend Roadmap

## Résumé du projet

**Le Pays Express Colis** est une plateforme de transport de colis entre particuliers (peer-to-peer) qui connecte des **voyageurs** ayant de la capacité disponible dans leurs bagages avec des **expéditeurs** souhaitant envoyer des colis à l'international — un BlaBlaCar du colis.

### Fonctionnalités existantes

- **Trips** : Les voyageurs publient leurs trajets (capacité kg, prix/kg, dates)
- **Shipments** : Cycle de vie complet `pending → accepted → in_transit → delivered`
- **Paiements Escrow** : Stripe avec 15% de commission plateforme
- **Wallet** : Portefeuille interne + historique des transactions
- **Retraits** : Workflow multi-étapes avec approbation admin
- **KYC** : Vérification d'identité obligatoire (pièce d'identité + selfie)
- **Messagerie temps réel** : Conversations via Pusher (WebSocket)
- **Ratings** : Notation bidirectionnelle (1-5 étoiles), badge "Recommandé"
- **Notifications** : Email, push (FCM), WebSocket
- **Admin Dashboard** : Gestion utilisateurs, KYC, paiements, modération, analytics, audit logs

### Stack technique

- Laravel + Sanctum (auth API tokens)
- MySQL/PostgreSQL + Redis (cache, queues)
- Stripe (paiements escrow)
- Pusher (temps réel) + FCM (push)
- 19 modèles, 26 migrations, 30 contrôleurs

---

## Modifications à apporter

### 1. Système multi-langue (i18n)

> Le modèle `User` possède déjà une colonne `locale`. On s'appuie dessus.

- [x] Mettre en place les fichiers de traduction Laravel (`lang/fr`, `lang/en`, etc.)
- [x] Traduire tous les messages d'erreur, validations et notifications
- [x] Ajouter un middleware de détection de langue (header `Accept-Language`, paramètre `?lang=`, ou `locale` du user connecté)
- [x] Appliquer `App::setLocale()` automatiquement selon la préférence utilisateur
- [x] Rendre les contenus dynamiques traduisibles (noms de pays, statuts, catégories)
- [x] Ajouter un endpoint API pour lister les langues supportées
- [x] Permettre à l'utilisateur de modifier sa langue via l'API profil

### 2. Système multi-devises (multi-currency)

- [x] Créer une table `currencies` (code ISO 4217, symbole, nom, taux de change, active)
- [x] Créer une migration pour ajouter la table `currencies`
- [x] Ajouter une devise par défaut à la plateforme (configurable via `platform_settings`)
- [x] Ajouter un champ `currency_code` au modèle `User` (devise préférée)
- [x] Ajouter un champ `currency_code` au modèle `Trip` (devise du prix fixé par le voyageur)
- [x] Ajouter un champ `currency_code` aux modèles `Payment`, `Wallet`, `WalletTransaction`, `WithdrawalRequest`
- [x] Créer un `CurrencyService` pour la conversion entre devises
- [x] Permettre à l'admin de gérer les devises actives et les taux de change
- [x] Afficher les montants dans la devise de l'utilisateur connecté côté API

### 3. Gestion des pays et villes

> Actuellement les pays/villes sont des champs texte libres dans `Trip` et `Shipment`. On les remplace par des tables référentielles.

- [x] Créer une table `countries` (code ISO 3166, nom, indicatif téléphonique, devise par défaut, langue par défaut, active)
- [x] Créer une table `cities` (nom, `country_id`, active)
- [x] Seeder les pays et principales villes
- [x] Remplacer les champs texte `departure_country`, `arrival_country`, `departure_city`, `arrival_city` de `Trip` par des clés étrangères (`departure_country_id`, `arrival_country_id`, `departure_city_id`, `arrival_city_id`)
- [x] Remplacer les champs texte `pickup_country`, `delivery_country`, `pickup_city`, `delivery_city` de `Shipment` par des clés étrangères
- [x] Mettre à jour les modèles `Trip` et `Shipment` avec les relations `belongsTo`
- [x] Créer les endpoints API pour lister les pays et villes disponibles
- [x] Permettre à l'admin d'activer/désactiver des pays et de gérer les villes
- [x] Mettre à jour les contrôleurs et validations pour utiliser les IDs au lieu des textes

### 4. Multi-colis par voyageur

> Un voyageur doit pouvoir transporter plusieurs colis de différents expéditeurs sur un même trajet.

- [x] Vérifier que la relation `Trip → hasMany → Shipment` existe bien (déjà en place)
- [x] Ajouter un suivi dynamique de la capacité restante (`available_capacity` - somme des poids des colis acceptés)
- [x] Créer une méthode `remainingCapacity()` sur le modèle `Trip`
- [x] Valider automatiquement qu'un nouveau colis ne dépasse pas la capacité restante avant acceptation
- [x] Permettre au voyageur de voir la liste de tous les colis acceptés pour un trajet (`GET /api/trips/{id}/shipments`)
- [x] Adapter le système de paiement : un paiement distinct par colis (déjà en place — `Shipment` HasOne `Payment`)
- [ ] Mettre à jour les notifications pour informer le voyageur de chaque nouvelle demande de colis (en attente du système de notifications)
- [x] Ajouter un endpoint pour que le voyageur gère ses colis par trajet (liste, accepter, refuser via `POST /api/shipments/{id}/reject`)
- [x] Restaurer la capacité du voyage lors de l'annulation d'un colis accepté
- [x] Ajouter les traductions (messages + validation) en français et anglais

### 5. Stockage fichiers en local (remplacer S3)

- [ ] Configurer `FILESYSTEM_DISK=public` dans `.env`
- [ ] Mettre à jour `config/filesystems.php` pour utiliser le driver `local` / `public`
- [ ] Mettre à jour le `FileUploadService` pour stocker en local au lieu de S3
- [ ] Exécuter `php artisan storage:link` pour créer le lien symbolique
- [ ] Mettre à jour les URLs retournées par l'API (utiliser `Storage::url()`)
- [ ] Adapter l'upload KYC pour le stockage local
- [ ] Adapter l'upload d'avatars pour le stockage local
- [ ] Adapter l'upload de preuve de voyage pour le stockage local
- [ ] Supprimer la dépendance AWS S3 (`composer remove league/flysystem-aws-s3-v3` si présente)

### 6. Double commission (voyageur + expéditeur)

> Actuellement une commission unique de 15% est prélevée sur le montant total et déduite de la part du voyageur. On la remplace par deux commissions distinctes : une appliquée à l'expéditeur (ajoutée au montant qu'il paie) et une appliquée au voyageur (déduite de ce qu'il reçoit).

- [ ] Ajouter dans `platform_settings` (ou table dédiée) les taux configurables : `sender_fee_percentage` et `traveler_fee_percentage`
- [ ] Modifier le modèle `Payment` : remplacer `platform_fee` par `sender_fee` et `traveler_fee`
- [ ] Créer une migration pour ajouter les colonnes `sender_fee` et `traveler_fee` à la table `payments` (et supprimer `platform_fee`)
- [ ] Modifier le `PaymentService::createPaymentIntent()` : le montant facturé à l'expéditeur = `prix de base + sender_fee`, le montant reçu par le voyageur = `prix de base - traveler_fee`
- [ ] Mettre à jour `PaymentService::releasePayment()` pour créditer le wallet avec le montant net (après déduction de la `traveler_fee`)
- [ ] Mettre à jour `PaymentService::refundPayment()` pour rembourser le montant total payé par l'expéditeur (base + sender_fee)
- [ ] Permettre à l'admin de modifier les taux de commission depuis le dashboard
- [ ] Afficher le détail des frais à l'expéditeur avant paiement (prix de base, frais de service, total)
- [ ] Afficher le détail des frais au voyageur (prix de base, commission plateforme, montant net)
- [ ] Mettre à jour les analytics admin pour distinguer les revenus issus des deux commissions

### 7. Preuve de voyage obligatoire + validation admin

> Lors de la création d'un trip, le voyageur doit soumettre une preuve (document ou image). Le trip n'est visible par les expéditeurs qu'après validation par un admin.

- [ ] Ajouter une migration : champs `verification_status` (enum: `pending`, `verified`, `rejected`), `rejection_reason`, `verified_by`, `verified_at` à la table `trips`
- [ ] Rendre le champ `travel_proof_url` obligatoire lors de la création d'un trip
- [ ] Mettre à jour le modèle `Trip` : valeur par défaut `verification_status = 'pending'`
- [ ] Modifier les requêtes de listing des trips : seuls les trips `verified` sont visibles par les expéditeurs
- [ ] Les trips `pending` et `rejected` ne sont visibles que par leur créateur et les admins
- [ ] Créer un endpoint admin `GET /admin/trips/pending` pour lister les trips en attente de vérification
- [ ] Créer un endpoint admin `POST /admin/trips/{id}/verify` pour approuver un trip
- [ ] Créer un endpoint admin `POST /admin/trips/{id}/reject` pour rejeter un trip avec motif
- [ ] Notifier le voyageur du résultat de la vérification (approuvé/rejeté avec motif)
- [ ] Ajouter la vérification en masse (bulk approve/reject) pour les admins
- [ ] Ajouter un filtre par `verification_status` dans la liste admin des trips

---

## Ordre de priorité suggéré

1. **Stockage local** — Fondation technique, impacte tous les uploads
2. **Gestion des pays/villes** — Base référentielle nécessaire pour les autres modules
3. **Multi-langue** — S'appuie sur le `locale` existant du User
4. **Multi-devises** — Dépend de la table pays pour les devises par défaut
5. **Double commission** — Refonte du modèle de revenus plateforme
6. **Preuve de voyage + validation** — Logique métier critique pour la confiance
7. **Multi-colis** — Amélioration de la logique existante
