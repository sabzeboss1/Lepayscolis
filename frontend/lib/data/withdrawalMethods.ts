// Configuration des méthodes de retrait par pays

export interface PaymentMethodField {
  name: string;
  label: string;
  type: 'text' | 'tel' | 'email' | 'select';
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  pattern?: string;
  helpText?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  fields: PaymentMethodField[];
}

export interface CountryWithdrawalConfig {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  paymentMethods: PaymentMethod[];
}

// Configuration des méthodes de paiement par pays
export const WITHDRAWAL_CONFIGS: CountryWithdrawalConfig[] = [
  // Cameroun - Mobile Money (Orange Money, MTN Mobile Money)
  {
    countryCode: 'CM',
    countryName: 'Cameroun',
    currency: 'XAF',
    currencySymbol: 'FCFA',
    paymentMethods: [
      {
        id: 'orange_money',
        name: 'Orange Money',
        description: 'Retrait via Orange Money',
        fields: [
          {
            name: 'phone_number',
            label: 'Numéro Orange Money',
            type: 'tel',
            placeholder: '+237 6XX XX XX XX',
            required: true,
            pattern: '^\\+237[0-9]{9}$',
            helpText: 'Format: +237 suivi de 9 chiffres'
          },
          {
            name: 'account_name',
            label: 'Nom du titulaire',
            type: 'text',
            placeholder: 'Nom complet',
            required: true
          }
        ]
      },
      {
        id: 'mtn_mobile_money',
        name: 'MTN Mobile Money',
        description: 'Retrait via MTN Mobile Money',
        fields: [
          {
            name: 'phone_number',
            label: 'Numéro MTN Mobile Money',
            type: 'tel',
            placeholder: '+237 6XX XX XX XX',
            required: true,
            pattern: '^\\+237[0-9]{9}$',
            helpText: 'Format: +237 suivi de 9 chiffres'
          },
          {
            name: 'account_name',
            label: 'Nom du titulaire',
            type: 'text',
            placeholder: 'Nom complet',
            required: true
          }
        ]
      }
    ]
  },
  
  // Russie - Virement bancaire
  {
    countryCode: 'RU',
    countryName: 'Russie',
    currency: 'RUB',
    currencySymbol: '₽',
    paymentMethods: [
      {
        id: 'bank_transfer',
        name: 'Virement bancaire',
        description: 'Retrait par virement bancaire',
        fields: [
          {
            name: 'account_holder',
            label: 'Titulaire du compte',
            type: 'text',
            placeholder: 'Nom complet',
            required: true
          },
          {
            name: 'bank_name',
            label: 'Nom de la banque',
            type: 'text',
            placeholder: 'Ex: Sberbank',
            required: true
          },
          {
            name: 'account_number',
            label: 'Numéro de compte',
            type: 'text',
            placeholder: '20 chiffres',
            required: true,
            pattern: '^[0-9]{20}$',
            helpText: 'Compte bancaire russe (20 chiffres)'
          },
          {
            name: 'bik',
            label: 'Code BIK',
            type: 'text',
            placeholder: '9 chiffres',
            required: true,
            pattern: '^[0-9]{9}$',
            helpText: 'Code d\'identification bancaire (9 chiffres)'
          }
        ]
      }
    ]
  },
  
  // France - SEPA
  {
    countryCode: 'FR',
    countryName: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    paymentMethods: [
      {
        id: 'sepa_transfer',
        name: 'Virement SEPA',
        description: 'Retrait par virement SEPA',
        fields: [
          {
            name: 'account_holder',
            label: 'Titulaire du compte',
            type: 'text',
            placeholder: 'Nom complet',
            required: true
          },
          {
            name: 'iban',
            label: 'IBAN',
            type: 'text',
            placeholder: 'FR76 XXXX XXXX XXXX XXXX XXXX XXX',
            required: true,
            pattern: '^FR[0-9]{2}[0-9A-Z]{23}$',
            helpText: 'IBAN français (27 caractères)'
          },
          {
            name: 'bic',
            label: 'Code BIC/SWIFT',
            type: 'text',
            placeholder: 'BNPAFRPPXXX',
            required: false,
            pattern: '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$',
            helpText: 'Code BIC (8 ou 11 caractères)'
          }
        ]
      }
    ]
  },
  
  // Côte d'Ivoire - Mobile Money
  {
    countryCode: 'CI',
    countryName: "Côte d'Ivoire",
    currency: 'XOF',
    currencySymbol: 'FCFA',
    paymentMethods: [
      {
        id: 'orange_money',
        name: 'Orange Money',
        description: 'Retrait via Orange Money',
        fields: [
          {
            name: 'phone_number',
            label: 'Numéro Orange Money',
            type: 'tel',
            placeholder: '+225 XX XX XX XX XX',
            required: true,
            pattern: '^\\+225[0-9]{10}$',
            helpText: 'Format: +225 suivi de 10 chiffres'
          },
          {
            name: 'account_name',
            label: 'Nom du titulaire',
            type: 'text',
            placeholder: 'Nom complet',
            required: true
          }
        ]
      },
      {
        id: 'mtn_mobile_money',
        name: 'MTN Mobile Money',
        description: 'Retrait via MTN Mobile Money',
        fields: [
          {
            name: 'phone_number',
            label: 'Numéro MTN Mobile Money',
            type: 'tel',
            placeholder: '+225 XX XX XX XX XX',
            required: true,
            pattern: '^\\+225[0-9]{10}$',
            helpText: 'Format: +225 suivi de 10 chiffres'
          },
          {
            name: 'account_name',
            label: 'Nom du titulaire',
            type: 'text',
            placeholder: 'Nom complet',
            required: true
          }
        ]
      }
    ]
  },
  
  // Sénégal - Mobile Money
  {
    countryCode: 'SN',
    countryName: 'Sénégal',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    paymentMethods: [
      {
        id: 'orange_money',
        name: 'Orange Money',
        description: 'Retrait via Orange Money',
        fields: [
          {
            name: 'phone_number',
            label: 'Numéro Orange Money',
            type: 'tel',
            placeholder: '+221 XX XXX XX XX',
            required: true,
            pattern: '^\\+221[0-9]{9}$',
            helpText: 'Format: +221 suivi de 9 chiffres'
          },
          {
            name: 'account_name',
            label: 'Nom du titulaire',
            type: 'text',
            placeholder: 'Nom complet',
            required: true
          }
        ]
      }
    ]
  },
  
  // Belgique - SEPA
  {
    countryCode: 'BE',
    countryName: 'Belgique',
    currency: 'EUR',
    currencySymbol: '€',
    paymentMethods: [
      {
        id: 'sepa_transfer',
        name: 'Virement SEPA',
        description: 'Retrait par virement SEPA',
        fields: [
          {
            name: 'account_holder',
            label: 'Titulaire du compte',
            type: 'text',
            placeholder: 'Nom complet',
            required: true
          },
          {
            name: 'iban',
            label: 'IBAN',
            type: 'text',
            placeholder: 'BE68 XXXX XXXX XXXX',
            required: true,
            pattern: '^BE[0-9]{2}[0-9]{12}$',
            helpText: 'IBAN belge (16 caractères)'
          },
          {
            name: 'bic',
            label: 'Code BIC/SWIFT',
            type: 'text',
            placeholder: 'GEBABEBB',
            required: false,
            pattern: '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$'
          }
        ]
      }
    ]
  },
  
  // Canada - Virement bancaire
  {
    countryCode: 'CA',
    countryName: 'Canada',
    currency: 'CAD',
    currencySymbol: '$',
    paymentMethods: [
      {
        id: 'bank_transfer',
        name: 'Virement bancaire',
        description: 'Retrait par virement bancaire',
        fields: [
          {
            name: 'account_holder',
            label: 'Titulaire du compte',
            type: 'text',
            placeholder: 'Nom complet',
            required: true
          },
          {
            name: 'bank_name',
            label: 'Nom de la banque',
            type: 'text',
            placeholder: 'Ex: RBC, TD, Scotiabank',
            required: true
          },
          {
            name: 'transit_number',
            label: 'Numéro de transit',
            type: 'text',
            placeholder: '5 chiffres',
            required: true,
            pattern: '^[0-9]{5}$',
            helpText: 'Numéro de transit (5 chiffres)'
          },
          {
            name: 'institution_number',
            label: 'Numéro d\'institution',
            type: 'text',
            placeholder: '3 chiffres',
            required: true,
            pattern: '^[0-9]{3}$',
            helpText: 'Numéro d\'institution (3 chiffres)'
          },
          {
            name: 'account_number',
            label: 'Numéro de compte',
            type: 'text',
            placeholder: '7-12 chiffres',
            required: true,
            pattern: '^[0-9]{7,12}$',
            helpText: 'Numéro de compte (7-12 chiffres)'
          }
        ]
      }
    ]
  }
];

// Fonction pour obtenir la configuration d'un pays
export const getWithdrawalConfig = (countryCode: string): CountryWithdrawalConfig | undefined => {
  return WITHDRAWAL_CONFIGS.find(config => config.countryCode === countryCode);
};

// Fonction pour obtenir tous les pays supportés
export const getSupportedCountries = (): { code: string; name: string }[] => {
  return WITHDRAWAL_CONFIGS.map(config => ({
    code: config.countryCode,
    name: config.countryName
  }));
};

// Fonction pour formater le montant selon la devise
export const formatAmount = (amount: number, currency: string, currencySymbol: string): string => {
  return `${amount.toFixed(2)} ${currencySymbol}`;
};
