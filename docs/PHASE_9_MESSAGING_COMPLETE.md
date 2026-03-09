# Phase 9: Messagerie - Implémentation Complète

## Vue d'ensemble

Phase 9 de l'intégration frontend-backend implémente le système de messagerie en temps réel entre utilisateurs. Cette phase remplace les données mockées par des appels API réels vers le backend Laravel et intègre WebSocket via Pusher pour les mises à jour en temps réel.

## Fonctionnalités Implémentées

### 1. Liste des Conversations (`/app/(app)/messages/page.tsx`)

**Fonctionnalités**:
- ✅ Fetch des conversations depuis `/api/messages/conversations` (GET)
- ✅ Affichage du nombre de messages non lus par conversation
- ✅ Mise à jour en temps réel via WebSocket
- ✅ Navigation vers la conversation au clic
- ✅ Affichage du dernier message avec timestamp
- ✅ Avatar et nom du participant
- ✅ État de chargement avec skeleton
- ✅ Gestion d'erreurs avec messages utilisateur
- ✅ Message d'état vide si aucune conversation

**Endpoints API utilisés**:
- `GET /api/messages/conversations` - Liste des conversations avec unread count

**Requirements validés**: 15.4, 15.6

---

### 2. Vue Conversation (`/app/(app)/messages/[conversationId]/page.tsx`)

**Fonctionnalités**:
- ✅ Fetch des messages depuis `/api/messages?conversation_id={id}` (GET)
- ✅ Affichage des messages en temps réel via WebSocket
- ✅ Marquage automatique des messages comme lus à l'ouverture
- ✅ Scroll automatique vers le bas pour nouveaux messages
- ✅ Affichage avec avatar, nom, timestamp
- ✅ Indicateur de lecture (✓ / ✓✓)
- ✅ Bouton retour vers la liste
- ✅ Badge vérifié pour utilisateurs KYC approved
- ✅ État de chargement avec skeleton
- ✅ Gestion d'erreurs avec messages utilisateur

**Endpoints API utilisés**:
- `GET /api/messages?conversation_id={id}` - Messages d'une conversation
- `PUT /api/messages/{id}/read` - Marquer un message comme lu

**Requirements validés**: 15.5, 15.3, 15.7

---

### 3. Envoi de Message

**Fonctionnalités**:
- ✅ Formulaire d'envoi dans la page conversation
- ✅ POST `/api/messages` avec {recipient_id, content, conversation_id}
- ✅ Optimistic update - affichage immédiat du message
- ✅ Rollback en cas d'erreur avec restauration du texte
- ✅ Désactivation du bouton pendant l'envoi
- ✅ Limite de caractères (500)
- ✅ Support Enter pour envoyer (Shift+Enter pour nouvelle ligne)
- ✅ Textarea auto-resize
- ✅ Notifications de succès/erreur

**Endpoints API utilisés**:
- `POST /api/messages` - Envoyer un message

**Requirements validés**: 15.1, 15.2

---

### 4. Badge Messages Non Lus

**Fonctionnalités**:
- ✅ Badge dans le header avec unread count
- ✅ Mise à jour en temps réel via WebSocket
- ✅ Fetch initial du count depuis API
- ✅ Affichage uniquement si count > 0
- ✅ Format "9+" si plus de 9 messages
- ✅ Intégration dans HeaderApp (desktop et mobile)

**Hook utilisé**: `useUnreadMessages` (mis à jour pour utiliser API et WebSocket)

**Endpoints API utilisés**:
- `GET /api/messages/conversations` - Pour calculer le total unread

**Requirements validés**: 15.6

---

## Intégration WebSocket

### Hook `useRealtimeMessages`

**Fichier**: `lib/hooks/useRealtimeMessages.ts`

**Fonctionnalités**:
- Écoute de l'événement `message.sent` sur le channel `private-conversation.{conversationId}`
- Callback `onNewMessage` pour ajouter le message à la liste
- Callback `onMessageRead` pour mettre à jour le statut de lecture
- Gestion automatique de la subscription/unsubscription

