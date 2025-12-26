# Implementation Plan: Green Pages (الصفحات الخضراء)

## Overview

خطة تنفيذ تدريجية لمشروع Green Pages تبدأ بالبنية التحتية الأساسية، ثم الـ API، ثم الواجهات. كل مهمة تبني على المهام السابقة مع التركيز على الوظائف الأساسية أولاً.

## Environment Setup

- **Development**: Windows + Docker Desktop
- **Production**: VPS + Coolify
- **Version Policy**: Always use latest stable versions (search before installing)

## Tasks

- [x] 1. Project Setup and Infrastructure
  - [x] 1.1 Initialize monorepo structure with packages (api, web-admin, web-directory, mobile-agent, mobile-user, shared, prisma)
    - Create folder structure as defined in design
    - Initialize package.json for each package
    - Configure TypeScript (latest stable) and shared configs
    - Setup Docker Compose for local development (PostgreSQL + PostGIS, Redis)
    - _Requirements: Architecture Principles_

  - [x] 1.2 Setup NestJS API project with core configuration
    - Search for latest stable NestJS version and install
    - Initialize NestJS with modular structure
    - Configure environment variables handling
    - Setup CORS and security middleware
    - _Requirements: Architecture_

  - [x] 1.3 Setup PostgreSQL with PostGIS extension
    - Use latest stable PostgreSQL + PostGIS Docker image
    - Create database with PostGIS enabled
    - Configure connection pooling
    - Search for latest stable Prisma version and setup with PostGIS support
    - _Requirements: 2.1, 2.3_

  - [x] 1.4 Setup Redis for caching
    - Use latest stable Redis Docker image
    - Configure Redis connection
    - Create cache service abstraction
    - _Requirements: 20.1_

  - [x] 1.5 Create Prisma schema with all entities
    - Define all models as per design document
    - Create enums and relations
    - Setup indexes (GiST for geo, pg_trgm for text)
    - Run initial migration
    - _Requirements: Data Models_

- [x] 2. Authentication Module
  - [x] 2.1 Implement Auth service with JWT tokens
    - Create login endpoint with credential validation
    - Generate access and refresh token pair
    - Implement token refresh endpoint
    - Implement logout with token invalidation
    - _Requirements: 1.1, 1.3_

  - [ ]* 2.2 Write property test for token validation
    - **Property 1: Auth Token Validation**
    - **Validates: Requirements 1.1**

  - [x] 2.3 Implement RBAC guards and decorators
    - Create role-based guards (Admin, Agent, User)
    - Create @Roles() decorator
    - Implement permission checking middleware
    - _Requirements: 1.2_

  - [ ]* 2.4 Write property test for role-based access
    - **Property 2: Role-Based Access Control**
    - **Validates: Requirements 1.2**

  - [x] 2.5 Implement audit logging for admin actions
    - Create audit log entity and service
    - Intercept admin actions and log them
    - _Requirements: 1.4_

  - [ ]* 2.6 Write property test for audit logging
    - **Property 3: Audit Logging Completeness**
    - **Validates: Requirements 1.4**

  - [x] 2.7 Implement rate limiting on auth endpoints
    - Configure throttler for auth routes
    - _Requirements: 1.5_

  - [ ]* 2.8 Write property test for rate limiting
    - **Property 4: Rate Limiting Enforcement**
    - **Validates: Requirements 1.5**

- [x] 3. Checkpoint - Auth Module Complete
  - Ensure all auth tests pass, ask the user if questions arise.

- [x] 4. Geographic Module
  - [x] 4.1 Implement Geo entities (Governorate, City, District) with translations
    - Create CRUD services for each entity
    - Implement parent-child validation
    - Support multi-language translations
    - _Requirements: 2.1, 2.2, 14.2_

  - [ ]* 4.2 Write property test for hierarchy integrity
    - **Property 5: Geographic Hierarchy Integrity**
    - **Validates: Requirements 2.2**

  - [x] 4.3 Implement PostGIS geographic queries
    - Nearest businesses within radius query
    - Bounding box search for map display
    - Full hierarchy path retrieval
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ]* 4.4 Write property test for geo queries
    - **Property 6: Geo Query Correctness**
    - **Validates: Requirements 2.3, 2.4**

