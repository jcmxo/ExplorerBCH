-- Ethereum Event Explorer - Example Queries

-- ============================================
-- EVENT QUERIES
-- ============================================

-- Count total events
SELECT COUNT(*) as total_events FROM events;

-- Events by type
SELECT 
  event_name,
  COUNT(*) as count
FROM events
WHERE event_name IS NOT NULL
GROUP BY event_name
ORDER BY count DESC;

-- Recent events
SELECT 
  block_number,
  transaction_hash,
  contract_address,
  event_name,
  created_at
FROM events
ORDER BY block_number DESC
LIMIT 100;

-- Events in a specific block range
SELECT 
  block_number,
  COUNT(*) as event_count
FROM events
WHERE block_number BETWEEN 18000000 AND 18001000
GROUP BY block_number
ORDER BY block_number;

-- ============================================
-- TRANSFER EVENTS (ERC20)
-- ============================================

-- All Transfer events
SELECT 
  block_number,
  transaction_hash,
  contract_address,
  param1 as from_address,
  param2 as to_address,
  param3 as amount_hex,
  created_at
FROM events
WHERE event_name = 'Transfer'
ORDER BY block_number DESC
LIMIT 100;

-- Transfers for a specific token
SELECT 
  block_number,
  transaction_hash,
  param1 as from_address,
  param2 as to_address,
  param3 as amount_hex
FROM events
WHERE event_name = 'Transfer'
  AND contract_address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' -- USDC
ORDER BY block_number DESC;

-- Top tokens by transfer count
SELECT 
  contract_address,
  COUNT(*) as transfer_count,
  MIN(block_number) as first_transfer_block,
  MAX(block_number) as last_transfer_block
FROM events
WHERE event_name = 'Transfer'
GROUP BY contract_address
ORDER BY transfer_count DESC
LIMIT 20;

-- Transfer volume by token (approximate - using hex values)
SELECT 
  contract_address,
  COUNT(*) as transfer_count,
  COUNT(DISTINCT param1) as unique_senders,
  COUNT(DISTINCT param2) as unique_receivers
FROM events
WHERE event_name = 'Transfer'
GROUP BY contract_address
ORDER BY transfer_count DESC;

-- ============================================
-- CONSUMER METRICS
-- ============================================

-- Overall performance
SELECT 
  COUNT(*) as total_jobs,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_jobs,
  SUM(CASE WHEN success THEN 0 ELSE 1 END) as failed_jobs,
  SUM(blocks_processed) as total_blocks,
  SUM(events_extracted) as total_events,
  AVG(blocks_per_second) as avg_throughput
FROM consumer_metrics;

-- Performance by consumer
SELECT 
  consumer_id,
  COUNT(*) as jobs_processed,
  SUM(blocks_processed) as total_blocks,
  SUM(events_extracted) as total_events,
  AVG(blocks_per_second) as avg_throughput,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
  SUM(retry_count) as total_retries,
  COUNT(*) FILTER (WHERE retry_count > 0) as jobs_with_retries
FROM consumer_metrics
GROUP BY consumer_id
ORDER BY total_blocks DESC;

-- Performance over time
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as jobs,
  SUM(blocks_processed) as blocks,
  SUM(events_extracted) as events,
  AVG(blocks_per_second) as avg_throughput
FROM consumer_metrics
WHERE success = true
GROUP BY hour
ORDER BY hour DESC
LIMIT 24;

-- Failed jobs with retry information
SELECT 
  consumer_id,
  start_block,
  end_block,
  retry_count,
  error_message,
  created_at
FROM consumer_metrics
WHERE success = false
ORDER BY created_at DESC
LIMIT 50;

-- Jobs that required retries (reprocessed ranges)
SELECT 
  consumer_id,
  start_block,
  end_block,
  retry_count,
  success,
  error_message,
  created_at
FROM consumer_metrics
WHERE retry_count > 0
ORDER BY retry_count DESC, created_at DESC
LIMIT 50;

-- Ranges that were split (indicated by SPLIT in error message)
SELECT 
  consumer_id,
  start_block,
  end_block,
  blocks_processed,
  error_message,
  created_at
FROM consumer_metrics
WHERE error_message LIKE 'SPLIT:%'
ORDER BY created_at DESC;

-- ============================================
-- RPC MANAGEMENT
-- ============================================

-- RPC status with cooldown information
SELECT 
  id,
  name,
  active,
  fail_count,
  last_error,
  last_used_at,
  deactivated_at,
  CASE 
    WHEN active = false AND deactivated_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (NOW() - deactivated_at)) / 60
    ELSE NULL
  END as minutes_in_cooldown
FROM rpcs
ORDER BY fail_count ASC, last_used_at ASC NULLS FIRST;

-- RPCs in cooldown (will auto-reactivate)
SELECT 
  id,
  name,
  fail_count,
  deactivated_at,
  EXTRACT(EPOCH FROM (NOW() - deactivated_at)) / 60 as minutes_in_cooldown
FROM rpcs
WHERE active = false 
  AND deactivated_at IS NOT NULL
ORDER BY deactivated_at ASC;

-- Active RPCs
SELECT * FROM rpcs WHERE active = true;

-- Problematic RPCs (high fail count or recently deactivated)
SELECT 
  id,
  name,
  active,
  fail_count,
  last_error,
  deactivated_at,
  CASE 
    WHEN active = false THEN 'Deactivated'
    WHEN fail_count >= 3 THEN 'High fail count'
    ELSE 'OK'
  END as status
FROM rpcs 
WHERE fail_count > 0 OR active = false
ORDER BY fail_count DESC, deactivated_at DESC;

-- ============================================
-- EVENT SIGNATURES
-- ============================================

-- Resolved signatures
SELECT 
  signature,
  name,
  created_at
FROM event_signatures
ORDER BY created_at DESC;

-- Unresolved events (Unknown)
SELECT 
  event_signature,
  COUNT(*) as count
FROM events
WHERE event_name = 'Unknown'
GROUP BY event_signature
ORDER BY count DESC
LIMIT 20;

-- ============================================
-- ANALYTICS
-- ============================================

-- Events per block (average)
SELECT 
  AVG(event_count) as avg_events_per_block
FROM (
  SELECT 
    block_number,
    COUNT(*) as event_count
  FROM events
  GROUP BY block_number
) sub;

-- Most active contracts
SELECT 
  contract_address,
  COUNT(*) as event_count,
  COUNT(DISTINCT event_name) as unique_events,
  MIN(block_number) as first_seen,
  MAX(block_number) as last_seen
FROM events
GROUP BY contract_address
ORDER BY event_count DESC
LIMIT 20;

-- Event distribution by block range
SELECT 
  (block_number / 100000) * 100000 as block_range_start,
  COUNT(*) as event_count,
  COUNT(DISTINCT contract_address) as unique_contracts
FROM events
GROUP BY (block_number / 100000) * 100000
ORDER BY block_range_start;

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Check database size
SELECT 
  pg_size_pretty(pg_database_size('ethereum_events')) as database_size;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Cleanup old metrics (older than 30 days)
-- DELETE FROM consumer_metrics WHERE created_at < NOW() - INTERVAL '30 days';

-- Reset RPC fail counts
-- UPDATE rpcs SET fail_count = 0, active = true WHERE fail_count > 0;

