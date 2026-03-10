# Layout Components

This directory contains the main layout components for the LePaysExpressColis frontend application.

## Components

### HeaderPublic

The public header component used on non-authenticated pages (home, how-it-works, security, etc.).

**Features:**
- Navigation links: Home, How It Works, Security, Destinations, FAQ
- Language switcher (FR/EN)
- Login and Register CTAs
- Mobile hamburger menu
- Sticky positioning on scroll
- Active link highlighting

**Usage:**
```tsx
import { HeaderPublic } from '@/components/layout';

<HeaderPublic locale="en" />
```

### HeaderApp

The authenticated header component used on app pages (dashboard, trips, shipments, messages).

**Features:**
- Navigation links: Dashboard, Trips, Shipments, Messages
- Notification badge for unread messages
- User avatar with dropdown menu
- Language switcher
- Mobile hamburger menu
- Recommended badge display in user menu
- Active link highlighting

**Usage:**
```tsx
import { HeaderApp } from '@/components/layout';

<HeaderApp 
  user={currentUser} 
  locale="en" 
  unreadMessages={5} 
/>
```

### Footer

The footer component used on all pages.

**Features:**
- Company information and branding
- Navigation links (About, Contact, Terms, Privacy)
- Resource links (How It Works, Security, FAQ)
- Social media links (Facebook, Twitter, Instagram, LinkedIn)
- Copyright notice with dynamic year
- Language switcher
- Responsive grid layout

**Usage:**
```tsx
import { Footer } from '@/components/layout';

<Footer locale="en" />
```

## Accessibility

All layout components follow WCAG 2.1 AA guidelines:

- Minimum 44px touch targets for all interactive elements
- Keyboard navigation support with visible focus indicators
- ARIA labels for icon buttons and navigation
- Semantic HTML structure
- Screen reader support
- Proper heading hierarchy

## Responsive Design

All components are mobile-first and responsive:

- **Mobile (< 768px):** Hamburger menu, stacked layout
- **Tablet (768px - 1024px):** Optimized spacing, some desktop features
- **Desktop (> 1024px):** Full navigation, multi-column layouts

## Internationalization

All components support French and English languages through the i18n system:

- Language switcher persists selection to localStorage
- All text content is translated
- Language changes update content without page reload

## Demo

Visit `/layout-demo` to see all layout components in action with interactive examples.

## Requirements Validated

- **Requirement 1.6:** Public page consistency with header and footer
- **Requirement 14.1:** HeaderPublic component with navigation and language switcher
- **Requirement 14.2:** HeaderApp component with user menu and notifications
- **Requirement 14.3:** Footer component with company info and links
