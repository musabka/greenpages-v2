-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add geography column to businesses table (run after Prisma migration)
-- This will be executed manually after the initial Prisma migration
-- ALTER TABLE businesses ADD COLUMN location geography(Point, 4326);

-- Create GiST index for geography column
-- CREATE INDEX businesses_location_idx ON businesses USING GIST (location);

-- Create trigram indexes for text search
-- CREATE INDEX business_translations_name_trgm_idx ON business_translations USING GIN (name gin_trgm_ops);
-- CREATE INDEX category_translations_name_trgm_idx ON category_translations USING GIN (name gin_trgm_ops);
