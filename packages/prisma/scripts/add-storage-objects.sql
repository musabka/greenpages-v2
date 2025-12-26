-- Storage Objects Table Migration
-- يضيف جدول لتتبع جميع الملفات المخزنة مع دعم Soft Delete و Migration

-- Create enum if not exists
DO $$ BEGIN
    CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'R2', 'S3', 'MINIO', 'BUNNY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create storage_objects table
CREATE TABLE IF NOT EXISTS storage_objects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    provider "StorageProvider" NOT NULL,
    bucket TEXT NOT NULL,
    object_key TEXT NOT NULL UNIQUE,
    original_name TEXT,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    checksum TEXT NOT NULL,
    
    -- Soft delete support
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Migration tracking
    migrated_from TEXT,
    migrated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_storage_objects_provider ON storage_objects(provider);
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket ON storage_objects(bucket);
CREATE INDEX IF NOT EXISTS idx_storage_objects_is_deleted ON storage_objects(is_deleted);
CREATE INDEX IF NOT EXISTS idx_storage_objects_created_at ON storage_objects(created_at);
CREATE INDEX IF NOT EXISTS idx_storage_objects_deleted_at ON storage_objects(deleted_at) WHERE is_deleted = true;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_storage_objects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_storage_objects_updated_at ON storage_objects;
CREATE TRIGGER trigger_storage_objects_updated_at
    BEFORE UPDATE ON storage_objects
    FOR EACH ROW
    EXECUTE FUNCTION update_storage_objects_updated_at();

-- Comment
COMMENT ON TABLE storage_objects IS 'جدول تتبع جميع الملفات المخزنة مع دعم Soft Delete و Migration';
COMMENT ON COLUMN storage_objects.is_deleted IS 'علامة الحذف الناعم - الملف لا يزال موجوداً فعلياً';
COMMENT ON COLUMN storage_objects.migrated_from IS 'المزود الأصلي قبل النقل';
COMMENT ON COLUMN storage_objects.migrated_at IS 'تاريخ النقل';