- [x] 5. Category Module
  - [x] 5.1 Implement Category service with hierarchy
    - Create CRUD with parent-child relations
    - Validate unique name within same parent
    - Return category tree structure
    - Handle deletion with children (prevent or cascade)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.2 Write property test for category uniqueness
    - **Property 9: Category Name Uniqueness**
    - **Validates: Requirements 4.2**

- [x] 6. Storage Module
  - [x] 6.1 Implement Storage Abstraction Layer
    - Create StorageProvider interface
    - Implement putObject, getSignedUrl, deleteObject, exists
    - Store file metadata (provider, bucket, key, mime, size, checksum)
    - _Requirements: 12.1, 12.3_

  - [x] 6.2 Implement Cloudflare R2 provider
    - _Requirements: 12.2_

  - [x] 6.3 Implement Local filesystem provider (for development)
    - _Requirements: 12.2_

  - [ ]* 6.4 Write property test for storage round-trip
    - **Property 19: Storage Round-Trip Consistency**
    - **Validates: Requirements 12.1, 12.3**

- [ ] 7. Checkpoint - Core Infrastructure Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Directory Module (Business Management)
  - [x] 8.1 Implement Business CRUD service
    - Create with required fields validation (name, category, location, contact)
    - Update with field validation
    - Soft delete implementation
    - Store images using Storage module
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 8.2 Write property test for business validation
    - **Property 7: Business Validation Completeness**
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 8.3 Write property test for soft delete
    - **Property 8: Soft Delete Data Preservation**
    - **Validates: Requirements 3.4**

  - [x] 8.4 Implement Business search service
    - Text search in name, category, address, phone
    - Geographic filters (governorate/city/district)
    - Sorting (nearest, newest, featured)
    - Pagination
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 8.5 Write property test for search correctness
    - **Property 10: Search Result Correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [ ] 9. Plans Module
  - [ ] 9.1 Implement Plan CRUD with features
    - Create plans with name, price, duration, features
    - Support PlanFeatures (image limit, WhatsApp, working hours, etc.)
    - Configure default plan
    - _Requirements: 6.1, 6.2, 6.6_

  - [ ] 9.2 Implement Subscription service
    - Create subscription with start/end dates
    - Track expiration and renewal status
    - Auto-assign default plan on expiration (cron job)
    - Validate feature access
    - _Requirements: 6.3, 6.4, 6.5, 6.8_

  - [ ]* 9.3 Write property test for subscription dates
    - **Property 11: Subscription Date Calculation**
    - **Validates: Requirements 6.2**

  - [ ]* 9.4 Write property test for expired subscription handling
    - **Property 12: Expired Subscription Default Plan Assignment**
    - **Validates: Requirements 6.5**

  - [ ]* 9.5 Write property test for feature visibility
    - **Property 13: Plan Feature Visibility Control**
    - **Validates: Requirements 6.7**

- [ ] 10. Checkpoint - Business & Plans Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Advertising Module
  - [ ] 11.1 Implement Ad Campaign and Ad entities
    - Create campaigns with budget, duration, targeting
    - Support all ad placements (search, home, category, profile, map, autocomplete)
    - Geographic and category targeting
    - Ad scheduling (active hours)
    - _Requirements: 7.1, 7.2, 7.3, 7.6, 18.1, 18.2, 18.3, 18.6_

  - [ ] 11.2 Implement Ad serving and tracking
    - Get ads for placement with context matching
    - Record impressions and clicks
    - Ad rotation for same placement
    - _Requirements: 7.4, 18.4, 18.8_

  - [ ]* 11.3 Write property test for ad targeting
    - **Property 14: Ad Targeting Accuracy**
    - **Validates: Requirements 7.3**

  - [ ] 11.4 Implement Ad performance reporting
    - Impressions, clicks, CTR reports
    - _Requirements: 18.5_

