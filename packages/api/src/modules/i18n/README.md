# i18n Module

The i18n (internationalization) module provides multi-language support for the Green Pages application.

## Features

- **Multi-language Support**: Currently supports Arabic (primary) and English
- **Automatic Fallback**: Falls back to Arabic when translation is missing
- **Parameter Interpolation**: Support for dynamic values in translations
- **Namespace Organization**: Organize translations by namespace (e.g., 'common', 'business', 'category')
- **User Language Preference**: Store and retrieve user's preferred language
- **Translation Management**: Admin APIs for managing translations

## Supported Locales

- `ar` - Arabic (Primary/Default)
- `en` - English

## API Endpoints

### Public Endpoints

#### Get Translation
```
GET /i18n/translate?key=welcome&locale=ar&namespace=common
```

Query Parameters:
- `key` (required): Translation key
- `locale` (required): Target locale (ar, en)
- `namespace` (optional): Namespace (defaults to 'common')
- `params` (optional): Parameters for interpolation

Response:
```json
{
  "key": "welcome",
  "locale": "ar",
  "value": "مرحباً"
}
```

#### Get All Translations
```
GET /i18n/translations?locale=ar&namespace=common
```

Query Parameters:
- `locale` (required): Target locale
- `namespace` (optional): Filter by namespace

Response:
```json
{
  "namespace": "common",
  "locale": "ar",
  "translations": {
    "welcome": "مرحباً",
    "goodbye": "وداعاً"
  }
}
```

#### Get Supported Locales
```
GET /i18n/locales
```

Response:
```json
{
  "locales": ["ar", "en"],
  "primary": "ar"
}
```

### Authenticated Endpoints

#### Update User Locale
```
PUT /i18n/user/locale
Authorization: Bearer <token>
```

Body:
```json
{
  "locale": "en"
}
```

#### Get User Locale
```
GET /i18n/user/locale
Authorization: Bearer <token>
```

Response:
```json
{
  "locale": "ar"
}
```

### Admin Endpoints

#### Create Translation
```
POST /i18n/translations
Authorization: Bearer <admin-token>
```

Body:
```json
{
  "namespace": "common",
  "key": "welcome",
  "locale": "ar",
  "value": "مرحباً"
}
```

#### Update Translation
```
PUT /i18n/translations/:namespace/:key/:locale
Authorization: Bearer <admin-token>
```

Body:
```json
{
  "value": "أهلاً وسهلاً"
}
```

#### Delete Translation
```
DELETE /i18n/translations/:namespace/:key/:locale
Authorization: Bearer <admin-token>
```

#### List Translations (Paginated)
```
GET /i18n/translations/list?namespace=common&locale=ar&page=1&limit=50
Authorization: Bearer <admin-token>
```

#### Bulk Upsert Translations
```
POST /i18n/translations/bulk
Authorization: Bearer <admin-token>
```

Body:
```json
[
  {
    "namespace": "common",
    "key": "welcome",
    "locale": "ar",
    "value": "مرحباً"
  },
  {
    "namespace": "common",
    "key": "welcome",
    "locale": "en",
    "value": "Welcome"
  }
]
```

## Usage in Code

### Using the Service

```typescript
import { I18nService } from './modules/i18n/i18n.service';

constructor(private readonly i18nService: I18nService) {}

// Simple translation
const greeting = await this.i18nService.translate('welcome', 'ar');
// Returns: "مرحباً"

// Translation with parameters
const personalGreeting = await this.i18nService.translate(
  'greeting',
  'ar',
  { name: 'أحمد' },
  'common'
);
// If translation is "مرحباً {{ name }}"
// Returns: "مرحباً أحمد"

// Get all translations for a namespace
const translations = await this.i18nService.getTranslations('common', 'ar');
// Returns: { welcome: "مرحباً", goodbye: "وداعاً", ... }
```

## Translation Key Format

Translations use a hierarchical key structure:
- `namespace`: Logical grouping (e.g., 'common', 'business', 'category')
- `key`: Specific translation identifier (e.g., 'welcome', 'submit_button')
- `locale`: Language code (e.g., 'ar', 'en')

## Parameter Interpolation

Use `{{ paramName }}` syntax in translation values:

```
Translation: "مرحباً {{ name }}, لديك {{ count }} رسالة جديدة"
Parameters: { name: "أحمد", count: 5 }
Result: "مرحباً أحمد, لديك 5 رسالة جديدة"
```

## Fallback Behavior

1. Try to get translation for requested locale
2. If not found, fallback to Arabic (primary locale)
3. If still not found, return the key itself

This ensures the application always displays something meaningful.

## Database Schema

```prisma
model Translation {
  id        String @id @default(cuid())
  namespace String
  key       String
  locale    String
  value     String
  updatedAt DateTime @updatedAt

  @@unique([namespace, key, locale])
  @@index([namespace, locale])
  @@map("translations")
}
```

## Adding New Languages

To add a new language:

1. Add the locale code to `SUPPORTED_LOCALES` in `i18n.service.ts`
2. Create translations for the new locale in the database
3. The system will automatically support the new language

## Best Practices

1. **Use Namespaces**: Organize translations by feature/module
2. **Consistent Keys**: Use descriptive, hierarchical keys (e.g., `user.profile.edit_button`)
3. **Provide Fallbacks**: Always provide Arabic translation as fallback
4. **Parameter Names**: Use clear, descriptive parameter names
5. **Avoid Hardcoding**: Never hardcode user-facing text; always use translations

## Requirements Validation

This module satisfies the following requirements:

- **14.1**: Support Arabic as primary language and English as secondary
- **14.2**: Store translatable content with Translation_Keys
- **14.3**: Display all UI elements and content in selected language
- **14.4**: Provide translation management interface (Admin APIs)
- **14.5**: Support adding new languages without code changes
- **14.6**: Fallback to Arabic when translation is missing
- **14.7**: Store user language preference in profile
