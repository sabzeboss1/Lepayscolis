# Phase 4: Gestion du Profil et KYC - Documentation Complète

## Vue d'ensemble

Cette phase implémente l'intégration complète entre le frontend et le backend Laravel pour la gestion du profil utilisateur et le système KYC (Know Your Customer). Toutes les données mockées ont été remplacées par des appels API réels avec gestion d'erreurs, validation côté client, et notifications utilisateur.

## Composants implémentés

### 1. FileUploadService (`lib/services/FileUploadService.ts`)

Service centralisé pour la gestion des uploads de fichiers avec les fonctionnalités suivantes:

#### Fonctionnalités principales

- **Validation de fichiers**: Taille maximale (5MB), formats autorisés (JPEG, PNG, PDF)
- **Compression d'images**: Réduction automatique de la taille des images avant upload
- **Suivi de progression**: Callback pour afficher la progression d'upload
- **Support multi-fichiers**: Upload de plusieurs fichiers simultanément
- **Génération de previews**: Création de previews pour les images

#### Options de configuration prédéfinies

```typescript
DEFAULT_UPLOAD_OPTIONS = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    compress: true,
    maxWidth: 1920,
    maxHeight: 1920,
  },
  document: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    compress: false,
  },
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    compress: true,
    maxWidth: 512,
    maxHeight: 512,
  },
}
```

#### Méthodes principales

- `validateFile(file, options)`: Valide un fichier selon les options
- `compressImage(file, maxWidth, maxHeight, quality)`: Compresse une image
- `uploadFile(endpoint, file, options, onProgress)`: Upload un fichier unique
- `uploadMultiple(endpoint, files, options, onProgress)`: Upload plusieurs fichiers
- `createPreview(file)`: Crée une preview pour une image
- `formatFileSize(bytes)`: Formate la taille d'un fichier pour l'affichage

#### Exemple d'utilisation

```typescript
import { FileUploadService, DEFAULT_UPLOAD_OPTIONS } from '@/lib/services/FileUploadService';

// Valider un fichier
const validation = FileUploadService.validateFile(file, DEFAULT_UPLOAD_OPTIONS.document);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Upload avec progression
const result = await FileUploadService.uploadFile(
  '/api/kyc/submit',
  file,
  DEFAULT_UPLOAD_OPTIONS.document,
  (progress) => {
    console.log(`Upload: ${progress.percentage}%`);
  }
);

console.log('Uploaded:', result.url);
```

### 2. useFileUpload Hook (`lib/hooks/useFileUpload.ts`)

Hook React personnalisé pour gérer les uploads de fichiers avec drag-and-drop.

#### Fonctionnalités

- **Gestion d'état**: Files, previews, progress, errors
- **Drag & Drop**: Support complet du glisser-déposer
- **Validation automatique**: Validation des fichiers lors de l'ajout
- **Preview automatique**: Génération de previews pour les images
- **Auto-upload**: Option pour uploader automatiquement après sélection

#### Interface

```typescript
interface UseFileUploadReturn {
  files: File[];
  previews: string[];
  progress: number;
  isUploading: boolean;
  error: string | null;
  addFiles: (newFiles: File[]) => Promise<void>;
  removeFile: (index: number) => void;
  upload: (endpoint?: string) => Promise<UploadResult[]>;
  reset: () => void;
  isDragging: boolean;
  dragProps: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}
```

#### Exemple d'utilisation

```typescript
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { DEFAULT_UPLOAD_OPTIONS } from '@/lib/services/FileUploadService';

function MyComponent() {
  const {
    files,
    previews,
    progress,
    isUploading,
    error,
    addFiles,
    removeFile,
    upload,
    reset,
    isDragging,
    dragProps,
  } = useFileUpload({
    ...DEFAULT_UPLOAD_OPTIONS.document,
    multiple: false,
    endpoint: '/api/kyc/submit',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await addFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    try {
      const results = await upload();
      console.log('Upload successful:', results);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div {...dragProps} className={isDragging ? 'dragging' : ''}>
      <input type="file" onChange={handleFileSelect} />
      {error && <p className="error">{error}</p>}
      {isUploading && <p>Uploading: {progress}%</p>}
      <button onClick={handleUpload} disabled={isUploading || files.length === 0}>
        Upload
      </button>
    </div>
  );
}
```

### 3. Page Profil Utilisateur (`app/(app)/profile/page.tsx`)

Page de profil utilisateur avec intégration API complète.

#### Fonctionnalités implémentées

- **Chargement des données utilisateur**: Fetch depuis `/api/user`
- **Affichage des ratings**: Fetch depuis `/api/users/{id}/ratings`
- **Statistiques utilisateur**: Voyages, colis, gains, taux de succès
- **Statut KYC**: Affichage du statut de vérification avec actions
- **Onglets**: Vue d'ensemble, Avis, Activité
- **Badges**: Affichage des badges et réalisations
- **Actions rapides**: Liens vers les fonctionnalités principales

