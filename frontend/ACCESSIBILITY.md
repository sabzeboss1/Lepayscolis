# Accessibility Implementation Guide

This document outlines the accessibility features implemented in the LePaysExpressColis frontend application to ensure WCAG 2.1 AA compliance.

## Overview

The application implements comprehensive accessibility features including:
- Keyboard navigation support
- ARIA labels and attributes
- Focus indicators
- Screen reader support
- Semantic HTML structure

## Keyboard Navigation

### Skip to Content Link
- **Location**: All pages (public and authenticated)
- **Activation**: Tab key on page load
- **Function**: Allows keyboard users to skip navigation and jump directly to main content
- **Implementation**: `SkipToContent` component in layouts

### Interactive Elements
All interactive elements support keyboard navigation:
- **Tab**: Move forward through focusable elements
- **Shift + Tab**: Move backward through focusable elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dropdowns
- **Arrow Keys**: Navigate within menus, rating stars, and accordions

### Focus Management
- **Dropdowns**: Focus returns to trigger button when closed with Escape
- **Modals**: Focus trapped within modal when open
- **Accordions**: Arrow keys navigate between accordion items
- **Rating Stars**: Arrow keys move between stars, Enter/Space to select

## ARIA Labels and Attributes

### Navigation
- `aria-label`: Descriptive labels for navigation regions
- `aria-current="page"`: Indicates current page in navigation
- `aria-expanded`: Shows accordion/dropdown state
- `role="navigation"`: Identifies navigation landmarks

### Forms
- `aria-invalid`: Indicates form field validation errors
- `aria-describedby`: Links error messages to form fields
- `aria-required`: Indicates required form fields
- `role="alert"`: Announces error messages to screen readers

### Dynamic Content
- `aria-live="polite"`: Announces non-critical updates
- `aria-live="assertive"`: Announces critical updates (errors, success messages)
- `aria-atomic="true"`: Announces entire region content on change
- `role="status"`: Identifies status messages

### Interactive Components
- `aria-label`: Provides accessible names for icon buttons
- `aria-hidden="true"`: Hides decorative icons from screen readers
- `role="button"`: Identifies clickable elements as buttons
- `role="menu"`: Identifies dropdown menus
- `role="menuitem"`: Identifies menu items

## Focus Indicators

### Visual Focus Rings
All focusable elements display visible focus indicators:
- **Color**: Blue (#2563eb) for primary focus
- **Width**: 2px outline
- **Offset**: 2px from element
- **Contrast**: Meets WCAG 2.1 AA requirements (3:1 minimum)

### High Contrast Mode
Enhanced focus indicators for users with high contrast preferences:
- **Width**: 3px outline
- **Offset**: 3px from element

### Dark Backgrounds
Focus indicators adapt for visibility on dark backgrounds:
- **Color**: White (#ffffff)
- **Shadow**: Additional box-shadow for better visibility

## Components with Accessibility Features

### Button Component
- Minimum 44px touch target
- Focus ring with keyboard navigation
- Disabled state with `aria-disabled`
- Loading state with spinner and status text

### Input Component
- Associated label with `htmlFor`
- Error messages with `aria-describedby`
- Required indicator with `aria-required`
- Validation state with `aria-invalid`

### RatingStars Component
- Keyboard navigation with arrow keys
- `role="radiogroup"` for interactive mode
- Individual star buttons with `aria-label`
- Focus management with roving tabindex

### HeaderPublic/HeaderApp Components
- Skip to content link
- Keyboard-accessible hamburger menu
- `aria-current` for active navigation items
- Escape key closes mobile menu

### FAQ Accordions
- `aria-expanded` indicates open/closed state
- `aria-controls` links button to content
- Keyboard activation with Enter/Space
- `role="region"` for accordion content

### LiveRegion Component
- Announces dynamic content changes
- Configurable politeness level
- Auto-clear after timeout
- Screen reader only (visually hidden)

## Testing Accessibility

### Keyboard Testing
1. Navigate entire application using only keyboard
2. Verify all interactive elements are reachable
3. Ensure focus indicators are visible
4. Test modal and dropdown focus trapping

### Screen Reader Testing
1. Test with NVDA (Windows) or VoiceOver (Mac)
2. Verify all content is announced correctly
3. Check form validation announcements
4. Test dynamic content updates

### Automated Testing
Run accessibility tests with jest-axe:
```bash
npm test -- --grep "accessibility"
```

### Manual Checks
- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all content

## Common Patterns

### Adding ARIA Labels to Icon Buttons
```tsx
<button aria-label="Close menu">
  <svg aria-hidden="true">...</svg>
</button>
```

### Announcing Dynamic Content
```tsx
import { LiveRegion } from '@/components/ui/LiveRegion';

function MyComponent() {
  const [message, setMessage] = useState('');
  
  return (
    <>
      <LiveRegion message={message} politeness="polite" />
      <button onClick={() => setMessage('Action completed')}>
        Do Something
      </button>
    </>
  );
}
```

### Creating Accessible Forms
```tsx
<Input
  label="Email"
  type="email"
  required
  error={errors.email?.message}
  aria-describedby="email-error"
/>
```

### Implementing Keyboard Navigation
```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleAction();
  }
};
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Keyboard Accessibility](https://webaim.org/techniques/keyboard/)

## Maintenance

When adding new components or features:
1. Ensure keyboard navigation support
2. Add appropriate ARIA labels
3. Implement visible focus indicators
4. Test with screen readers
5. Verify color contrast
6. Update this documentation

## Contact

For accessibility questions or issues, please contact the development team or file an issue in the project repository.
