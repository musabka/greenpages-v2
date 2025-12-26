# Requirements Document

## Introduction

Green Pages (الصفحات الخضراء) هو دليل رسمي موثوق للأنشطة التجارية والخدمية يعتمد على بيانات ميدانية/إدارية صحيحة. يحقق الدخل عبر باقات اشتراك للأنشطة، نظام إعلانات مدفوع، وخدمات إضافية مستقبلية. المشروع يتبع نهج Modular Monolith مع التركيز على البيانات الجغرافية (Geo-First) والتحكم الكامل من لوحة الإدارة.

## Glossary

- **API_Server**: خادم NestJS الموحد لجميع التطبيقات
- **Web_Admin**: لوحة إدارة Next.js الشاملة
- **Web_Directory**: واجهة الدليل العامة للمستخدمين
- **Mobile_Agent**: تطبيق Flutter للمندوب الميداني
- **Business**: نشاط تجاري مسجل في الدليل
- **Category**: تصنيف للأنشطة التجارية
- **Subscription_Plan**: باقة اشتراك بسعر ومدة ومميزات محددة
- **Ad_Placement**: موضع إعلاني مدفوع (نتائج البحث، الصفحة الرئيسية، إلخ)
- **Agent**: مندوب ميداني يقوم بتسجيل الأنشطة والتحصيل
- **Agent_Debt**: ذمة مالية على المندوب من المبالغ المحصلة
- **Settlement**: عملية تسوية لتصفير ذمة المندوب
- **Feature_Toggle**: مفتاح تفعيل/تعطيل ميزة من لوحة الإدارة
- **Block**: كيان واجهة قابل للتعديل (Header, Footer, Hero)
- **Storage_Provider**: مزود تخزين ملفات (R2, S3, MinIO, Bunny, Local)
- **Business_Owner**: مالك نشاط تجاري (يمكنه امتلاك عدة أنشطة)
- **Mobile_User**: تطبيق Flutter للمستخدمين العاديين (التطبيق الرئيسي للزوار)
- **Geo_Hierarchy**: التسلسل الجغرافي (محافظة/مدينة/حي)
- **Locale**: لغة واجهة المستخدم (ar, en, etc.)
- **Translation_Key**: مفتاح ترجمة للنصوص القابلة للترجمة
- **Default_Plan**: الباقة الافتراضية المجانية عند انتهاء الاشتراك
- **Plan_Feature**: ميزة محددة ضمن باقة اشتراك
- **Review**: مراجعة وتقييم من مستخدم لنشاط تجاري
- **User_Points**: نقاط تحفيزية يكسبها المستخدم من أفعال مفيدة
- **Ad_Campaign**: حملة إعلانية بميزانية ومدة واستهداف
- **Data_Report**: بلاغ عن معلومات خاطئة في نشاط تجاري
- **Notification**: إشعار للمستخدم عن حدث أو تحديث

## Requirements

### Requirement 1: Authentication and Authorization

**User Story:** As a system administrator, I want secure authentication and role-based access control, so that only authorized users can access appropriate system functions.

#### Acceptance Criteria

1. WHEN a user attempts to login, THE API_Server SHALL validate credentials and return JWT tokens (access + refresh)
2. WHEN a valid JWT token is provided, THE API_Server SHALL authorize requests based on user roles (Admin, Agent, User)
3. IF an invalid or expired token is provided, THEN THE API_Server SHALL return 401 Unauthorized error
4. WHEN an admin action is performed, THE API_Server SHALL log the action in audit trail with timestamp and user ID
5. THE API_Server SHALL implement rate limiting on authentication endpoints

### Requirement 2: Geographic Data Management

**User Story:** As an administrator, I want to manage geographic hierarchy (governorate/city/district), so that businesses and ads can be accurately located and searched.

#### Acceptance Criteria

1. THE API_Server SHALL store geographic entities with PostGIS coordinates (lat/lng)
2. WHEN a geographic entity is created, THE API_Server SHALL validate parent-child relationships in hierarchy
3. THE API_Server SHALL support queries for nearest businesses within a radius using PostGIS
4. THE API_Server SHALL support bounding box search for map display
5. WHEN geographic data is requested, THE API_Server SHALL return entities with full hierarchy path

### Requirement 3: Business Directory Management

**User Story:** As an administrator, I want to manage business listings with complete information, so that users can find accurate business details.

#### Acceptance Criteria

1. WHEN a business is created, THE API_Server SHALL require: name, category, location (coordinates + address), contact info
2. THE API_Server SHALL store business images using the configured Storage_Provider
3. WHEN business data is saved, THE API_Server SHALL validate all required fields and geographic coordinates
4. THE API_Server SHALL support soft delete for businesses to preserve historical data
5. WHEN a business is retrieved, THE API_Server SHALL include: working hours, WhatsApp, phone numbers, images, subscription status