#### Endpoints utilisés

- `GET /api/user`: Récupérer les données utilisateur
- `GET /api/users/{id}/ratings`: Récupérer les avis utilisateur

#### États de chargement

- Skeleton UI pendant le chargement initial
- Spinners pour les actions asynchrones
- Messages d'erreur clairs en cas d'échec

### 4. Page KYC (`app/(app)/kyc/page.tsx`)

Page de soumission et suivi des documents KYC avec intégration API complète.

#### Fonctionnalités implémentées

- **Fetch du statut KYC**: Récupération depuis `/api/kyc/status`
- **Soumission de documents**: Upload vers `/api/kyc/submit`
- **Types de documents supportés**:
  - Passeport (1 fichier)
  - Carte d'identité (2 fichiers: recto + verso)
  - Permis de conduire (1 fichier)
  - Justificatif de domicile (1 fichier)
- **Selfie avec document**: Validation de l'identité
- **Validation côté client**: Taille (max 5MB), formats (JPEG, PNG, PDF)
- **Affichage du statut**: Pending, Approved, Rejected avec raisons
- **Messages de feedback**: Success/error notifications

#### Endpoints utilisés

- `GET /api/kyc/status`: Récupérer le statut KYC
- `POST /api/kyc/submit`: Soumettre les documents KYC

#### Validation des fichiers

```typescript
// Validation automatique avant soumission
const documentValidation = FileUploadService.validateFile(
  documentFile,
  DEFAULT_UPLOAD_OPTIONS.document
);

if (!documentValidation.valid) {
  setError(documentValidation.error);
  return;
}
```

#### Format de soumission

```typescript
const formData = new FormData();
formData.append('document_type', documentType); // passport, id_card, driver_license
formData.append('document_file', documentFile);
if (documentBackFile) {
  formData.append('document_back_file', documentBackFile); // Pour carte d'identité
}
formData.append('selfie_file', selfieFile);
```

## Flux utilisateur

### Flux de soumission KYC

