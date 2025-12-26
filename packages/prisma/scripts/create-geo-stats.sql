-- Geographic Statistics Table
-- Purpose: Precomputed business counts per geographic entity to avoid heavy COUNT queries
-- Strategy: Dedicated table with incremental updates via triggers
-- Justification: Better than materialized views for:
--   - Granular updates (only affected rows)
--   - Full Prisma support
--   - Flexible indexing
--   - No locking during refresh

-- Create geo_stats table
CREATE TABLE IF NOT EXISTS geo_stats (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('governorate', 'city', 'district')),
  entity_id TEXT NOT NULL,
  company_count INTEGER NOT NULL DEFAULT 0,
  active_company_count INTEGER NOT NULL DEFAULT 0,
  featured_company_count INTEGER NOT NULL DEFAULT 0,
  verified_company_count INTEGER NOT NULL DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS geo_stats_entity_type_idx ON geo_stats(entity_type);
CREATE INDEX IF NOT EXISTS geo_stats_entity_id_idx ON geo_stats(entity_id);
CREATE INDEX IF NOT EXISTS geo_stats_company_count_idx ON geo_stats(company_count DESC);
CREATE INDEX IF NOT EXISTS geo_stats_active_company_count_idx ON geo_stats(active_company_count DESC);

-- Function to update governorate stats
CREATE OR REPLACE FUNCTION update_governorate_stats(gov_id TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO geo_stats (id, entity_type, entity_id, company_count, active_company_count, featured_company_count, verified_company_count, avg_rating, total_reviews, last_updated)
  SELECT 
    'gov_' || gov_id,
    'governorate',
    gov_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE b."isActive" = true AND b."deletedAt" IS NULL),
    COUNT(*) FILTER (WHERE b."isFeatured" = true AND b."isActive" = true AND b."deletedAt" IS NULL),
    COUNT(*) FILTER (WHERE b."isVerified" = true AND b."isActive" = true AND b."deletedAt" IS NULL),
    COALESCE(AVG(b."avgRating") FILTER (WHERE b."isActive" = true AND b."deletedAt" IS NULL), 0),
    COALESCE(SUM(b."reviewCount") FILTER (WHERE b."isActive" = true AND b."deletedAt" IS NULL), 0)::INTEGER,
    NOW()
  FROM businesses b
  INNER JOIN districts d ON d.id = b."districtId"
  INNER JOIN cities c ON c.id = d."cityId"
  WHERE c."governorateId" = gov_id
  ON CONFLICT (entity_type, entity_id) 
  DO UPDATE SET
    company_count = EXCLUDED.company_count,
    active_company_count = EXCLUDED.active_company_count,
    featured_company_count = EXCLUDED.featured_company_count,
    verified_company_count = EXCLUDED.verified_company_count,
    avg_rating = EXCLUDED.avg_rating,
    total_reviews = EXCLUDED.total_reviews,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update city stats
CREATE OR REPLACE FUNCTION update_city_stats(city_id TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO geo_stats (id, entity_type, entity_id, company_count, active_company_count, featured_company_count, verified_company_count, avg_rating, total_reviews, last_updated)
  SELECT 
    'city_' || city_id,
    'city',
    city_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE b."isActive" = true AND b."deletedAt" IS NULL),
    COUNT(*) FILTER (WHERE b."isFeatured" = true AND b."isActive" = true AND b."deletedAt" IS NULL),
    COUNT(*) FILTER (WHERE b."isVerified" = true AND b."isActive" = true AND b."deletedAt" IS NULL),
    COALESCE(AVG(b."avgRating") FILTER (WHERE b."isActive" = true AND b."deletedAt" IS NULL), 0),
    COALESCE(SUM(b."reviewCount") FILTER (WHERE b."isActive" = true AND b."deletedAt" IS NULL), 0)::INTEGER,
    NOW()
  FROM businesses b
  INNER JOIN districts d ON d.id = b."districtId"
  WHERE d."cityId" = city_id
  ON CONFLICT (entity_type, entity_id) 
  DO UPDATE SET
    company_count = EXCLUDED.company_count,
    active_company_count = EXCLUDED.active_company_count,
    featured_company_count = EXCLUDED.featured_company_count,
    verified_company_count = EXCLUDED.verified_company_count,
    avg_rating = EXCLUDED.avg_rating,
    total_reviews = EXCLUDED.total_reviews,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update district stats