### Requirement 4: Category Management

**User Story:** As an administrator, I want to manage business categories in a hierarchical structure, so that businesses can be properly classified and searched.

#### Acceptance Criteria

1. THE API_Server SHALL support hierarchical categories (parent-child relationships)
2. WHEN a category is created, THE API_Server SHALL validate unique name within same parent
3. WHEN a category with children is deleted, THE API_Server SHALL prevent deletion or cascade based on admin choice
4. THE API_Server SHALL return category tree structure for navigation

### Requirement 5: Search and Discovery

**User Story:** As a user, I want to search for businesses by various criteria, so that I can find relevant services quickly.

#### Acceptance Criteria

1. WHEN a text search is performed, THE Web_Directory SHALL search in: business name, category, address, phone
2. WHEN geographic filters are applied, THE API_Server SHALL filter results by governorate/city/district
3. THE API_Server SHALL support sorting by: nearest, newest, featured
4. THE API_Server SHALL implement pagination for all search results
5. WHEN search results are displayed, THE Web_Directory SHALL show results on Leaflet map

### Requirement 6: Subscription Plans Management

**User Story:** As an administrator, I want to manage subscription plans with pricing and granular features, so that businesses can subscribe to appropriate service levels with specific capabilities.

#### Acceptance Criteria

1. THE API_Server SHALL store plans with: name, price, duration (days), and list of Plan_Features
2. THE API_Server SHALL support Plan_Features including: image count limit, WhatsApp display, working hours display, map pin visibility, search priority, profile highlight
3. WHEN a business subscribes to a plan, THE API_Server SHALL create subscription record with start/end dates
4. THE API_Server SHALL track subscription expiration and renewal status
5. WHEN a subscription expires, THE API_Server SHALL automatically assign the business to Default_Plan (free tier)
6. THE Web_Admin SHALL allow configuring Default_Plan features like any other plan
7. WHEN displaying business profile, THE Web_Directory SHALL show/hide elements based on active plan features
8. THE API_Server SHALL validate feature access before allowing feature-specific operations

### Requirement 7: Advertising System

**User Story:** As an administrator, I want to manage paid advertising placements, so that businesses can promote their listings.

#### Acceptance Criteria

1. THE API_Server SHALL support ad placements: sponsored search results, home featured, business profile highlight
2. WHEN an ad is created, THE API_Server SHALL require: business, placement type, duration, geographic targeting
3. THE API_Server SHALL target ads by: governorate/city/district + category
4. WHEN ads are displayed, THE Web_Directory SHALL clearly label them as "إعلان" or "مُعلن"
5. THE Web_Admin SHALL allow enabling/disabling each ad placement type via Feature_Toggle
6. THE API_Server SHALL track ad duration: week/month/3 months

### Requirement 8: Agent Mobile Operations

**User Story:** As a field agent, I want a simple mobile app to register businesses and collect payments, so that I can work efficiently in the field.

#### Acceptance Criteria

1. WHEN adding a business, THE Mobile_Agent SHALL require owner presence (no "owner not present" flow)
2. THE Mobile_Agent SHALL allow: add business, select plan, activate ad, record cash payment
3. WHEN a payment is recorded, THE API_Server SHALL create Agent_Debt record
4. THE Mobile_Agent SHALL display agent's current debt balance prominently
5. THE Mobile_Agent SHALL show daily operations log for the agent
6. THE Mobile_Agent SHALL have minimal UI focused on speed

### Requirement 9: Financial Management (Debts and Settlements)

**User Story:** As an accountant, I want to track agent debts and process settlements, so that financial records are accurate.

#### Acceptance Criteria

1. WHEN an agent collects cash, THE API_Server SHALL record it as Agent_Debt
2. WHEN a settlement is processed, THE API_Server SHALL reduce agent debt and record company treasury entry
3. THE API_Server SHALL maintain complete audit trail for all financial transactions
4. THE Web_Admin SHALL display agent debt reports and settlement history
5. THE API_Server SHALL prevent negative debt balances

### Requirement 10: Feature Toggles System

**User Story:** As an administrator, I want to enable/disable features without code changes, so that I can control system behavior dynamically.

#### Acceptance Criteria

1. THE Web_Admin SHALL provide toggles for: WhatsApp display, working hours, visitor business submission, ad types, homepage blocks
2. WHEN a feature toggle is changed, THE API_Server SHALL apply the change immediately without restart
3. THE API_Server SHALL store feature toggles in database with: key, value, description, target app
4. WHEN a feature is disabled, THE affected apps SHALL hide or disable the corresponding functionality

### Requirement 11: Block System for UI Customization

**User Story:** As an administrator, I want to customize UI blocks (header, footer, hero), so that I can modify appearance without full page builder.

#### Acceptance Criteria

