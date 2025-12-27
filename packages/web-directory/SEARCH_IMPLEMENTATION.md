# Search Implementation

## Overview

The search functionality has been implemented for the Web Directory application, providing comprehensive search capabilities with filters, sorting, and pagination.

## Features Implemented

### 1. Search Page (`/search`)
- Full-page search interface with filters sidebar
- Responsive layout (mobile-first design)
- Server-side rendering for SEO optimization
- Suspense boundaries for progressive loading

### 2. Search Components

#### SearchForm
- Text input for search queries
- Preserves existing filters when searching
- Auto-detects text direction (RTL/LTR)
- Resets to page 1 on new search

#### SearchFilters
- **Sort Options**: Newest, Featured, Highest Rated, Nearest
- **Category Filter**: Dropdown with all categories
- **Geographic Filters**: 
  - Governorate (محافظة)
  - City (مدينة) - shown when governorate selected
  - District (حي) - shown when city selected
- **Clear Filters**: Button to reset all filters
- Client-side interactivity with URL state management

#### SearchResults
- Displays paginated business results
- Shows result count and search query
- Empty state with helpful message
- Error handling with user-friendly messages
- Server component for optimal performance

#### BusinessCard
- Displays business information in card format
- Shows:
  - Business name with verified badge
  - Featured badge for promoted businesses
  - Category name
  - Rating and review count
  - Address and location
  - Phone number
  - Distance (when using nearest sort)
  - Primary image or placeholder
- Responsive design (mobile and desktop)
- Links to business detail page

#### Pagination
- Page numbers with ellipsis for large page counts
- Previous/Next buttons
- Shows current page info
- Mobile-optimized (simplified on small screens)
- Preserves all search filters when navigating

### 3. API Integration

The search functionality integrates with the backend API:

**Endpoint**: `GET /api/businesses/search`

**Parameters**:
- `query`: Text search (searches name, category, address, phone)
- `categoryId`: Filter by category
- `governorateId`: Filter by governorate
- `cityId`: Filter by city
- `districtId`: Filter by district
- `lat`, `lng`, `radius`: Geographic radius search
- `sortBy`: Sort order (nearest, newest, featured, rating)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `locale`: Language (ar, en)

**Response**:
```typescript
{
  data: BusinessCard[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

### 4. Header Integration

The header component has been updated to include:
- Search link in navigation menu
- Search button in desktop view
- Mobile-friendly search access

## Technical Details

### URL State Management
All search parameters are stored in URL query parameters:
- Enables bookmarking and sharing of search results
- Browser back/forward navigation works correctly
- SEO-friendly URLs

### SEO Optimizations

#### Deep Pagination SEO
- **Pages 1-3**: `index,follow` - Full indexing
- **Pages 4+**: `noindex,follow` - Prevents deep pagination indexing issues
- **Canonical URLs**: Each page has proper canonical URL
- **Prev/Next Links**: Proper `rel="prev"` and `rel="next"` links for pagination navigation

This prevents:
- Duplicate content issues
- Crawl budget waste
- Dilution of page authority

#### Dynamic Metadata
- Page titles include search query and page number
- Descriptions are contextual based on search
- Proper robots meta tags based on page depth

### Nearest Sorting Intelligence
- "Nearest" sort option only appears when geolocation is available
- Prevents unnecessary API calls with missing coordinates
- Graceful fallback to other sort options
- Client-side geolocation detection

### Performance Optimizations
- Server-side rendering for initial page load
- Suspense boundaries for progressive enhancement
- Lazy loading of filter options
- Efficient re-rendering with URL-based state

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- Touch-friendly targets (44x44px minimum)
- Optimized layouts for each screen size

### Accessibility
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly

## Requirements Validation

This implementation satisfies the following requirements:

✅ **Requirement 5.1**: Text search in business name, category, address, phone
✅ **Requirement 5.2**: Geographic filters (governorate/city/district)
✅ **Requirement 5.3**: Sorting by nearest, newest, featured, rating
✅ **Requirement 5.4**: Pagination for all search results

## Usage Examples

### Basic Text Search
```
/search?query=مطعم
```

### Search with Category Filter
```
/search?query=مطعم&categoryId=abc123
```

### Search with Location Filter
```
/search?governorateId=beirut&cityId=achrafieh
```

### Search with Sorting
```
/search?query=مطعم&sortBy=rating
```

### Paginated Results
```
/search?query=مطعم&page=2
```

### Combined Filters
```
/search?query=مطعم&categoryId=abc123&governorateId=beirut&sortBy=rating&page=1
```

## Future Enhancements

Potential improvements for future iterations:

1. **Advanced Filters**:
   - Price range
   - Open now
   - Has reviews
   - Verified only

2. **Search Suggestions**:
   - Autocomplete
   - Recent searches
   - Popular searches

3. **Map View**:
   - Toggle between list and map view
   - Cluster markers for better performance
   - Interactive map filtering

4. **Saved Searches**:
   - Save favorite searches
   - Search alerts/notifications

5. **Voice Search**:
   - Voice input support
   - Speech-to-text integration

## Testing

To test the search functionality:

1. Start the API server:
   ```bash
   cd packages/api
   npm run start:dev
   ```

2. Start the web directory:
   ```bash
   cd packages/web-directory
   npm run dev
   ```

3. Navigate to `http://localhost:3000/search`

4. Test various scenarios:
   - Empty search (should show all businesses)
   - Text search with query
   - Apply different filters
   - Change sorting options
   - Navigate through pages
   - Clear filters
   - Mobile responsive behavior

## Notes

- The search is case-insensitive
- Arabic and English text are both supported
- Results are cached at the API level for performance
- The search page uses SSR (Server-Side Rendering) for SEO
- Filter options are loaded client-side for better UX

### SEO Best Practices Applied

✅ **Deep Pagination Handling**: Pages 4+ use `noindex,follow` to prevent indexing issues  
✅ **Pagination Links**: Proper `rel="prev"` and `rel="next"` for crawler navigation  
✅ **Dynamic Metadata**: Contextual titles and descriptions  
✅ **Canonical URLs**: Each page has unique canonical URL  

### Smart Features

✅ **Geolocation-Aware Sorting**: "Nearest" option only shows when location is available  
✅ **Efficient API Calls**: No unnecessary parameters sent to backend  
✅ **Progressive Enhancement**: Works without JavaScript for basic functionality  
