-- Run this script after the initial Prisma migration
-- This adds the PostGIS geography column and related indexes

-- Add geography column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Create trigger to auto-update location from lat/lng
CREATE OR REPLACE FUNCTION update_business_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_location_trigger ON businesses;
CREATE TRIGGER business_location_trigger
  BEFORE INSERT OR UPDATE OF lat, lng ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_business_location();

-- Update existing records
UPDATE businesses SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography WHERE location IS NULL;

-- Create GiST index for geography column
CREATE INDEX IF NOT EXISTS businesses_location_idx ON businesses USING GIST (location);

-- Create trigram indexes for text search
CREATE INDEX IF NOT EXISTS business_translations_name_trgm_idx ON business_translations USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS category_translations_name_trgm_idx ON category_translations USING GIN (name gin_trgm_ops);
