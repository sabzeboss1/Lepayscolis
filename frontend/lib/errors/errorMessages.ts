/**
 * Centralized error messages for consistent user-friendly feedback
 */

// Validation error messages in French
export const VALIDATION_MESSAGES_FR: Record<string, string> = {
  // Common validation
  'required': 'Ce champ est obligatoire',
  'string': 'Ce champ doit être du texte',
  'numeric': 'Ce champ doit être un nombre',
  'integer': 'Ce champ doit être un nombre entier',
  'email': 'L\'adresse email est invalide',
  'url': 'L\'URL n\'est pas valide',
  'date': 'La date n\'est pas valide',
  'boolean': 'La valeur doit être vraie ou fausse',
  'array': 'Ce champ doit être une liste',
  
  // String validation
  'min.string': 'Ce champ doit contenir au moins :min caractères',
  'max.string': 'Ce champ ne doit pas dépasser :max caractères',
  'size.string': 'Ce champ doit contenir exactement :size caractères',
  
  // Numeric validation
  'min.numeric': 'La valeur doit être supérieure ou égale à :min',
  'max.numeric': 'La valeur doit être inférieure ou égale à :max',
  'between.numeric': 'La valeur doit être entre :min et :max',
  'gt': 'La valeur doit être supérieure à :value',
  'gte': 'La valeur doit être supérieure ou égale à :value',
  'lt': 'La valeur doit être inférieure à :value',
  'lte': 'La valeur doit être inférieure ou égale à :value',
  
  // Date validation
  'after': 'La date doit être après :date',
  'after_or_equal': 'La date doit être égale ou après :date',
  'before': 'La date doit être avant :date',
  'before_or_equal': 'La date doit être égale ou avant :date',
  'date_format': 'Le format de date doit être :format',
  
  // File validation
  'file': 'Le fichier n\'est pas valide',
  'image': 'Le fichier doit être une image',
  'mimes': 'Le fichier doit être de type: :values',
  'mimetypes': 'Le type de fichier n\'est pas autorisé',
  'max.file': 'Le fichier ne doit pas dépasser :max Ko',
  'dimensions': 'Les dimensions de l\'image ne sont pas valides',
  
  // Relationships
  'exists': 'La valeur sélectionnée n\'existe pas',
  'unique': 'Cette valeur est déjà utilisée',
  'distinct': 'Ce champ contient des doublons',
  
  // Confirmed fields
  'confirmed': 'La confirmation ne correspond pas',
  'same': 'Ce champ doit correspondre à :other',
  'different': 'Ce champ doit être différent de :other',
  
  // Other
  'in': 'La valeur sélectionnée n\'est pas valide',
  'not_in': 'La valeur sélectionnée n\'est pas autorisée',
  'regex': 'Le format n\'est pas valide',
  'alpha': 'Ce champ ne doit contenir que des lettres',
  'alpha_dash': 'Ce champ ne doit contenir que des lettres, chiffres, tirets et underscores',
  'alpha_num': 'Ce champ ne doit contenir que des lettres et chiffres',
  'accepted': 'Ce champ doit être accepté',
  'declined': 'Ce champ doit être refusé',
  'json': 'Ce champ doit être un JSON valide',
  'timezone': 'Le fuseau horaire n\'est pas valide',
  'uploaded': 'Le téléchargement du fichier a échoué',
};

// Field-specific translations
export const FIELD_NAMES_FR: Record<string, string> = {
  // Shipment Request fields
  'title': 'le titre',
  'description': 'la description',
  'weight': 'le poids',
  'length': 'la longueur',
  'width': 'la largeur',
  'height': 'la hauteur',
  'declared_value': 'la valeur déclarée',
  'package_type': 'le type de colis',
  'recipient_name': 'le nom du destinataire',
  'recipient_phone': 'le téléphone du destinataire',
  'pickup_country_id': 'le pays de récupération',
  'pickup_city_id': 'la ville de récupération',
  'pickup_address': 'l\'adresse de récupération',
  'delivery_country_id': 'le pays de livraison',
  'delivery_city_id': 'la ville de livraison',
  'delivery_address': 'l\'adresse de livraison',
  'max_budget': 'le budget maximum',
  'currency_code': 'la devise',
  'needed_by': 'la date limite',
  'photo_urls': 'les photos',
  
  // User fields
  'name': 'le nom',
  'email': 'l\'email',
  'password': 'le mot de passe',
  'password_confirmation': 'la confirmation du mot de passe',
  'phone': 'le numéro de téléphone',
  'address': 'l\'adresse',
  'city': 'la ville',
  'country': 'le pays',
  'postal_code': 'le code postal',
  
  // Trip fields
  'departure_country_id': 'le pays de départ',
  'departure_city_id': 'la ville de départ',
  'arrival_country_id': 'le pays d\'arrivée',
  'arrival_city_id': 'la ville d\'arrivée',
  'departure_date': 'la date de départ',
  'arrival_date': 'la date d\'arrivée',
  'available_weight': 'le poids disponible',
  'price_per_kg': 'le prix par kg',
  
  // Payment fields
  'amount': 'le montant',
  'method': 'la méthode de paiement',
  'card_number': 'le numéro de carte',
  'cvv': 'le code CVV',
  'expiry_date': 'la date d\'expiration',
};

