-- ============================================
-- Business Module Database Constraints & Indexes
-- ============================================

-- 1. Ensure only one isPrimary=true per business
-- Using a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_images_single_primary 
ON business_images (business_id) 
WHERE is_primary = true;

-- 2. Add GiST index for PostGIS location column (if not exists)
-- This enables efficient spatial queries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_businesses_location_gist'
    ) THEN
        CREATE INDEX idx_businesses_location_gist 
        ON businesses USING GIST (location);
    END IF;
END $$;

-- 3. Add pg_trgm indexes for text search
-- Enable the extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for business name search (trigram)
CREATE INDEX IF NOT EXISTS idx_business_translations_name_trgm 
ON business_translations USING GIN (name gin_trgm_ops);

-- Index for business address search (trigram)
CREATE INDEX IF NOT EXISTS idx_business_translations_address_trgm 
ON business_translations USING GIN (address gin_trgm_ops);

-- Index for category name search (trigram)
CREATE INDEX IF NOT EXISTS idx_category_translations_name_trgm 
ON category_translations USING GIN (name gin_trgm_ops);

-- 4. Add index for normalized phone search
CREATE INDEX IF NOT EXISTS idx_businesses_phone_normalized 
ON businesses (phone_normalized) 
WHERE phone_normalized IS NOT NULL;

-- 5. Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_businesses_active_category 
ON businesses (category_id, is_active, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_active_district 
ON businesses (district_id, is_active, deleted_at) 
WHERE deleted_at IS NULL;

-- 6. Index for featured businesses
CREATE INDEX IF NOT EXISTS idx_businesses_featured 
ON businesses (is_featured, avg_rating DESC, review_count DESC) 
WHERE is_active = true AND deleted_at IS NULL AND is_featured = true;

-- 7. Trigger to auto-update location column when lat/lng changes
CREATE OR REPLACE FUNCTION update_business_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_business_location ON businesses;
CREATE TRIGGER trg_update_business_location
    BEFORE INSERT OR UPDATE OF lat, lng ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_business_location();

-- 8. Trigger to normalize phone on insert/update
CREATE OR REPLACE FUNCTION normalize_business_phone()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.phone IS NOT NULL THEN
        NEW.phone_normalized = regexp_replace(NEW.phone, '\D', '', 'g');
    ELSE
        NEW.phone_normalized = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_business_phone ON businesses;
CREATE TRIGGER trg_normalize_business_phone
    BEFORE INSERT OR UPDATE OF phone ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION normalize_business_phone();

-- 9. Trigger to ensure only one primary image per business
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE business_images 
        SET is_primary = false 
        WHERE business_id = NEW.business_id 
          AND id != NEW.id 
          AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_single_primary_image ON business_images;
CREATE TRIGGER trg_ensure_single_primary_image
    BEFORE INSERT OR UPDATE OF is_primary ON business_images
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION ensure_single_primary_image();

-- 10. Index for soft-deleted businesses (admin queries)
CREATE INDEX IF NOT EXISTS idx_businesses_deleted 
ON businesses (deleted_at DESC) 
WHERE deleted_at IS NOT NULL;

-- 11. Add check constraint for rating range
ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS chk_avg_rating_range;

ALTER TABLE businesses 
ADD CONSTRAINT chk_avg_rating_range 
CHECK (avg_rating >= 0 AND avg_rating <= 5);

-- 12. Add check constraint for coordinates
ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS chk_coordinates_valid;

ALTER TABLE businesses 
ADD CONSTRAINT chk_coordinates_valid 
CHECK (lat >= -90 AND lat <= 90 AND lng >= -180 AND lng <= 180);

-- ============================================
-- Verification Queries
-- ============================================

-- Check all indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('businesses', 'business_images', 'business_translations', 'category_translations')
ORDER BY tablename, indexname;

-- Check all triggers were created
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('businesses', 'business_images')
ORDER BY event_object_table, trigger_name;