- [ ] 12. Finance Module
  - [ ] 12.1 Implement Agent Debt tracking
    - Record cash collections as debt
    - Track by agent and business
    - Complete audit trail
    - _Requirements: 9.1, 9.3_

  - [ ]* 12.2 Write property test for payment creates debt
    - **Property 15: Payment Creates Debt Record**
    - **Validates: Requirements 8.3, 9.1**

  - [ ] 12.3 Implement Settlement processing
    - Process settlements to reduce debt
    - Record treasury entries
    - Prevent negative debt
    - _Requirements: 9.2, 9.5_

  - [ ]* 12.4 Write property test for settlement reduces debt
    - **Property 16: Settlement Reduces Debt**
    - **Validates: Requirements 9.2**

  - [ ]* 12.5 Write property test for non-negative debt
    - **Property 17: Non-Negative Debt Invariant**
    - **Validates: Requirements 9.5**

  - [ ] 12.6 Implement debt reports and history
    - Agent debt summary
    - Settlement history
    - Ledger entries
    - _Requirements: 9.4_

- [ ] 13. Checkpoint - Ads & Finance Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Reviews Module
  - [ ] 14.1 Implement Review CRUD
    - Create review with rating (1-5), text, user, business
    - Calculate and cache average rating
    - Pagination and sorting (newest, highest, lowest)
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ]* 14.2 Write property test for average calculation
    - **Property 21: Review Average Calculation**
    - **Validates: Requirements 16.2**

  - [ ] 14.3 Implement review moderation
    - Approve, reject, flag reviews
    - Hide flagged reviews pending admin review
    - _Requirements: 16.4, 16.5_

  - [ ] 14.4 Implement duplicate review prevention
    - Prevent same user reviewing same business within 30 days
    - _Requirements: 16.6_

  - [ ]* 14.5 Write property test for duplicate prevention
    - **Property 22: Duplicate Review Prevention**
    - **Validates: Requirements 16.6**

- [ ] 15. Rewards Module
  - [ ] 15.1 Implement Points system
    - Award points for actions (review, report, first review of day)
    - Store balance and transaction history
    - User level/badge calculation
    - _Requirements: 17.1, 17.2, 17.3_

  - [ ]* 15.2 Write property test for points award
    - **Property 23: Points Award Correctness**
    - **Validates: Requirements 17.1**

  - [ ] 15.3 Implement configurable point values
    - Admin can configure points per action
    - Award points after admin verification for reports
    - _Requirements: 17.4, 17.5_

- [ ] 16. Data Reports Module
  - [ ] 16.1 Implement Data Report system
    - Create reports (wrong phone, closed, wrong location)
    - Pending reports queue with filtering
    - Resolution workflow with business update
    - Track resolution statistics
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [ ] 17. Notifications Module
  - [ ] 17.1 Implement Notification system
    - Support types: subscription expiry, review reply, report resolved, points earned
    - Store with read status
    - Broadcast to user segments
    - _Requirements: 22.1, 22.2, 22.5_

