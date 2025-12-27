# Web Directory Components

This directory contains reusable components for the Green Pages Web Directory application.

## Structure

```
components/
├── layout/          # Layout components (Header, Footer)
├── blocks/          # Content blocks (Hero, etc.)
└── README.md        # This file
```

## Layout Components

### Header
The header component displays the site navigation and branding. It supports:
- Dynamic content from API blocks
- RTL/LTR layouts
- Mobile-responsive design with hamburger menu
- Search functionality
- Customizable logo, navigation links, and colors

### Footer
The footer component displays site information and links. It supports:
- Dynamic content from API blocks
- Multiple link sections
- Social media links
- Company information
- RTL/LTR layouts
- Mobile-responsive grid layout

## Block Components

### HeroBlock
The hero block is displayed on the home page. It supports:
- Dynamic content from API blocks
- Customizable title, subtitle, and CTA buttons
- Search bar integration
- Background images or colors
- Adjustable height (small, medium, large)
- Optional statistics display
- RTL/LTR layouts

## Block System

Blocks are fetched from the API and can be customized through the admin panel. Each block has:
- `type`: The block type (HEADER, FOOTER, HOME_HERO)
- `target`: The target application (WEB_DIRECTORY)
- `schemaVersion`: Version of the settings schema
- `settingsJson`: JSON object containing block configuration
- `isEnabled`: Whether the block is active

### Default Settings

Each component provides sensible defaults if:
- The block is not found in the API
- The block is disabled
- The API request fails

This ensures the site remains functional even without configured blocks.

## Responsive Design

All components follow a mobile-first approach:
- Base styles target mobile devices (<768px)
- Tablet styles use `md:` prefix (768px-1024px)
- Desktop styles use `lg:` prefix (>1024px)
- Touch targets are minimum 44x44px for accessibility

## RTL Support

All components support both RTL (Arabic) and LTR (English) layouts:
- Text direction is automatically set based on locale
- Flex layouts are reversed for RTL
- Icons and buttons are positioned correctly
- Spacing and padding are mirrored

## Accessibility

Components follow accessibility best practices:
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus visible indicators
- Reduced motion support for users who prefer it

## Usage Example

```tsx
import { Header, Footer } from '@/components/layout';
import { HeroBlock } from '@/components/blocks';
import { apiClient } from '@/lib/api-client';

export default async function Page() {
  const locale = 'ar';
  
  // Fetch blocks
  const headerBlock = await apiClient.getBlock('HEADER', 'WEB_DIRECTORY');
  const footerBlock = await apiClient.getBlock('FOOTER', 'WEB_DIRECTORY');
  const heroBlock = await apiClient.getBlock('HOME_HERO', 'WEB_DIRECTORY');
  
  return (
    <>
      <Header block={headerBlock} locale={locale} />
      <main>
        <HeroBlock block={heroBlock} locale={locale} />
        {/* Page content */}
      </main>
      <Footer block={footerBlock} locale={locale} />
    </>
  );
}
```

## Future Enhancements

- Client-side mobile menu toggle
- Language switcher component
- User authentication UI
- Notification bell
- Advanced search filters
- Category navigation component
- Business card component
- Map component integration
