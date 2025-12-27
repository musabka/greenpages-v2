# Map Components

This directory contains Leaflet map integration components for displaying businesses on an interactive map.

## Components

### BusinessMap

A client-side component that displays businesses on a Leaflet map with markers and popups.

**Features:**
- Interactive map with zoom and pan controls
- Business markers with custom icons for featured/verified businesses
- Info popups showing business details
- Automatic bounds fitting to show all markers
- Free OpenStreetMap tile provider
- Click handler for marker interactions
- Responsive design with configurable height

**Usage:**

```tsx
import { BusinessMap } from '@/components/map';

<BusinessMap
  businesses={businessList}
  center={[33.8886, 35.4955]} // Optional: Default center (Beirut)
  zoom={10}                    // Optional: Default zoom level
  height="600px"               // Optional: Map height
  onMarkerClick={(business) => {
    // Handle marker click
    console.log('Clicked:', business.name);
  }}
/>
```

**Props:**

- `businesses`: Array of BusinessCard objects with lat/lng coordinates
- `center`: Optional [lat, lng] tuple for initial map center (default: Beirut)
- `zoom`: Optional initial zoom level (default: 10)
- `height`: Optional CSS height string (default: '500px')
- `onMarkerClick`: Optional callback when a marker is clicked

**Marker Icons:**

- **Gold marker**: Featured businesses (isFeatured = true)
- **Green marker**: Verified businesses (isVerified = true)
- **Blue marker**: Regular businesses

**Popup Content:**

Each marker popup displays:
- Business name with verification/featured badges
- Category name
- Address (if available)
- Phone number (if available)
- Average rating and review count
- "View Details" link to business profile

## Integration with Search

The map is integrated into the search results page with a view toggle:

```tsx
// In SearchResults component
<SearchResultsClient results={results} error={error} />
```

Users can switch between:
- **List View**: Traditional card-based results with pagination
- **Map View**: Interactive map showing all results on current page

## Technical Details

### Libraries Used

- **leaflet**: Core mapping library (v1.9.4)
- **react-leaflet**: React bindings for Leaflet (v5.0.0)
- **@types/leaflet**: TypeScript definitions

### Tile Provider

Uses OpenStreetMap free tile provider:
- URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Attribution: © OpenStreetMap contributors
- No API key required
- Free for all use cases

### Client-Side Rendering

The map component uses `'use client'` directive and checks for mounting state to avoid SSR issues with Leaflet, which requires browser APIs.

### Icon Fix for Next.js

The component includes a fix for Leaflet marker icons in Next.js by explicitly setting icon URLs from CDN.

### Styling

Map styles are defined in `app/globals.css`:
- Leaflet CSS import
- Custom popup styles for RTL support
- Z-index management for popups
- Control button styling

## Requirements Validation

This implementation satisfies:

- **Requirement 5.5**: Map display with business markers ✓
- **Requirement 13.1**: Leaflet integration (no Google Maps) ✓
- **Requirement 13.3**: Business markers with info popups ✓
- **Requirement 13.4**: Free tile provider (OpenStreetMap) ✓

## Future Enhancements

Potential improvements:
- Clustering for large numbers of markers
- Custom marker icons based on category
- Geolocation to center map on user's location
- Drawing tools for area-based search
- Heatmap overlay for business density
- Route planning integration