- [ ] 18. Settings Module
  - [ ] 18.1 Implement Feature Toggles
    - Store toggles with key, value, description, target app
    - Immediate effect without restart
    - Toggles for: WhatsApp, working hours, visitor submission, ad types, blocks
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 18.2 Write property test for toggle immediate effect
    - **Property 18: Feature Toggle Immediate Effect**
    - **Validates: Requirements 10.2**

  - [ ] 18.3 Implement Block system
    - Store blocks with type, schema, settings, target
    - Settings editor support
    - Block types: header, footer, home hero
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 19. i18n Module
  - [ ] 19.1 Implement Translation service
    - Store translatable content with keys
    - Support Arabic (primary) and English
    - Fallback to Arabic when translation missing
    - Add new languages without code changes
    - _Requirements: 14.1, 14.2, 14.3, 14.5, 14.6_

  - [ ]* 19.2 Write property test for translation fallback
    - **Property 20: Translation Fallback**
    - **Validates: Requirements 14.6**

  - [ ] 19.3 Implement translation management interface support
    - API endpoints for managing translations
    - User language preference storage
    - _Requirements: 14.4, 14.7_

- [ ] 20. Checkpoint - All API Modules Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Web Admin (Next.js)
  - [ ] 21.1 Setup Next.js admin project with authentication
    - Search for latest stable Next.js version and install
    - Initialize with App Router
    - Implement admin login with JWT
    - Setup latest stable Tailwind CSS
    - _Requirements: 1.1, 1.2_

  - [ ] 21.2 Implement Geographic management pages
    - CRUD for Governorates, Cities, Districts
    - Hierarchy visualization
    - _Requirements: 2.1, 2.2_

  - [ ] 21.3 Implement Category management pages
    - Tree view for categories
    - CRUD with parent selection
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 21.4 Implement Business management pages
    - List with search and filters
    - Create/Edit forms
    - Image upload
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 21.5 Implement Plans management pages
    - Plan CRUD with features configuration
    - Default plan settings
    - _Requirements: 6.1, 6.2, 6.6_

  - [ ] 21.6 Implement Ads management pages
    - Campaign creation and management
    - Performance reports
    - Placement configuration
    - _Requirements: 7.1, 7.2, 7.5, 18.2, 18.5, 18.7_

  - [ ] 21.7 Implement Finance pages
    - Agent debt reports
    - Settlement processing
    - Audit trail view
    - _Requirements: 9.2, 9.3, 9.4_

  - [ ] 21.8 Implement Review moderation pages
    - Pending reviews queue
    - Approve/Reject actions
    - _Requirements: 16.4, 16.5_

  - [ ] 21.9 Implement Data Reports pages
    - Reports queue
    - Resolution workflow
    - Statistics
    - _Requirements: 21.2, 21.3, 21.4_

  - [ ] 21.10 Implement Settings pages
    - Feature toggles management
    - Block settings editor
    - Translation management
    - _Requirements: 10.1, 11.2, 14.4_

  - [ ] 21.11 Implement Notifications broadcast
    - Send notifications to user segments
    - _Requirements: 22.5_

- [ ] 22. Checkpoint - Web Admin Complete
  - Ensure admin panel is functional, ask the user if questions arise.

- [ ] 23. Web Directory (Next.js)
  - [ ] 23.1 Setup Next.js directory project
    - Search for latest stable Next.js version and install
    - Initialize with App Router
    - Setup latest stable Tailwind CSS
    - Configure ISR for business pages
    - _Requirements: 20.3_

  - [ ] 23.2 Implement responsive layout with blocks
    - Header, Footer, Hero blocks
    - Mobile-first responsive design
    - RTL support for Arabic
    - _Requirements: 11.3, 11.4, 14.8, 19.1, 19.2, 19.3_

  - [ ] 23.3 Implement search functionality
    - Text search with filters
    - Geographic filters
    - Sorting options
    - Pagination
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 23.4 Implement Leaflet map integration
    - Map display with business markers
    - Info popups
    - Free tile provider
    - _Requirements: 5.5, 13.1, 13.3, 13.4_

  - [ ] 23.5 Implement Business profile pages
    - Full business details
    - Images gallery
    - Working hours, contact info
    - Plan-based feature visibility
    - Reviews display
    - Report issue button
    - _Requirements: 3.5, 6.7, 16.3, 16.7, 21.5_

  - [ ] 23.6 Implement SEO optimization
    - Meta tags per page
    - JSON-LD structured data
    - Dynamic sitemap.xml
    - Canonical URLs
    - Open Graph and Twitter Cards
    - Heading hierarchy
    - robots.txt
    - hreflang tags
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.8, 15.9, 15.10_

  - [ ] 23.7 Implement Ad display
    - Sponsored results in search
    - Home hero ads
    - Category banners
    - Profile sidebar ads
    - Clear "إعلان" labeling
    - _Requirements: 7.4, 18.1_

  - [ ] 23.8 Implement User features
    - Review submission
    - Points display
    - Notification bell
    - Language switcher
    - _Requirements: 16.1, 17.3, 22.3, 14.3_

  - [ ] 23.9 Implement Performance optimizations
    - Lazy loading for images and maps
    - CDN caching for static assets
    - Core Web Vitals optimization
    - _Requirements: 19.4, 20.6, 19.6_