1. THE API_Server SHALL store blocks with: type, schemaVersion, settingsJson, isEnabled, target app
2. THE Web_Admin SHALL provide settings editor for each block type
3. WHEN block settings are updated, THE Web_Directory SHALL reflect changes on next page load
4. THE API_Server SHALL support block types: header, footer, home hero

### Requirement 12: Multi-Storage Provider Support

**User Story:** As a system administrator, I want to use different storage providers, so that I can choose the best option for cost and performance.

#### Acceptance Criteria

1. THE API_Server SHALL implement Storage Abstraction Layer with: putObject, getSignedUrl, deleteObject, exists
2. THE API_Server SHALL support providers: Cloudflare R2, Amazon S3, MinIO, Bunny Storage, Local filesystem
3. WHEN a file is stored, THE API_Server SHALL save metadata: storageProvider, bucket, objectKey, mimeType, size, checksum
4. THE API_Server SHALL generate Signed URLs or proxy access based on configuration
5. THE Web_Admin SHALL allow changing default storage provider without breaking existing files

### Requirement 13: Map Integration

**User Story:** As a user, I want to view businesses on an interactive map, so that I can see their locations visually.

#### Acceptance Criteria

1. THE Web_Directory SHALL use Leaflet for map display (no Google Maps)
2. THE API_Server SHALL use PostGIS for geographic queries
3. WHEN map view is requested, THE Web_Directory SHALL display business markers with basic info popup
4. THE Web_Directory SHALL use free/open tile provider for map tiles

### Requirement 14: Multi-Language Support (i18n)

**User Story:** As a user, I want to use the system in my preferred language, so that I can understand and interact with all features comfortably.

#### Acceptance Criteria

1. THE system SHALL support Arabic as primary language and English as secondary language
2. THE API_Server SHALL store translatable content with Translation_Keys for: business names, descriptions, category names, plan names, UI labels
3. WHEN a user selects a Locale, THE apps SHALL display all UI elements and content in that language
4. THE Web_Admin SHALL provide translation management interface for all translatable content
5. THE API_Server SHALL support adding new languages without code changes
6. WHEN translation is missing for selected Locale, THE system SHALL fallback to primary language (Arabic)
7. THE API_Server SHALL store user language preference in profile
8. THE Mobile_Agent SHALL support RTL layout for Arabic and LTR for English

### Requirement 15: SEO Optimization

**User Story:** As a business owner, I want my business page to rank well in search engines, so that potential customers can find me easily.

#### Acceptance Criteria

1. THE Web_Directory SHALL generate unique meta tags (title, description, keywords) for each business page
2. THE Web_Directory SHALL implement structured data (JSON-LD) for: LocalBusiness, Organization, BreadcrumbList, SearchAction
3. THE Web_Directory SHALL generate dynamic sitemap.xml with all public pages (businesses, categories, locations)
4. THE Web_Directory SHALL implement canonical URLs for all pages
5. THE Web_Directory SHALL use semantic HTML5 elements (header, nav, main, article, footer)
6. THE Web_Directory SHALL implement Open Graph and Twitter Card meta tags for social sharing
7. THE API_Server SHALL support custom SEO fields per business: meta title, meta description, slug
8. THE Web_Directory SHALL implement proper heading hierarchy (h1-h6) on all pages
9. THE Web_Directory SHALL generate robots.txt with appropriate directives
10. THE Web_Directory SHALL implement hreflang tags for multi-language pages

### Requirement 16: Reviews and Ratings System

**User Story:** As a user, I want to read and write reviews for businesses, so that I can make informed decisions and share my experiences.

#### Acceptance Criteria

1. WHEN a user submits a review, THE API_Server SHALL store: rating (1-5), text, user ID, business ID, timestamp
2. THE API_Server SHALL calculate and cache average rating for each business
3. THE Web_Directory SHALL display reviews with pagination and sorting (newest, highest, lowest)
4. THE Web_Admin SHALL provide review moderation interface (approve, reject, flag)
5. WHEN a review is flagged, THE API_Server SHALL hide it pending admin review
6. THE API_Server SHALL prevent duplicate reviews from same user for same business within 30 days
7. THE Web_Directory SHALL display review count and average rating on business cards and profile

### Requirement 17: User Rewards and Gamification

**User Story:** As a user, I want to earn points for helpful actions, so that I feel motivated to contribute to the platform.

#### Acceptance Criteria

1. THE API_Server SHALL award points for: submitting review, reporting incorrect phone, reporting closed business, first review of the day
2. THE API_Server SHALL store user points balance and transaction history
3. THE Web_Directory SHALL display user points and level/badge on profile
4. THE Web_Admin SHALL configure point values for each action type
5. WHEN a user reports incorrect information, THE API_Server SHALL award points after admin verification
6. THE API_Server SHALL support point redemption for future features (optional)