// Specific error messages by field and rule
export const SPECIFIC_ERROR_MESSAGES_FR: Record<string, Record<string, string>> = {
  'weight': {
    'min.numeric': 'Le poids minimum est de 0,1 kg',
    'max.numeric': 'Le poids maximum est de 50 kg',
    'required': 'Le poids du colis est obligatoire',
  },
  'declared_value': {
    'min.numeric': 'La valeur déclarée ne peut pas être négative',
    'required': 'La valeur déclarée est obligatoire',
  },
  'max_budget': {
    'min.numeric': 'Le budget ne peut pas être négatif',
  },
  'pickup_country_id': {
    'required': 'Sélectionnez un pays de récupération',
    'exists': 'Le pays de récupération sélectionné n\'existe pas',
  },
  'pickup_city_id': {
    'required': 'Sélectionnez une ville de récupération',
    'exists': 'La ville de récupération sélectionnée n\'existe pas',
  },
  'delivery_country_id': {
    'required': 'Sélectionnez un pays de livraison',
    'exists': 'Le pays de livraison sélectionné n\'existe pas',
  },
  'delivery_city_id': {
    'required': 'Sélectionnez une ville de livraison',
    'exists': 'La ville de livraison sélectionnée n\'existe pas',
  },
  'needed_by': {
    'after': 'La date limite doit être dans le futur',
    'date': 'La date limite n\'est pas valide',
  },
  'email': {
    'email': 'Veuillez entrer une adresse email valide (ex: nom@exemple.com)',
    'unique': 'Cette adresse email est déjà utilisée',
  },
  'password': {
    'min.string': 'Le mot de passe doit contenir au moins 8 caractères',
    'confirmed': 'Les mots de passe ne correspondent pas',
  },
  'phone': {
    'regex': 'Le format du numéro de téléphone n\'est pas valide (ex: +33 6 12 34 56 78)',
  },
};

/**
 * Translate Laravel validation error message to user-friendly French
 */
export function translateErrorMessage(
  field: string, 
  message: string, 
  locale: string = 'fr'
): string {
  if (locale !== 'fr') {
    return message; // Return original message for non-French locales
  }

  // Check for specific field + rule combination first
  const normalizedField = field.replace(/\.\d+/g, ''); // Remove array indices
  const specificMessages = SPECIFIC_ERROR_MESSAGES_FR[normalizedField];
  
  if (specificMessages) {
    for (const [rulePattern, specificMessage] of Object.entries(specificMessages)) {
      if (message.toLowerCase().includes(rulePattern.split('.')[0])) {
        return specificMessage;
      }
    }
  }

  // Try to match common patterns
  const lowerMessage = message.toLowerCase();
  
  // "The field is required" patterns
  if (lowerMessage.includes('required') || lowerMessage.includes('obligatoire')) {
    const fieldName = FIELD_NAMES_FR[normalizedField] || normalizedField;
    return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} est obligatoire`;
  }

  // "The field must be..." patterns
  if (lowerMessage.includes('must be') || lowerMessage.includes('doit être')) {
    // Numeric validations
    if (lowerMessage.includes('at least') || lowerMessage.includes('minimum')) {
      const match = message.match(/(\d+\.?\d*)/);
      const value = match ? match[1] : '';
      const fieldName = FIELD_NAMES_FR[normalizedField] || normalizedField;
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} doit être au minimum ${value}`;
    }
    
    if (lowerMessage.includes('at most') || lowerMessage.includes('maximum')) {
      const match = message.match(/(\d+\.?\d*)/);
      const value = match ? match[1] : '';
      const fieldName = FIELD_NAMES_FR[normalizedField] || normalizedField;
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} ne peut pas dépasser ${value}`;
    }
  }

  // "The field format is invalid" patterns
  if (lowerMessage.includes('format') || lowerMessage.includes('invalid')) {
    const fieldName = FIELD_NAMES_FR[normalizedField] || normalizedField;
    return `Le format de ${fieldName} n'est pas valide`;
  }

  // "The selected field is invalid" patterns
  if (lowerMessage.includes('selected') || lowerMessage.includes('sélectionné')) {
    const fieldName = FIELD_NAMES_FR[normalizedField] || normalizedField;
    return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} sélectionné(e) n'est pas valide`;
  }

  // Check general validation messages
  for (const [key, translation] of Object.entries(VALIDATION_MESSAGES_FR)) {
    if (lowerMessage.includes(key)) {
      return translation.replace(':attribute', FIELD_NAMES_FR[normalizedField] || normalizedField);
    }
  }

  // If no translation found, try to make the original message more readable
  return message
    .replace(/^The /i, '')
    .replace(/ field/i, '')
    .replace(normalizedField, FIELD_NAMES_FR[normalizedField] || normalizedField);
}

/**
 * Translate all validation errors from backend response
 */
export function translateValidationErrors(
  errors: Record<string, string[]>,
  locale: string = 'fr'
): Record<string, string> {
  const translated: Record<string, string> = {};
  
  for (const [field, messages] of Object.entries(errors)) {
    if (messages && messages.length > 0) {
      translated[field] = translateErrorMessage(field, messages[0], locale);
    }
  }
  
  return translated;
}

/**
 * Get a user-friendly summary error message
 */
export function getErrorSummary(
  errors: Record<string, string>,
  locale: string = 'fr'
): string {
  const errorCount = Object.keys(errors).length;
  
  if (errorCount === 0) {
    return locale === 'fr' 
      ? 'Une erreur est survenue' 
      : 'An error occurred';
  }
  
  if (errorCount === 1) {
    return locale === 'fr'
      ? 'Veuillez corriger l\'erreur ci-dessous'
      : 'Please correct the error below';
  }
  
  return locale === 'fr'
    ? `Veuillez corriger les ${errorCount} erreurs ci-dessous`
    : `Please correct the ${errorCount} errors below`;
}
