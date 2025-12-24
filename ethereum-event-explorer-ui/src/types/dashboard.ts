export interface DashboardMetrics {
  blocksProcessed: number;
  eventsExtracted: number;
  speed: number; // blocks per second
  successRate: number; // percentage
  activeConsumers: number;
  failedConsumers: number;
  averageTime: number; // seconds
}

export interface Consumer {
  id: string;
  state: 'active' | 'inactive' | 'failed';
  blocks: number;
  events: number;
  speed: number; // blocks per second
  time: number; // seconds
  started: string; // ISO timestamp
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentConsumers: Consumer[];
}

