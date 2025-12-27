# Ad Display Implementation

## Overview

This document describes the implementation of the advertising system in the web directory application, including sponsored search results, home hero ads, category banners, and profile sidebar ads.

## Implementation Date

December 27, 2024

## Components Created

### 1. Ad Components (`packages/web-directory/components/ads/`)

#### AdBanner.tsx
- Generic ad banner component for hero and category placements
- Features:
  - Automatic impression tracking on mount
  - Click tracking on user interaction
  - Clear "إعلان" (Advertisement) label
  - Gradient background with border styling
  - Business image, name, description, location, and category display
  - Responsive design

#### SponsoredBusinessCard.tsx
- Sponsored business card for search results
- Features:
  - Similar to regular BusinessCard but with sponsored styling
  - Yellow border and "مُعلن" (Sponsored) label
  - Automatic impression and click tracking
  - Full business information display
  - Rating stars and review count
  - Phone number display
  - Call-to-action button

#### ProfileSidebarAd.tsx
- Sidebar ad component for business profile pages
- Features:
  - Compact vertical layout
  - Yellow "إعلان" header
  - Business image, name, description
  - Category and location icons
  - Rating display
  - "عرض التفاصيل" (View Details) CTA button
  - Automatic impression and click tracking

### 2. API Integration

#### Updated API Client (`packages/web-directory/lib/api-client.ts`)
- Fixed `getAdsForPlacement` method to use GET instead of POST
- Properly constructs query parameters for ad context
- Supports all placement types and targeting parameters

#### Updated Types (`packages/web-directory/types/index.ts`)
- Updated `Ad` interface to match API response
- Updated `AdPlacement` enum to match backend values (UPPERCASE)
- Added business data to Ad interface

### 3. Backend Updates

#### Ad Service (`packages/api/src/modules/ads/services/ad.service.ts`)
- Updated `mapAdToResponse` to include business data when available
- Business data is included for public ad serving endpoints

#### Ad DTO (`packages/api/src/modules/ads/dto/ad.dto.ts`)
- Added optional `business` field to `AdResponseDto`

## Integration Points

### 1. Search Results (`packages/web-directory/components/search/SearchResults.tsx`)
- Fetches sponsored ads for `SEARCH_SPONSORED` placement on first page only
- Displays sponsored ads at the top of search results
- Clear separator between sponsored and organic results
- Passes geographic and category context for targeting

### 2. Home Page (`packages/web-directory/app/page.tsx`)
- Fetches hero ads for `HOME_HERO` placement
- Displays up to 3 hero ads in a grid below the hero block
- Only shows section if ads are available

### 3. Business Profile (`packages/web-directory/components/business/BusinessProfile.tsx`)
- Client-side fetching of sidebar ads for `PROFILE_SIDEBAR` placement
- Displays up to 2 sidebar ads in the right column
- Passes business location and category for targeting
- Uses useEffect hook for ad fetching

## Ad Tracking

### Impression Tracking
- Automatically triggered when ad component mounts
- POST request to `/ads/{adId}/impression`
- Increments impression counter in database

### Click Tracking
- Triggered when user clicks on ad
- POST request to `/ads/{adId}/click`
- Increments click counter in database
- Happens before navigation to business page

## Ad Targeting

All ad requests include context for targeting:
- `governorateId`: Geographic targeting at governorate level
- `cityId`: Geographic targeting at city level
- `districtId`: Geographic targeting at district level
- `categoryId`: Category-based targeting
- `deviceType`: Device type (mobile/tablet/desktop)

The backend filters ads based on:
- Active campaign status
- Campaign date range
- Geographic targeting (null means no targeting)
- Category targeting (null means no targeting)
- Time-of-day targeting (activeHoursStart/End)

## Ad Labeling

All ads are clearly labeled as advertisements:
- Search sponsored: "مُعلن" (Sponsored) label with yellow border
- Home hero: "إعلان" (Advertisement) label in yellow badge
- Profile sidebar: "إعلان" (Advertisement) header bar

This complies with advertising disclosure requirements.

## Styling

### Visual Differentiation
- Sponsored search results: Yellow border (border-2 border-yellow-200)
- Ad banners: Gradient background (from-blue-50 to-green-50) with blue border
- Sidebar ads: Yellow header bar with standard white background

### Responsive Design
- All ad components are fully responsive
- Mobile-first approach
- Grid layouts adapt to screen size
- Images scale appropriately

## Performance Considerations

### Caching
- Ad responses are not cached (revalidate: 0) to ensure fresh ad rotation
- Backend caches ad queries for 5 minutes (CACHE_TTL = 300)

### Loading
- Ads are fetched asynchronously
- Page content loads even if ads fail
- Error handling prevents ad failures from breaking pages

### Client-Side Fetching
- Profile sidebar ads use client-side fetching to avoid blocking SSR
- useEffect hook ensures ads load after initial page render

## Future Enhancements

### Not Yet Implemented
1. **Category Banner Ads**: Placement for category pages (not yet created)
2. **Map Pin Highlight**: Special styling for advertised businesses on maps
3. **Search Autocomplete Ads**: Sponsored suggestions in search autocomplete
4. **Device Detection**: Currently hardcoded to 'desktop', needs proper detection
5. **Ad Rotation**: Backend shuffles ads, but could implement more sophisticated rotation
6. **A/B Testing**: No A/B testing framework for ad performance
7. **Frequency Capping**: No limit on how often same ad shows to same user
8. **Viewability Tracking**: Only tracks impressions, not actual viewability

### Potential Improvements
1. Add loading skeletons for ad slots
2. Implement lazy loading for below-fold ads
3. Add ad performance analytics dashboard
4. Implement ad blocklist/allowlist
5. Add ad preview mode for advertisers
6. Implement bid-based ad ranking
7. Add conversion tracking
8. Implement retargeting capabilities

## Testing

### Manual Testing Checklist
- [ ] Sponsored ads appear in search results (first page only)
- [ ] Hero ads appear on home page
- [ ] Sidebar ads appear on business profiles
- [ ] Ad labels are clearly visible
- [ ] Impression tracking works (check database)
- [ ] Click tracking works (check database)
- [ ] Ads link to correct business pages
- [ ] Ads respect geographic targeting
- [ ] Ads respect category targeting
- [ ] Ads respect time-of-day targeting
- [ ] Page loads correctly when no ads available
- [ ] Page loads correctly when ad API fails

### API Endpoints Used
- `GET /ads/placement?placement={placement}&...` - Fetch ads for placement
- `POST /ads/{adId}/impression` - Record impression
- `POST /ads/{adId}/click` - Record click

## Requirements Validation

This implementation satisfies the following requirements:

### Requirement 7.4 (Ad Display)
✅ Ads are displayed in search results (sponsored)
✅ Ads are displayed on home page (hero)
✅ Ads are displayed on business profiles (sidebar)
✅ Ads are clearly labeled as "إعلان" or "مُعلن"

### Requirement 18.1 (Ad Placements)
✅ SEARCH_SPONSORED placement implemented
✅ HOME_HERO placement implemented
✅ PROFILE_SIDEBAR placement implemented
⏳ CATEGORY_BANNER placement (pending category pages)
⏳ MAP_PIN_HIGHLIGHT placement (pending implementation)
⏳ SEARCH_AUTOCOMPLETE placement (pending implementation)

## Notes

- All ad components are client components ('use client') for interactivity
- Ad fetching uses environment variable NEXT_PUBLIC_API_URL
- Error handling ensures ads don't break page functionality
- Ad tracking is fire-and-forget (doesn't wait for response)
- Business data is included in ad responses for display purposes
