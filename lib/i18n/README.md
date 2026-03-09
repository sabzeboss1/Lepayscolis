# Internationalization (i18n) System

This directory contains the internationalization system for LePaysExpressColis, supporting French and English languages.

## Structure

- `config.ts` - Configuration for supported locales
- `LocaleContext.tsx` - React Context for managing locale state
- `useTranslation.ts` - Hook for accessing translations
- `translations/` - Translation files for each language
  - `en.json` - English translations
  - `fr.json` - French translations

## Usage

### 1. Wrap your app with LocaleProvider

```tsx
import { LocaleProvider } from '@/lib/i18n';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
```

### 2. Use translations in components

```tsx
import { useTranslation } from '@/lib/i18n';

export function MyComponent() {
  const { t, locale } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.login')}</h1>
      <p>{t('home.hero.title')}</p>
    </div>
  );
}
```

### 3. Use parameter interpolation

```tsx
const { t } = useTranslation();

// Translation: "Welcome back, {{name}}!"
const greeting = t('dashboard.welcome', { name: 'John' });
// Result: "Welcome back, John!"

// Translation: "© {{year}} LePaysExpressColis. All rights reserved."
const copyright = t('footer.copyright', { year: 2024 });
// Result: "© 2024 LePaysExpressColis. All rights reserved."
```

### 4. Change locale

```tsx
import { useLocale } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  
  return (
    <button onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}>
      {locale === 'fr' ? 'EN' : 'FR'}
    </button>
  );
}
```

## Features

- **Automatic persistence**: Selected locale is saved to localStorage
- **Parameter interpolation**: Use `{{param}}` syntax in translations
- **Nested keys**: Access translations with dot notation (e.g., `home.hero.title`)
- **Fallback**: Returns the key if translation is not found
- **Type-safe**: Full TypeScript support

## Adding New Translations

1. Add the key to both `en.json` and `fr.json`
2. Use nested objects for organization
3. Use `{{param}}` for dynamic values

Example:

```json
{
  "trips": {
    "greeting": "Hello {{name}}, you have {{count}} trips"
  }
}
```

## Translation Categories

- `common` - Common UI elements (buttons, labels)
- `navigation` - Navigation menu items
- `footer` - Footer content
- `auth` - Authentication pages
- `home` - Home page content
- `dashboard` - Dashboard content
- `trips` - Trip management
- `shipments` - Shipment management
- `messages` - Messaging system
- `profile` - User profile
- `ratings` - Rating system
- `kyc` - KYC verification
- `errors` - Error messages
- `validation` - Form validation messages
