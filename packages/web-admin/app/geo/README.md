# Geographic Management Pages

This directory contains the admin pages for managing the geographic hierarchy (Governorates, Cities, Districts).

## Pages

### `/geo/governorates`
- List all governorates with search and filtering
- Create new governorates with Arabic and English translations
- Edit existing governorates
- Delete governorates
- View governorate details including coordinates

### `/geo/cities`
- List all cities with their parent governorates
- Create new cities linked to governorates
- Edit existing cities
- Delete cities
- Filter cities by governorate

### `/geo/districts`
- List all districts with their parent cities and governorates
- Create new districts linked to cities
- Edit existing districts
- Delete districts
- Filter districts by city or governorate

### `/geo/hierarchy`
- Interactive tree view of the complete geographic hierarchy
- Expandable/collapsible governorates, cities, and districts
- Visual representation of the parent-child relationships
- Status indicators (active/inactive) for each entity
- Lazy loading of districts when expanding cities

## Components

### Dialog Components
- `GovernorateDialog`: Form for creating/editing governorates
- `CityDialog`: Form for creating/editing cities with governorate selection
- `DistrictDialog`: Form for creating/editing districts with city/governorate selection

### Features
- Multi-language support (Arabic and English translations)
- Coordinate input (latitude/longitude)
- Active/inactive status toggle
- Slug-based URL-friendly identifiers
- Real-time validation
- Error handling with user-friendly messages

## API Integration

All pages integrate with the following API endpoints:
- `GET /geo/governorates` - List governorates
- `POST /geo/governorates` - Create governorate
- `PUT /geo/governorates/:id` - Update governorate
- `DELETE /geo/governorates/:id` - Delete governorate
- `GET /geo/cities` - List cities
- `POST /geo/cities` - Create city
- `PUT /geo/cities/:id` - Update city
- `DELETE /geo/cities/:id` - Delete city
- `GET /geo/districts` - List districts
- `POST /geo/districts` - Create district
- `PUT /geo/districts/:id` - Update district
- `DELETE /geo/districts/:id` - Delete district

## Requirements Validation

This implementation satisfies:
- **Requirement 2.1**: Geographic data management with PostGIS coordinates
- **Requirement 2.2**: Parent-child relationship validation in hierarchy
- CRUD operations for all geographic entities
- Hierarchy visualization
- Multi-language translation support