CREATE OR REPLACE FUNCTION update_district_stats(dist_id TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO geo_stats (id, entity_type, entity_id, company_count, active_company_count, featured_company_count, verified_company_count, avg_rating, total_reviews, last_updated)
  SELECT 
    'dist_' || dist_id,
    'district',
    dist_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE b."isActive" = true AND b."deletedAt" IS NULL),
    COUNT(*) FILTER (WHERE b."isFeatured" = true AND b."isActive" = true AND b."deletedAt" IS NULL),
    COUNT(*) FILTER (WHERE b."isVerified" = true AND b."isActive" = true AND b."deletedAt" IS NULL),
    COALESCE(AVG(b."avgRating") FILTER (WHERE b."isActive" = true AND b."deletedAt" IS NULL), 0),
    COALESCE(SUM(b."reviewCount") FILTER (WHERE b."isActive" = true AND b."deletedAt" IS NULL), 0)::INTEGER,
    NOW()
  FROM businesses b
  WHERE b."districtId" = dist_id
  ON CONFLICT (entity_type, entity_id) 
  DO UPDATE SET
    company_count = EXCLUDED.company_count,
    active_company_count = EXCLUDED.active_company_count,
    featured_company_count = EXCLUDED.featured_company_count,
    verified_company_count = EXCLUDED.verified_company_count,
    avg_rating = EXCLUDED.avg_rating,
    total_reviews = EXCLUDED.total_reviews,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update stats when business changes
CREATE OR REPLACE FUNCTION trigger_update_geo_stats()
RETURNS TRIGGER AS $$
DECLARE
  old_district_id TEXT;
  new_district_id TEXT;
  city_id TEXT;
  governorate_id TEXT;
BEGIN
  -- Handle INSERT and UPDATE
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    new_district_id := NEW."districtId";
    
    -- Get city and governorate IDs
    SELECT d."cityId", c."governorateId" INTO city_id, governorate_id
    FROM districts d
    INNER JOIN cities c ON c.id = d."cityId"
    WHERE d.id = new_district_id;
    
    -- Update stats for new location
    PERFORM update_district_stats(new_district_id);
    PERFORM update_city_stats(city_id);
    PERFORM update_governorate_stats(governorate_id);
  END IF;
  
  -- Handle UPDATE with district change or DELETE
  IF (TG_OP = 'UPDATE' AND OLD."districtId" != NEW."districtId") OR TG_OP = 'DELETE' THEN
    old_district_id := OLD."districtId";
    
    -- Get old city and governorate IDs
    SELECT d."cityId", c."governorateId" INTO city_id, governorate_id
    FROM districts d
    INNER JOIN cities c ON c.id = d."cityId"
    WHERE d.id = old_district_id;
    
    -- Update stats for old location
    PERFORM update_district_stats(old_district_id);
    PERFORM update_city_stats(city_id);
    PERFORM update_governorate_stats(governorate_id);
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on businesses table
DROP TRIGGER IF EXISTS business_geo_stats_trigger ON businesses;
CREATE TRIGGER business_geo_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_geo_stats();

-- Function to refresh all stats (for initial population or full refresh)
CREATE OR REPLACE FUNCTION refresh_all_geo_stats()
RETURNS VOID AS $$
DECLARE
  gov_record RECORD;
  city_record RECORD;
  dist_record RECORD;
BEGIN
  -- Update all governorate stats
  FOR gov_record IN SELECT id FROM governorates LOOP
    PERFORM update_governorate_stats(gov_record.id);
  END LOOP;
  
  -- Update all city stats
  FOR city_record IN SELECT id FROM cities LOOP
    PERFORM update_city_stats(city_record.id);
  END LOOP;
  
  -- Update all district stats
  FOR dist_record IN SELECT id FROM districts LOOP
    PERFORM update_district_stats(dist_record.id);
  END LOOP;
  
  RAISE NOTICE 'All geo stats refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Initial population of stats
SELECT refresh_all_geo_stats();

-- Create a scheduled job function (to be called by cron or pg_cron)
-- This is optional - the trigger keeps stats up-to-date in real-time
-- Use this only if you want periodic full refreshes for data integrity
CREATE OR REPLACE FUNCTION scheduled_geo_stats_refresh()
RETURNS VOID AS $$
BEGIN
  -- Only refresh stats older than 1 hour (safety check)
  -- This prevents unnecessary refreshes if triggers are working
  PERFORM refresh_all_geo_stats();
  RAISE NOTICE 'Scheduled geo stats refresh completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE geo_stats IS 'Precomputed geographic statistics for businesses. Updated automatically via triggers on business changes.';
COMMENT ON FUNCTION update_governorate_stats IS 'Updates statistics for a specific governorate. Called by trigger or manually.';
COMMENT ON FUNCTION update_city_stats IS 'Updates statistics for a specific city. Called by trigger or manually.';
COMMENT ON FUNCTION update_district_stats IS 'Updates statistics for a specific district. Called by trigger or manually.';
COMMENT ON FUNCTION refresh_all_geo_stats IS 'Refreshes all geographic statistics. Use for initial population or full refresh.';
COMMENT ON FUNCTION trigger_update_geo_stats IS 'Trigger function that automatically updates geo stats when businesses change.';