**Utilisation**:
```typescript
useRealtimeMessages({
  conversationId: 'conv-123',
  onNewMessage: (message) => {
    setMessages(prev => [...prev, message]);
  },
});
```

### Hook `useUnreadMessages`

**Fichier**: `lib/hooks/useUnreadMessages.ts` (mis à jour)

**Fonctionnalités**:
- Fetch initial du unread count depuis l'API
- Subscription au channel `private-user.{userId}`
- Écoute de l'événement `message.sent`
- Refresh automatique du count à la réception d'un nouveau message
- Cleanup automatique de la subscription

---

## Fichiers Créés

1. **`lepaysexpresscolis-frontend/app/(app)/messages/[conversationId]/page.tsx`**
   - Page de vue conversation avec messages
   - Intégration WebSocket pour temps réel
   - Formulaire d'envoi avec optimistic updates

---

## Fichiers Modifiés

1. **`lepaysexpresscolis-frontend/app/(app)/messages/page.tsx`**
   - Remplacement des données mockées par appels API
   - Utilisation de `apiClient` et `API_ENDPOINTS`
   - Gestion d'erreurs avec `ErrorHandler`
   - Notifications avec `NotificationService`
   - Navigation vers conversation au clic

2. **`lepaysexpresscolis-frontend/lib/hooks/useUnreadMessages.ts`**
   - Remplacement du polling par WebSocket
   - Utilisation de `apiClient` pour fetch initial
   - Subscription au channel utilisateur
   - Refresh automatique sur événement `message.sent`

3. **`lepaysexpresscolis-frontend/lib/i18n/translations/fr.json`**
   - Ajout de clés de traduction:
     - `messages.unreadMessage` / `messages.unreadMessages`
     - `messages.unknownUser`
     - `messages.you`
     - `messages.noMessagesYet`
     - `messages.messageSent`
     - `messages.startConversationHint`
     - Messages d'erreur spécifiques

4. **`lepaysexpresscolis-frontend/lib/i18n/translations/en.json`**
   - Ajout des mêmes clés en anglais

---

## Standards Respectés

### Architecture
- ✅ Utilisation de `apiClient` de `lib/api/client.ts`
- ✅ Utilisation de `API_ENDPOINTS` de `lib/api/endpoints.ts`
- ✅ Utilisation des types de `lib/types/api.ts` (Message, Conversation)
- ✅ Utilisation de `ErrorHandler` pour gestion d'erreurs
- ✅ Utilisation de `NotificationService` pour toasts
- ✅ Utilisation de `useTranslation` pour i18n

### UX/UI
- ✅ Loading states avec spinners/skeletons
- ✅ Optimistic updates pour envoi de messages
- ✅ Rollback en cas d'erreur
- ✅ Format dates: `toLocaleDateString` avec format court
- ✅ Messages d'erreur clairs et localisés
- ✅ États vides avec messages explicatifs

### Next.js 15
- ✅ App Router avec 'use client'
- ✅ useParams pour paramètres de route
- ✅ useRouter pour navigation

### WebSocket
- ✅ Utilisation des hooks existants (`useRealtimeMessages`, `useUnreadMessages`)
- ✅ Subscription aux channels privés
- ✅ Cleanup automatique des subscriptions
- ✅ Gestion des événements en temps réel

---

## Tests Manuels Suggérés

### Test 1: Liste des Conversations
1. Se connecter avec un utilisateur ayant des conversations
2. Vérifier que la liste s'affiche correctement
3. Vérifier l'affichage du unread count
4. Vérifier le dernier message et timestamp
5. Cliquer sur une conversation → doit naviguer vers `/messages/{id}`

### Test 2: Vue Conversation
1. Ouvrir une conversation
2. Vérifier que les messages s'affichent
3. Vérifier le scroll automatique vers le bas
4. Vérifier l'indicateur de lecture (✓ / ✓✓)
5. Vérifier que les messages non lus sont marqués comme lus

### Test 3: Envoi de Message
1. Taper un message dans le formulaire
2. Appuyer sur Enter ou cliquer sur "Envoyer"
3. Vérifier l'affichage immédiat (optimistic update)
4. Vérifier la notification de succès
5. Tester avec un message vide → bouton désactivé
6. Tester avec limite de caractères (500)

