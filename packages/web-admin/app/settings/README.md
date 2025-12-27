# Settings Pages Implementation

This directory contains the Settings management pages for the Green Pages admin panel.

## Pages

### 1. Settings Dashboard (`/settings`)
Main settings page with cards linking to:
- Feature Toggles
- UI Blocks
- Translations

### 2. Feature Toggles (`/settings/toggles`)
Manage feature toggles to enable/disable features without code changes.

**Features:**
- List all feature toggles
- Create new toggles
- Edit existing toggles
- Delete toggles
- Quick toggle on/off
- Filter by key or description
- Target specific applications (Web Directory, Web Admin, Mobile Agent, or All)

**API Endpoints:**
- `GET /settings/toggles` - List all toggles
- `POST /settings/toggles` - Create toggle
- `PUT /settings/toggles/:key` - Update toggle
- `DELETE /settings/toggles/:key` - Delete toggle

### 3. UI Blocks (`/settings/blocks`)
Customize UI blocks (Header, Footer, Home Hero) for different applications.

**Features:**
- List all blocks
- Create new blocks
- Edit block settings (JSON editor)
- Delete blocks
- Enable/disable blocks
- Format JSON settings
- Target specific applications

**Block Types:**
- `HEADER` - Header block
- `FOOTER` - Footer block
- `HOME_HERO` - Home hero section

**API Endpoints:**
- `GET /settings/blocks` - List all blocks
- `POST /settings/blocks` - Create block
- `PUT /settings/blocks/:id` - Update block
- `DELETE /settings/blocks/:id` - Delete block

### 4. Translations (`/settings/translations`)
Manage multi-language content for the system.

**Features:**
- List all translations (paginated)
- Create new translations
- Edit existing translations
- Delete translations
- Filter by namespace and locale
- Search by key or value
- Export translations to JSON
- Support for Arabic (ar) and English (en)

**Translation Structure:**
- **Namespace**: Groups related translations (e.g., common, business, category)
- **Key**: Unique identifier for the translation
- **Locale**: Language code (ar, en)
- **Value**: Translated text (supports parameter interpolation with `{{paramName}}`)

**API Endpoints:**
- `GET /i18n/translations/list` - List translations (paginated)
- `POST /i18n/translations` - Create translation
- `PUT /i18n/translations/:namespace/:key/:locale` - Update translation
- `DELETE /i18n/translations/:namespace/:key/:locale` - Delete translation
- `GET /i18n/translations?locale=ar&namespace=common` - Get translations for export

## Components

### Dialog Components
Located in `packages/web-admin/components/settings/`:

1. **FeatureToggleDialog** - Create/edit feature toggles
2. **BlockDialog** - Create/edit UI blocks with JSON editor
3. **TranslationDialog** - Create/edit translations with RTL support

## Permissions

All settings pages require the `VIEW_SETTINGS` permission, which is granted to ADMIN role by default.

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 10.1**: Feature toggles management ✓
- **Requirement 11.2**: Block settings editor ✓
- **Requirement 14.4**: Translation management interface ✓

## Usage

1. Navigate to `/settings` in the admin panel
2. Select the desired settings category
3. Use the provided interface to manage settings
4. Changes take effect immediately (cached values are invalidated)

## Notes

- Feature toggles and blocks use Redis caching for performance
- Cache is automatically invalidated on updates for immediate effect
- Translations support parameter interpolation: `{{paramName}}`
- JSON editor in blocks includes format validation and pretty-print
- All forms include validation and error handling
- RTL support for Arabic translations in the editor
