/**
 * Phone Number Formatting Utility
 * Converts various phone formats to E.164 international format
 */

interface CountryPhoneConfig {
  code: string;
  prefix: string;
  length: number; // Expected length without prefix
  pattern: RegExp; // Regex to validate local number (without prefix/leading 0)
  example: string; // Example of a valid local number
}

// Country phone configurations with validation patterns
const COUNTRY_CONFIGS: Record<string, CountryPhoneConfig> = {
  FR: { code: 'FR', prefix: '+33', length: 9, pattern: /^[1-9]\d{8}$/, example: '612345678' },
  CI: { code: 'CI', prefix: '+225', length: 10, pattern: /^(01|05|07|21|25|27)\d{8}$/, example: '0123456789' },
  SN: { code: 'SN', prefix: '+221', length: 9, pattern: /^(70|75|76|77|78)\d{7}$/, example: '771234567' },
  ML: { code: 'ML', prefix: '+223', length: 8, pattern: /^[5-9]\d{7}$/, example: '70123456' },
  BF: { code: 'BF', prefix: '+226', length: 8, pattern: /^[5-7]\d{7}$/, example: '70123456' },
  BJ: { code: 'BJ', prefix: '+229', length: 8, pattern: /^(9[0-8]|6[0-9])\d{6}$/, example: '97123456' },
  TG: { code: 'TG', prefix: '+228', length: 8, pattern: /^(90|91|92|93|96|97|98|99|70|71)\d{6}$/, example: '90123456' },
  NE: { code: 'NE', prefix: '+227', length: 8, pattern: /^(80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|96|97)\d{6}$/, example: '90123456' },
  GN: { code: 'GN', prefix: '+224', length: 9, pattern: /^(620|621|622|623|624|625|626|627|628|629|660|661|662|664|655|656|657)\d{6}$/, example: '620123456' },
  CM: { code: 'CM', prefix: '+237', length: 9, pattern: /^[62]\d{8}$/, example: '612345678' },
  RU: { code: 'RU', prefix: '+7', length: 10, pattern: /^9\d{9}$/, example: '9123456789' },
};

/**
 * Clean phone number by removing all non-digit characters except leading +
 */
function cleanPhoneNumber(phone: string): string {
  // Keep the leading + if present, remove all other non-digits
  const hasPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? '+' + digits : digits;
}

/**
 * Format phone number to E.164 format based on country
 * 
 * @param phone - Phone number in any format
 * @param countryCode - ISO country code (e.g., 'FR', 'CI')
 * @returns Phone number in E.164 format or original if formatting fails
 */
export function formatPhoneToE164(phone: string, countryCode: string): string {
  if (!phone || !countryCode) {
    return phone;
  }

  const config = COUNTRY_CONFIGS[countryCode.toUpperCase()];
  if (!config) {
    // If country not in our config, return cleaned phone
    return cleanPhoneNumber(phone);
  }

  const cleaned = cleanPhoneNumber(phone);

  // Already in E.164 format with correct prefix
  if (cleaned.startsWith(config.prefix)) {
    return cleaned;
  }

  // Has + but different prefix - return as is (user might know better)
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Remove leading 0 if present (common in local formats)
  let digits = cleaned;
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // Add country prefix
  return config.prefix + digits;
}

/**
 * Validate if phone number is in valid E.164 format
 */
export function isValidE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Validate a phone number against the country-specific pattern
 * Returns an error message string if invalid, or null if valid
 */
export function validatePhoneForCountry(phone: string, countryCode: string): string | null {
  if (!phone) {
    return 'Numéro de téléphone requis';
  }
  if (!countryCode) {
    return 'Veuillez sélectionner un pays';
  }

  const config = COUNTRY_CONFIGS[countryCode.toUpperCase()];
  if (!config) {
    // No config for this country — only validate minimum length
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) {
      return 'Le numéro doit contenir au moins 6 chiffres';
    }
    return null;
  }

  // Extract local digits (without prefix or leading 0)
  let cleaned = cleanPhoneNumber(phone);

  // Strip the country prefix if present
  if (cleaned.startsWith(config.prefix)) {
    cleaned = cleaned.substring(config.prefix.length);
  } else if (cleaned.startsWith('+')) {
    return `Le préfixe ne correspond pas au pays sélectionné (${config.prefix})`;
  }

  // Remove leading 0
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Validate length
  if (cleaned.length !== config.length) {
    return `Le numéro doit contenir ${config.length} chiffres après le préfixe ${config.prefix}`;
  }

  // Validate pattern
  if (!config.pattern.test(cleaned)) {
    return `Format invalide pour ce pays. Exemple : ${config.prefix} ${config.example}`;
  }

  return null;
}

/**
 * Get the phone prefix for a country code
 */
export function getPhonePrefix(countryCode: string): string {
  const config = COUNTRY_CONFIGS[countryCode?.toUpperCase()];
  return config?.prefix || '';
}

/**
 * Get example phone format for a country
 */
export function getPhoneExample(countryCode: string): string {
  const config = COUNTRY_CONFIGS[countryCode.toUpperCase()];
  if (!config) {
    return '+1234567890';
  }

  const exampleDigits = '1'.repeat(config.length);
  return config.prefix + exampleDigits;
}

/**
 * Get phone placeholder text based on country
 */
export function getPhonePlaceholder(countryCode: string): string {
  if (!countryCode) {
    return 'Enter phone number';
  }

  const config = COUNTRY_CONFIGS[countryCode.toUpperCase()];
  if (!config) {
    return 'Enter phone number';
  }

  // Generate realistic examples
  const examples: Record<string, string> = {
    FR: '06 12 34 56 78',
    CI: '01 23 45 67 89',
    SN: '77 123 45 67',
    ML: '70 12 34 56',
    BF: '70 12 34 56',
    BJ: '97 12 34 56',
    TG: '90 12 34 56',
    NE: '90 12 34 56',
    GN: '620 12 34 56',
    CM: '6 12 34 56 78',
    RU: '912 345 67 89',
  };

  return examples[countryCode.toUpperCase()] || 'Enter phone number';
}

/**
 * Get helper text for phone input based on country
 */
export function getPhoneHelperText(countryCode: string): string {
  if (!countryCode) {
    return 'Select a country first';
  }

  const config = COUNTRY_CONFIGS[countryCode.toUpperCase()];
  if (!config) {
    return 'Enter in international format';
  }

  return `Format: ${config.prefix} followed by ${config.length} digits`;
}