### Test 4: Messages Temps Réel
1. Ouvrir une conversation dans deux navigateurs (deux utilisateurs)
2. Envoyer un message depuis le premier navigateur
3. Vérifier que le message apparaît immédiatement dans le second
4. Vérifier la mise à jour du unread count dans le header

### Test 5: Badge Unread Messages
1. Se connecter avec un utilisateur
2. Vérifier le badge dans le header
3. Recevoir un nouveau message (via autre utilisateur)
4. Vérifier que le badge se met à jour automatiquement
5. Ouvrir la conversation
6. Vérifier que le badge diminue après lecture

### Test 6: Gestion d'Erreurs
1. Déconnecter le backend
2. Essayer de charger les conversations → message d'erreur
3. Essayer d'envoyer un message → rollback + notification d'erreur
4. Reconnecter le backend
5. Vérifier que tout fonctionne à nouveau

### Test 7: États Vides
1. Se connecter avec un nouvel utilisateur (sans conversations)
2. Vérifier le message "Aucune conversation pour le moment"
3. Ouvrir une conversation vide
4. Vérifier le message "Aucun message pour le moment"

### Test 8: Responsive
1. Tester sur mobile (< 768px)
2. Vérifier que la liste et la conversation sont séparées
3. Vérifier le bouton retour dans la conversation
4. Tester sur desktop
5. Vérifier l'affichage côte à côte (si implémenté)

---

## Requirements Validés

### Requirement 15: Messagerie Temps Réel

- ✅ **15.1**: Envoi de message via POST `/api/messages`
- ✅ **15.2**: Broadcast via WebSocket (Pusher)
- ✅ **15.3**: Affichage sans refresh de page
- ✅ **15.4**: Fetch conversations depuis `/api/messages/conversations`
- ✅ **15.5**: Fetch messages depuis `/api/messages?conversation_id={id}`
- ✅ **15.6**: Unread count en temps réel
- ✅ **15.7**: Marquage comme lu à l'ouverture

---

## Prochaines Étapes

### Améliorations Possibles (Non requises pour Phase 9)

1. **Pagination des messages**
   - Charger les messages par batch (ex: 50 à la fois)
   - Infinite scroll vers le haut pour charger l'historique

2. **Recherche dans les conversations**
   - Filtrer les conversations par nom d'utilisateur
   - Rechercher dans le contenu des messages

3. **Indicateur de frappe**
   - Afficher "X est en train d'écrire..."
   - Utiliser WebSocket pour broadcast typing events

4. **Pièces jointes**
   - Support d'images dans les messages
   - Upload et preview d'images

5. **Notifications push**
   - Notifications navigateur pour nouveaux messages
   - Son de notification configurable

6. **Suppression de messages**
   - Supprimer un message individuel
   - Supprimer une conversation entière

7. **Réactions aux messages**
   - Emoji reactions (👍, ❤️, etc.)
   - Affichage des réactions sous les messages

---

## Notes Techniques

### Performance
- Les messages sont chargés une seule fois au montage
- WebSocket évite le polling constant
- Optimistic updates améliorent la perception de rapidité
- Scroll automatique uniquement pour nouveaux messages

### Sécurité
- Authentification requise pour tous les endpoints
- Channels privés WebSocket avec authentification
- Validation côté serveur du recipient_id
- Sanitization du contenu des messages

### Accessibilité
- Labels ARIA sur les formulaires
- Focus management pour navigation clavier
- Messages d'erreur annoncés aux lecteurs d'écran
- Contraste suffisant pour les messages

---

## Conclusion

Phase 9 est complète avec toutes les fonctionnalités de messagerie implémentées:
- ✅ Liste des conversations avec unread count
- ✅ Vue conversation avec messages en temps réel
- ✅ Envoi de messages avec optimistic updates
- ✅ Badge unread messages dans le header
- ✅ Intégration WebSocket pour temps réel
- ✅ Gestion d'erreurs et états de chargement
- ✅ Traductions FR/EN
- ✅ Standards de code respectés

Le système de messagerie est maintenant fonctionnel et prêt pour les tests utilisateurs.
