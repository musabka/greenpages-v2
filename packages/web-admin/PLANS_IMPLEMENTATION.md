# Plans Management Implementation

## Overview
This document describes the implementation of the Plans management pages in the Web Admin application.

## Files Created

### 1. `/app/plans/page.tsx`
Main page for managing subscription plans. Features:
- List all plans in a card grid layout
- Display plan details (price, duration, features count)
- Highlight default plan with star icon
- Show inactive plans with badge
- Create, edit, delete operations
- Set plan as default functionality

### 2. `/components/plans/plan-dialog.tsx`
Dialog component for creating and editing plans. Features:
- Basic information form (slug, price, duration, sort order)
- Active/Default checkboxes
- Multi-language translations (Arabic & English)
- Dynamic features management with predefined feature keys
- Feature types: boolean, number, text
- Validation and error handling

### 3. `/components/plans/index.ts`
Export file for plans components

## Features Implemented

### Plan CRUD Operations
- ✅ Create new plans with translations and features
- ✅ Edit existing plans
- ✅ Delete plans (with validation for default plans)
- ✅ List all plans with filtering

### Default Plan Management
- ✅ Set any active plan as default
- ✅ Prevent deletion of default plan
- ✅ Visual indication of default plan (star icon)
- ✅ Automatic unset of previous default when setting new one

### Plan Features Configuration
- ✅ Dynamic feature addition/removal
- ✅ Predefined feature keys with labels:
  - `max_images`: Maximum number of images
  - `show_whatsapp`: Display WhatsApp contact
  - `show_working_hours`: Display working hours
  - `map_pin_visible`: Show on map
  - `search_priority`: Search ranking priority
  - `profile_highlight`: Highlight business profile
  - `show_website`: Display website URL
  - `show_email`: Display email address
- ✅ Type-aware input fields (boolean, number, text)

### Multi-language Support
- ✅ Arabic (primary) and English translations
- ✅ Required Arabic translation
- ✅ Optional English translation
- ✅ Separate name and description fields per language

### UI/UX Features
- ✅ Card-based layout for better visual organization
- ✅ Price formatting in Egyptian Pounds
- ✅ Duration formatting (30 days = "شهر", etc.)
- ✅ Active/Inactive status badges
- ✅ Sort order management
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling with user-friendly messages

## API Integration

The implementation uses the following API endpoints:

- `GET /plans?locale=ar` - List all plans
- `GET /plans/:id?locale=ar` - Get plan details
- `POST /plans` - Create new plan
- `PUT /plans/:id` - Update plan
- `DELETE /plans/:id` - Delete plan
- `PUT /plans/:id/set-default` - Set plan as default

## Requirements Validation

### Requirement 6.1: Plan Storage
✅ Plans stored with name, price, duration, and list of features

### Requirement 6.2: Plan Features
✅ Supports granular features including:
- Image count limit
- WhatsApp display
- Working hours display
- Map pin visibility
- Search priority
- Profile highlight

### Requirement 6.6: Default Plan Configuration
✅ Admin can configure default plan features
✅ Visual indication of default plan
✅ Set/unset default plan functionality

## Usage

1. Navigate to `/plans` in the admin panel
2. Click "إضافة باقة جديدة" to create a new plan
3. Fill in basic information (slug, price, duration)
4. Add translations for Arabic (required) and English (optional)
5. Add features by clicking "إضافة ميزة"
6. Select feature key and set value
7. Click "إضافة الباقة" to save

To edit a plan:
1. Click the edit button on any plan card
2. Modify the desired fields
3. Click "حفظ التعديلات"

To set a plan as default:
1. Click the star icon on any active plan
2. Confirm the action
3. The plan will be marked as default

## Notes

- Default plans cannot be deleted
- Plans with active subscriptions cannot be deleted (handled by API)
- At least one Arabic translation is required
- Feature values are stored as strings and parsed based on type
- The UI automatically formats prices and durations for better readability