### Requirement 18: Advanced Advertising System

**User Story:** As an advertiser, I want flexible advertising options with various placements, so that I can effectively promote my business.

#### Acceptance Criteria

1. THE API_Server SHALL support ad placements: search results sponsored, home hero banner, category page banner, business profile sidebar, map pin highlight, search autocomplete suggestion
2. THE Web_Admin SHALL allow creating ad campaigns with: budget, duration, targeting, placement selection
3. THE API_Server SHALL support targeting by: geographic area, category, time of day, device type
4. THE API_Server SHALL track impressions and clicks for each ad
5. THE Web_Admin SHALL display ad performance reports with: impressions, clicks, CTR
6. THE API_Server SHALL support ad scheduling (start date, end date, active hours)
7. THE Web_Admin SHALL allow setting maximum ads per placement per page
8. THE API_Server SHALL implement ad rotation for same placement

### Requirement 19: Responsive Design

**User Story:** As a user, I want the website to work perfectly on any device, so that I can access it from mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE Web_Directory SHALL implement mobile-first responsive design
2. THE Web_Directory SHALL adapt layout for breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
3. THE Web_Directory SHALL optimize touch targets for mobile (minimum 44x44px)
4. THE Web_Directory SHALL implement lazy loading for images and maps
5. THE Web_Admin SHALL be fully functional on tablet and desktop devices
6. THE Web_Directory SHALL achieve Core Web Vitals targets: LCP <2.5s, FID <100ms, CLS <0.1



### Requirement 20: Performance and Caching

**User Story:** As a user, I want fast page loads and responsive interactions, so that I can find information quickly without waiting.

#### Acceptance Criteria

1. THE API_Server SHALL implement Redis caching for: search results, category trees, geographic data, feature toggles
2. THE API_Server SHALL use database connection pooling for optimal performance
3. THE Web_Directory SHALL implement ISR (Incremental Static Regeneration) for business pages
4. THE API_Server SHALL implement query optimization with proper indexes (GiST for geo, pg_trgm for text search)
5. THE API_Server SHALL support response compression (gzip/brotli)
6. THE Web_Directory SHALL implement CDN caching for static assets
7. THE API_Server SHALL implement request batching for related data

### Requirement 21: Data Reporting System

**User Story:** As an administrator, I want to view reports about incorrect business information, so that I can maintain data quality.

#### Acceptance Criteria

1. WHEN a user reports incorrect info, THE API_Server SHALL create report with: type (wrong phone, closed, wrong location), description, reporter ID
2. THE Web_Admin SHALL display pending reports queue with filtering and sorting
3. WHEN admin resolves a report, THE API_Server SHALL update business data and award reporter points
4. THE API_Server SHALL track report resolution statistics
5. THE Web_Directory SHALL show "Report an issue" button on business profiles

### Requirement 22: Notification System

**User Story:** As a user, I want to receive notifications about relevant updates, so that I stay informed about my activities and interests.

#### Acceptance Criteria

1. THE API_Server SHALL support notification types: subscription expiry, review reply, report resolved, points earned
2. THE API_Server SHALL store notifications with: type, title, body, read status, timestamp
3. THE Web_Directory SHALL display notification bell with unread count
4. THE Mobile_Agent SHALL support push notifications for agents
5. THE Web_Admin SHALL allow sending broadcast notifications to user segments


### Requirement 23: Mobile User Application

**User Story:** As a user, I want a mobile app to browse the directory, search for businesses, and interact with the platform, so that I can access services conveniently from my phone.

#### Acceptance Criteria

1. THE Mobile_User SHALL provide all features available on Web_Directory
2. THE Mobile_User SHALL support Arabic and English with RTL/LTR layouts
3. THE Mobile_User SHALL implement search with filters (category, location, text)
4. THE Mobile_User SHALL display business profiles with images, contact info, reviews
5. THE Mobile_User SHALL integrate Leaflet maps for location viewing
6. THE Mobile_User SHALL allow users to submit reviews and ratings
7. THE Mobile_User SHALL display user points balance and rewards
8. THE Mobile_User SHALL support push notifications
9. THE Mobile_User SHALL implement offline caching for recently viewed businesses
10. THE Mobile_User SHALL consume API endpoints consistently with web clients

### Requirement 24: Business Ownership

**User Story:** As a business owner, I want to manage multiple businesses under my account, so that I can control all my listings from one place.

#### Acceptance Criteria

1. THE API_Server SHALL support one-to-many relationship between User and Business (owner)
2. WHEN a business is claimed by owner, THE API_Server SHALL link it to owner's account
3. THE Web_Directory SHALL allow owners to edit their business information
4. THE Mobile_User SHALL provide owner dashboard for managing owned businesses
5. THE API_Server SHALL validate owner permissions before allowing business edits
