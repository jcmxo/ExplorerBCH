-- Ethereum Event Explorer Database Schema

-- RPCs table
CREATE TABLE IF NOT EXISTS rpcs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    fail_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_used_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    event_signature VARCHAR(66) NOT NULL,
    event_name VARCHAR(255),
    param1 TEXT,
    param2 TEXT,
    param3 TEXT,
    param4 TEXT,
    param5 TEXT,
    param6 TEXT,
    param7 TEXT,
    param8 TEXT,
    param9 TEXT,
    param10 TEXT,
    param11 TEXT,
    param12 TEXT,
    param13 TEXT,
    param14 TEXT,
    param15 TEXT,
    param16 TEXT,
    param17 TEXT,
    param18 TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consumer metrics table
CREATE TABLE IF NOT EXISTS consumer_metrics (
    id SERIAL PRIMARY KEY,
    consumer_id VARCHAR(255) NOT NULL,
    rpc_id INTEGER REFERENCES rpcs(id),
    start_block BIGINT NOT NULL,
    end_block BIGINT NOT NULL,
    blocks_processed INTEGER NOT NULL,
    events_extracted INTEGER NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    blocks_per_second DECIMAL(10, 2),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_block_number ON events(block_number);
CREATE INDEX IF NOT EXISTS idx_events_transaction_hash ON events(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_events_contract_address ON events(contract_address);
CREATE INDEX IF NOT EXISTS idx_events_event_signature ON events(event_signature);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_consumer_metrics_consumer_id ON consumer_metrics(consumer_id);
CREATE INDEX IF NOT EXISTS idx_consumer_metrics_created_at ON consumer_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_rpcs_active ON rpcs(active);

-- Event signature cache table (for 4byte.directory results)
CREATE TABLE IF NOT EXISTS event_signatures (
    signature VARCHAR(66) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

