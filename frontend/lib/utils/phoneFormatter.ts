/**
 * Phone Number Formatting Utility
 * Converts various phone formats to E.164 international format
 */

interface CountryPhoneConfig {
  code: string;
  prefix: string;
  length: number; // Expected length without prefix
}

// Country phone configurations
const COUNTRY_CONFIGS: Record<string, CountryPhoneConfig> = {
  FR: { code: 'FR', prefix: '+33', length: 9 },
  CI: { code: 'CI', prefix: '+225', length: 10 },
  SN: { code: 'SN', prefix: '+221', length: 9 },
  ML: { code: 'ML', prefix: '+223', length: 8 },
  BF: { code: 'BF', prefix: '+226', length: 8 },
  BJ: { code: 'BJ', prefix: '+229', length: 8 },
  TG: { code: 'TG', prefix: '+228', length: 8 },
  NE: { code: 'NE', prefix: '+227', length: 8 },
  GN: { code: 'GN', prefix: '+224', length: 9 },
  CM: { code: 'CM', prefix: '+237', length: 9 },
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
