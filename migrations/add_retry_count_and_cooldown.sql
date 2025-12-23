-- Migration: Add retry_count to consumer_metrics and deactivated_at to rpcs
-- Run this if you have an existing database

-- Add retry_count column to consumer_metrics
ALTER TABLE consumer_metrics 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Add deactivated_at column to rpcs
ALTER TABLE rpcs 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP;

-- Update existing records
UPDATE consumer_metrics SET retry_count = 0 WHERE retry_count IS NULL;
UPDATE rpcs SET deactivated_at = NULL WHERE deactivated_at IS NULL AND active = true;

