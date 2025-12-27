# BusinessMap Component - Usage Guide

## Quick Start

### Basic Usage

```tsx
import { BusinessMap } from '@/components/map';

export function MyPage() {
  const businesses = [
    {
      id: '1',
      name: 'مطعم لبناني',
      lat: 33.8886,
      lng: 35.4955,
      category: { id: '1', name: 'مطاعم', slug: 'restaurants' },
      district: { id: '1', name: 'بيروت' },
      // ... other fields
    },
    // ... more businesses
  ];

  return <BusinessMap businesses={businesses} />;
}
```

## Props Reference

### businesses (required)
Array of business objects with coordinates.

```typescript
interface BusinessCard {
  id: string;
  slug: string;
  name: string;
  lat: number;        // Required for map marker
  lng: number;        // Required for map marker
  category: {
    id: string;
    name: string;
    slug: string;
  };
  district: {
    id: string;
    name: string;
  };
  address?: string;
  phone?: string;
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  // ... other optional fields
}
```

### center (optional)
Initial map center as [latitude, longitude].

```tsx
<BusinessMap
  businesses={businesses}
  center={[33.8886, 35.4955]} // Beirut coordinates
/>
```

**Default**: `[33.8886, 35.4955]` (Beirut, Lebanon)

### zoom (optional)
Initial zoom level (1-18).

```tsx
<BusinessMap
  businesses={businesses}
  zoom={12} // City level
/>
```

**Default**: `10`

**Zoom levels**:
- 1-3: World view
- 4-6: Country view
- 7-10: Region view
- 11-13: City view
- 14-16: District view
- 17-18: Street view

### height (optional)
CSS height string for the map container.

```tsx
<BusinessMap
  businesses={businesses}
  height="400px"
/>
```

**Default**: `"500px"`

**Examples**:
- `"100vh"` - Full viewport height
- `"calc(100vh - 200px)"` - Viewport minus header
- `"600px"` - Fixed height

### onMarkerClick (optional)
Callback function when a marker is clicked.

```tsx
<BusinessMap
  businesses={businesses}
  onMarkerClick={(business) => {
    console.log('User clicked:', business.name);
    // Navigate to business page
    router.push(`/business/${business.slug}`);
  }}
/>
```

## Advanced Examples

### Full-Screen Map

```tsx
<div className="fixed inset-0">
  <BusinessMap
    businesses={businesses}
    height="100vh"
  />
</div>
```

### Map with Custom Center

```tsx
// Center on specific city
const TRIPOLI_CENTER: [number, number] = [34.4333, 35.8333];

<BusinessMap
  businesses={businesses}
  center={TRIPOLI_CENTER}
  zoom={13}
/>
```

### Responsive Height

```tsx
<BusinessMap
  businesses={businesses}
  height="300px"
  className="md:h-[500px] lg:h-[700px]"
/>
```

### With Loading State

```tsx
'use client';

import { useState, useEffect } from 'react';
import { BusinessMap } from '@/components/map';

export function MapPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses().then((data) => {
      setBusinesses(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading map...</div>;
  }

  return <BusinessMap businesses={businesses} />;
}
```

### With Error Handling

```tsx
export function SafeMap({ businesses }) {
  // Filter out businesses without coordinates
  const validBusinesses = businesses.filter(
    (b) => b.lat && b.lng && !isNaN(b.lat) && !isNaN(b.lng)
  );

  if (validBusinesses.length === 0) {
    return (
      <div className="text-center p-8">
        <p>No businesses with valid coordinates to display</p>
      </div>
    );
  }

  return <BusinessMap businesses={validBusinesses} />;
}
```

## Marker Icons

The map automatically uses different marker colors based on business status:

### Gold Marker (⭐)
Featured businesses (`isFeatured: true`)

```tsx
const business = {
  // ...
  isFeatured: true,
  isVerified: false,
};
```

### Green Marker (✓)
Verified businesses (`isVerified: true`)

```tsx
const business = {
  // ...
  isFeatured: false,
  isVerified: true,
};
```

### Blue Marker (default)
Regular businesses

```tsx
const business = {
  // ...
  isFeatured: false,
  isVerified: false,
};
```

**Priority**: Featured > Verified > Regular

## Popup Content

Each marker popup automatically displays:

1. **Business Name** with badges
   - ✓ for verified
   - ⭐ for featured

2. **Category Name**
   - From `business.category.name`