1. **Accès à la page KYC**: `/kyc`
2. **Vérification du statut**: Fetch automatique du statut KYC existant
3. **Sélection du type de document**: Passeport, Carte d'identité, ou Permis
4. **Upload du document principal**: Validation automatique (taille, format)
5. **Upload du verso** (si carte d'identité): Validation automatique
6. **Upload du selfie**: Validation automatique
7. **Soumission**: Envoi au backend avec FormData
8. **Feedback**: Message de succès ou d'erreur
9. **Mise à jour du statut**: Affichage du statut "pending"

### Flux de mise à jour du profil

1. **Accès à la page profil**: `/profile`
2. **Chargement des données**: Fetch user data et ratings
3. **Affichage des informations**: Profil, stats, badges, avis
4. **Modification**: Clic sur "Modifier le profil" → `/profile/edit`
5. **Mise à jour**: PUT `/api/user` avec nouvelles données
6. **Notification**: Toast de succès ou d'erreur

## Gestion d'erreurs

### Erreurs de validation

```typescript
// Fichier trop volumineux
{
  valid: false,
  error: "Le fichier est trop volumineux. Taille maximale: 5.0 MB"
}

// Type de fichier invalide
{
  valid: false,
  error: "Type de fichier non autorisé. Formats acceptés: JPEG, PNG, PDF"
}
```

### Erreurs API

```typescript
try {
  const response = await apiClient.get(API_ENDPOINTS.kyc.status);
  setKycDocument(response.document);
} catch (err: any) {
  if (err.status === 404) {
    // Pas de document KYC soumis, c'est normal
  } else {
    setError('Erreur lors du chargement du statut KYC');
  }
}
```

### Erreurs d'upload

```typescript
try {
  const result = await FileUploadService.uploadFile(endpoint, file, options);
  setSuccess('Upload réussi');
} catch (err) {
  setError(err.message || 'Upload échoué');
}
```

## Optimisations

### Compression d'images

Les images sont automatiquement compressées avant upload pour réduire la bande passante:

```typescript
// Compression automatique pour les images
if (options?.compress && file.type.startsWith('image/')) {
  fileToUpload = await FileUploadService.compressImage(
    file,
    options.maxWidth || 1920,
    options.maxHeight || 1920,
    0.8 // 80% quality
  );
}
```

### Suivi de progression

Utilisation de XMLHttpRequest pour le suivi de progression en temps réel:

```typescript
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentage = Math.round((e.loaded / e.total) * 100);
    onProgress({ loaded: e.loaded, total: e.total, percentage });
  }
});
```

### Validation côté client

Validation immédiate avant l'envoi pour éviter les requêtes inutiles:

```typescript
// Validation avant soumission
const validation = FileUploadService.validateFile(file, options);
if (!validation.valid) {
  throw new Error(validation.error);
}
```

## Sécurité

### Authentification

Tous les appels API incluent le token d'authentification:

```typescript
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('auth-token='))
  ?.split('=')[1];

xhr.setRequestHeader('Authorization', `Bearer ${token}`);
```

### Protection CSRF

Les requêtes state-changing incluent le token CSRF:

```typescript
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN='))
  ?.split('=')[1];

xhr.setRequestHeader('X-XSRF-TOKEN', decodeURIComponent(csrfToken));
```

### Validation des fichiers

Validation stricte des types et tailles de fichiers:

```typescript
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const maxSize = 5 * 1024 * 1024; // 5MB

if (!allowedTypes.includes(file.type)) {
  throw new Error('Type de fichier non autorisé');
}

if (file.size > maxSize) {
  throw new Error('Fichier trop volumineux');
}
```

## Tests

### Tests de validation

```typescript
// Test: Fichier trop volumineux
const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', {
  type: 'image/jpeg',
});
const result = FileUploadService.validateFile(largeFile, DEFAULT_UPLOAD_OPTIONS.image);
expect(result.valid).toBe(false);
expect(result.error).toContain('trop volumineux');

// Test: Type de fichier invalide
const invalidFile = new File(['content'], 'file.txt', { type: 'text/plain' });
const result2 = FileUploadService.validateFile(invalidFile, DEFAULT_UPLOAD_OPTIONS.image);
expect(result2.valid).toBe(false);
expect(result2.error).toContain('non autorisé');
```

### Tests d'intégration

```typescript
// Test: Soumission KYC complète
test('should submit KYC documents successfully', async () => {
  const documentFile = new File(['content'], 'passport.jpg', { type: 'image/jpeg' });
  const selfieFile = new File(['content'], 'selfie.jpg', { type: 'image/jpeg' });

  const formData = new FormData();
  formData.append('document_type', 'passport');
  formData.append('document_file', documentFile);
  formData.append('selfie_file', selfieFile);

  const response = await fetch('/api/kyc/submit', {
    method: 'POST',
    body: formData,
  });

  expect(response.ok).toBe(true);
  const data = await response.json();
  expect(data.document.status).toBe('pending');
});
```

## Accessibilité

### Labels et descriptions

Tous les champs de formulaire ont des labels clairs:

```tsx
<label className="block text-sm font-medium text-gray-700 mb-2">
  Passeport (Première page)
  <span className="text-red-500 ml-1">*</span>
</label>
```

### Messages d'erreur

Les erreurs sont affichées de manière accessible:

```tsx
{error && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
    <p className="text-sm text-red-700">{error}</p>
  </div>
)}
```

### États de chargement

Les états de chargement sont annoncés:

```tsx
{isLoading && (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">{t('common.loading')}</p>
    </div>
  </div>
)}
```

## Internationalisation

Tous les textes utilisent le système de traduction:

```typescript
import { useTranslation } from '@/lib/i18n/useTranslation';

const { t } = useTranslation();

// Utilisation
<p>{t('kyc.title')}</p>
<p>{t('kyc.description')}</p>
<Button>{t('kyc.submitDocument')}</Button>
```

## Prochaines étapes

### Phase 5: Gestion des Trips

- Implémenter création de trip avec validation
- Intégrer recherche de trips avec filtres
- Gérer mises à jour de statut en temps réel

### Phase 6: Gestion des Shipments

- Implémenter création de shipment avec upload photos
- Intégrer acceptation par voyageur
- Gérer timeline de statut visuelle

### Phase 7: Système de Paiement

- Intégrer Stripe checkout
- Gérer webhooks de paiement
- Afficher statut de paiement en temps réel

## Références

- **Requirements**: `.kiro/specs/frontend-backend-integration/requirements.md`
- **Design**: `.kiro/specs/frontend-backend-integration/design.md`
- **Tasks**: `.kiro/specs/frontend-backend-integration/tasks.md`
- **Backend API**: `lepaysexpresscolis-backend/routes/api.php`
- **Backend KYC Controller**: `lepaysexpresscolis-backend/app/Http/Controllers/KYCController.php`

## Conclusion

La Phase 4 est maintenant complète avec:

✅ Service d'upload de fichiers avec validation et compression
✅ Hook personnalisé pour drag-and-drop
✅ Page profil avec intégration API
✅ Page KYC avec soumission de documents
✅ Gestion d'erreurs robuste
✅ Validation côté client
✅ Notifications utilisateur
✅ Support multilingue
✅ Accessibilité WCAG AA

Toutes les données mockées ont été remplacées par des appels API réels vers le backend Laravel.