- [ ] 24. Checkpoint - Web Directory Complete
  - Ensure directory is functional, ask the user if questions arise.

- [ ] 25. Mobile Agent (Flutter)
  - [ ] 25.1 Setup Flutter project with authentication
    - Search for latest stable Flutter version and install
    - Initialize Flutter project
    - Implement agent login
    - _Requirements: 1.1_

  - [ ] 25.2 Implement Business registration flow
    - Add business form (owner must be present)
    - Select plan
    - Activate ad
    - Record cash payment
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 25.3 Implement Agent dashboard
    - Current debt balance display
    - Daily operations log
    - Minimal UI focused on speed
    - _Requirements: 8.4, 8.5, 8.6_

  - [ ] 25.4 Implement RTL/LTR support
    - Arabic and English layouts
    - _Requirements: 14.8_

  - [ ] 25.5 Implement push notifications
    - Agent notifications
    - _Requirements: 22.4_

- [ ] 26. Checkpoint - Mobile Agent Complete
  - Ensure agent app is functional, ask the user if questions arise.

- [ ] 27. Mobile User (Flutter)
  - [ ] 27.1 Setup Flutter project with user authentication
    - Search for latest stable Flutter version and install
    - Initialize Flutter project
    - User login/registration
    - _Requirements: 23.1_

  - [ ] 27.2 Implement Search and Discovery
    - Search with filters (category, location, text)
    - Results display
    - _Requirements: 23.3_

  - [ ] 27.3 Implement Business profiles
    - Full details with images
    - Contact info, reviews
    - Leaflet map integration
    - _Requirements: 23.4, 23.5_

  - [ ] 27.4 Implement User interactions
    - Submit reviews and ratings
    - Points balance and rewards display
    - _Requirements: 23.6, 23.7_

  - [ ] 27.5 Implement RTL/LTR and i18n
    - Arabic and English support
    - _Requirements: 23.2_

  - [ ] 27.6 Implement Offline caching
    - Cache recently viewed businesses
    - _Requirements: 23.9_

  - [ ] 27.7 Implement Push notifications
    - User notifications
    - _Requirements: 23.8_

- [ ] 28. Business Ownership Features
  - [ ] 28.1 Implement owner-business relationship
    - One-to-many User to Business
    - Claim business flow
    - _Requirements: 24.1, 24.2_

  - [ ] 28.2 Implement owner editing in Web Directory
    - Owner can edit their business info
    - _Requirements: 24.3_

  - [ ] 28.3 Implement owner dashboard in Mobile User
    - Manage owned businesses
    - Permission validation
    - _Requirements: 24.4, 24.5_

- [ ] 29. Final Checkpoint - All Components Complete
  - Ensure all tests pass and all components are integrated, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: infrastructure → API → web → mobile
- **Version Policy**: Always search for latest stable version before installing any package/tool
- **Development Environment**: Windows + Docker Desktop (PostgreSQL, Redis containers)
- **Production Environment**: VPS + Coolify for deployment