3. **Address** (if available)
   - 📍 icon + `business.address`

4. **Phone** (if available)
   - 📞 icon + `business.phone`

5. **Rating** (if > 0)
   - ⭐ icon + average rating + review count

6. **View Details Button**
   - Links to `/business/${business.slug}`

## Styling

### Custom Container Styles

```tsx
<div className="rounded-lg shadow-lg overflow-hidden">
  <BusinessMap businesses={businesses} />
</div>
```

### With Border

```tsx
<div className="border-2 border-gray-300 rounded-lg overflow-hidden">
  <BusinessMap businesses={businesses} />
</div>
```

## Integration Patterns

### In Search Results

```tsx
'use client';

import { useState } from 'react';
import { BusinessMap } from '@/components/map';
import { BusinessCard } from '@/components/business/BusinessCard';

export function SearchResults({ businesses }) {
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <div>
      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('list')}>List</button>
        <button onClick={() => setView('map')}>Map</button>
      </div>

      {/* Content */}
      {view === 'map' ? (
        <BusinessMap businesses={businesses} height="600px" />
      ) : (
        <div className="grid gap-4">
          {businesses.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### On Business Detail Page

```tsx
export function BusinessDetail({ business }) {
  return (
    <div>
      <h1>{business.name}</h1>
      
      {/* Other business details */}
      
      <section className="mt-8">
        <h2>Location</h2>
        <BusinessMap
          businesses={[business]}
          center={[business.lat, business.lng]}
          zoom={15}
          height="400px"
        />
      </section>
    </div>
  );
}
```

### In Category Page

```tsx
export function CategoryPage({ category, businesses }) {
  return (
    <div>
      <h1>{category.name}</h1>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* List */}
        <div>
          {businesses.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
        
        {/* Map */}
        <div className="sticky top-4">
          <BusinessMap
            businesses={businesses}
            height="calc(100vh - 100px)"
          />
        </div>
      </div>
    </div>
  );
}
```

## Performance Tips

### 1. Limit Number of Markers

For large datasets, consider pagination or clustering:

```tsx
// Show only first 100 businesses
<BusinessMap businesses={businesses.slice(0, 100)} />
```

### 2. Memoize Business Data

```tsx
import { useMemo } from 'react';

const validBusinesses = useMemo(
  () => businesses.filter((b) => b.lat && b.lng),
  [businesses]
);

<BusinessMap businesses={validBusinesses} />
```

### 3. Lazy Load Map

```tsx
import dynamic from 'next/dynamic';

const BusinessMap = dynamic(
  () => import('@/components/map').then((mod) => mod.BusinessMap),
  { ssr: false, loading: () => <div>Loading map...</div> }
);
```

## Troubleshooting

### Map Not Displaying

**Issue**: White/blank area where map should be

**Solutions**:
1. Check that Leaflet CSS is imported in `globals.css`
2. Verify businesses have valid `lat` and `lng` values
3. Ensure component is client-side (`'use client'`)
4. Check browser console for errors

### Markers Not Appearing

**Issue**: Map displays but no markers

**Solutions**:
1. Verify `businesses` array is not empty
2. Check that each business has `lat` and `lng` properties
3. Ensure coordinates are valid numbers (not strings)
4. Check that coordinates are within valid ranges:
   - Latitude: -90 to 90
   - Longitude: -180 to 180

### Popups Not Opening

**Issue**: Clicking markers doesn't show popup

**Solutions**:
1. Check that business has required fields (name, category, etc.)
2. Verify popup content is rendering correctly
3. Check z-index in CSS (popups should be above map)

### TypeScript Errors

**Issue**: Type errors with business objects

**Solution**: Ensure business objects match `BusinessCard` interface:

```typescript
import type { BusinessCard } from '@/types';

const business: BusinessCard = {
  id: '1',
  slug: 'my-business',
  name: 'My Business',
  lat: 33.8886,
  lng: 35.4955,
  // ... all required fields
};
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ iOS Safari
- ✅ Chrome Mobile
- ✅ Samsung Internet

## Accessibility

- Keyboard navigation supported
- Screen reader compatible
- High contrast markers
- Touch-friendly controls (44x44px minimum)
- Focus indicators on interactive elements

## Related Components

- `BusinessCard` - List view of businesses
- `SearchResults` - Search results with map/list toggle
- `SearchFilters` - Filter businesses by location/category

## API Reference

See [README.md](./README.md) for detailed API documentation.
