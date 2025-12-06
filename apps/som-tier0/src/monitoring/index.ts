/**
 * Monitoring and Observability Module
 * Tracks metrics, health, and provides alerting for the SOM
 */

export interface EventMetrics {
  ingestionRate: number; // events per second
  totalEventsIngested: number;
  validationFailures: number;
  validationFailureRate: number; // percentage
  averageProcessingLatency: number; // milliseconds
  p95ProcessingLatency: number; // milliseconds
  p99ProcessingLatency: number; // milliseconds
}

export interface QueryMetrics {
  totalQueries: number;
  averageLatency: number; // milliseconds
  p95Latency: number; // milliseconds
  p99Latency: number; // milliseconds
  cacheHitRate: number; // percentage
  errorRate: number; // percentage
  queriesByType: Record<string, number>;
}

export interface BusinessMetrics {
  holonCounts: Record<string, number>; // by type
  totalHolons: number;
  activeHolons: number;
  inactiveHolons: number;
  relationshipCounts: Record<string, number>; // by type
  totalRelationships: number;
  activeRelationships: number;
  constraintViolations: number;
  constraintViolationsByType: Record<string, number>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number; // milliseconds
  lastHealthCheck: Date;
  components: {
    eventStore: ComponentHealth;
    graphStore: ComponentHealth;
    constraintEngine: ComponentHealth;
    queryLayer: ComponentHealth;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  errorCount: number;
  latency: number; // milliseconds
  message?: string;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'validation_failure' | 'performance_degradation' | 'system_error' | 'business_rule';
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
  resolved: boolean;
}

export type AlertHandler = (alert: Alert) => void;

export interface MonitoringConfig {
  metricsRetentionPeriod: number; // milliseconds
  healthCheckInterval: number; // milliseconds
  alertThresholds: {
    validationFailureRate: number; // percentage
    queryErrorRate: number; // percentage
    processingLatencyP95: number; // milliseconds
    queryLatencyP95: number; // milliseconds
    constraintViolationRate: number; // per hour
  };
}

const DEFAULT_CONFIG: MonitoringConfig = {
  metricsRetentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
  healthCheckInterval: 60 * 1000, // 1 minute
  alertThresholds: {
    validationFailureRate: 5, // 5%
    queryErrorRate: 1, // 1%
    processingLatencyP95: 1000, // 1 second
    queryLatencyP95: 500, // 500ms
    constraintViolationRate: 100, // 100 per hour
  },
};

interface EventRecord {
  timestamp: Date;
  processingTime: number;
  success: boolean;
  validationError?: string;
}

interface QueryRecord {
  timestamp: Date;
  queryType: string;
  latency: number;
  cacheHit: boolean;
  success: boolean;
  error?: string;
}

export class MonitoringService {
  private config: MonitoringConfig;
  private eventRecords: EventRecord[] = [];
  private queryRecords: QueryRecord[] = [];
  private alerts: Alert[] = [];
  private alertHandlers: AlertHandler[] = [];
  private startTime: Date;
  private healthCheckTimer?: NodeJS.Timeout;
  
  // Business metrics state
  private holonCountsByType: Map<string, number> = new Map();
  private activeHolonCount = 0;
  private inactiveHolonCount = 0;
  private relationshipCountsByType: Map<string, number> = new Map();
  private activeRelationshipCount = 0;
  private constraintViolationCount = 0;
  private constraintViolationsByType: Map<string, number> = new Map();
  
  // Component health state
  private componentHealth: SystemHealth['components'] = {
    eventStore: { status: 'healthy', lastCheck: new Date(), errorCount: 0, latency: 0 },
    graphStore: { status: 'healthy', lastCheck: new Date(), errorCount: 0, latency: 0 },
    constraintEngine: { status: 'healthy', lastCheck: new Date(), errorCount: 0, latency: 0 },
    queryLayer: { status: 'healthy', lastCheck: new Date(), errorCount: 0, latency: 0 },
  };

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = new Date();
    this.startHealthChecks();
  }

  // Event Metrics Tracking
  recordEventIngestion(processingTime: number, success: boolean, validationError?: string): void {
    const record: EventRecord = {
      timestamp: new Date(),
      processingTime,
      success,
      validationError,
    };
    
    this.eventRecords.push(record);
    this.cleanupOldRecords();
    
    if (!success) {
      this.checkValidationFailureThreshold();
    }
    
    if (processingTime > this.config.alertThresholds.processingLatencyP95) {
      this.raiseAlert({
        severity: 'warning',
        type: 'performance_degradation',
        message: `Event processing latency exceeded threshold: ${processingTime}ms`,
        metadata: { processingTime, threshold: this.config.alertThresholds.processingLatencyP95 },
      });
    }
  }

  getEventMetrics(): EventMetrics {
    const now = Date.now();
    const recentRecords = this.eventRecords.filter(
      r => now - r.timestamp.getTime() < 60000 // last minute
    );
    
    const failures = this.eventRecords.filter(r => !r.success);
    const latencies = this.eventRecords.map(r => r.processingTime).sort((a, b) => a - b);
    
    return {
      ingestionRate: recentRecords.length / 60, // per second
      totalEventsIngested: this.eventRecords.length,
      validationFailures: failures.length,
      validationFailureRate: this.eventRecords.length > 0 
        ? (failures.length / this.eventRecords.length) * 100 
        : 0,
      averageProcessingLatency: latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0,
      p95ProcessingLatency: this.calculatePercentile(latencies, 0.95),
      p99ProcessingLatency: this.calculatePercentile(latencies, 0.99),
    };
  }

  // Query Metrics Tracking
  recordQuery(queryType: string, latency: number, cacheHit: boolean, success: boolean, error?: string): void {
    const record: QueryRecord = {
      timestamp: new Date(),
      queryType,
      latency,
      cacheHit,
      success,
      error,
    };
    
    this.queryRecords.push(record);
    this.cleanupOldRecords();
    
    if (!success) {
      this.checkQueryErrorThreshold();
    }
    
    if (latency > this.config.alertThresholds.queryLatencyP95) {
      this.raiseAlert({
        severity: 'warning',
        type: 'performance_degradation',
        message: `Query latency exceeded threshold: ${latency}ms for ${queryType}`,
        metadata: { queryType, latency, threshold: this.config.alertThresholds.queryLatencyP95 },
      });
    }
  }

  getQueryMetrics(): QueryMetrics {
    const errors = this.queryRecords.filter(r => !r.success);
    const cacheHits = this.queryRecords.filter(r => r.cacheHit);
    const latencies = this.queryRecords.map(r => r.latency).sort((a, b) => a - b);
    
    const queriesByType: Record<string, number> = {};
    this.queryRecords.forEach(r => {
      queriesByType[r.queryType] = (queriesByType[r.queryType] || 0) + 1;
    });
    
    return {
      totalQueries: this.queryRecords.length,
      averageLatency: latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0,
      p95Latency: this.calculatePercentile(latencies, 0.95),
      p99Latency: this.calculatePercentile(latencies, 0.99),
      cacheHitRate: this.queryRecords.length > 0
        ? (cacheHits.length / this.queryRecords.length) * 100
        : 0,
      errorRate: this.queryRecords.length > 0
        ? (errors.length / this.queryRecords.length) * 100
        : 0,
      queriesByType,
    };
  }

  // Business Metrics Tracking
  recordHolonCreated(type: string, active: boolean = true): void {
    this.holonCountsByType.set(type, (this.holonCountsByType.get(type) || 0) + 1);
    if (active) {
      this.activeHolonCount++;
    } else {
      this.inactiveHolonCount++;
    }
  }

  recordHolonStatusChange(type: string, nowActive: boolean): void {
    if (nowActive) {
      this.activeHolonCount++;
      this.inactiveHolonCount--;
    } else {
      this.activeHolonCount--;
      this.inactiveHolonCount++;
    }
  }

  recordRelationshipCreated(type: string): void {
    this.relationshipCountsByType.set(type, (this.relationshipCountsByType.get(type) || 0) + 1);
    this.activeRelationshipCount++;
  }

  recordRelationshipEnded(type: string): void {
    this.activeRelationshipCount--;
  }

  recordConstraintViolation(constraintType: string): void {
    this.constraintViolationCount++;
    this.constraintViolationsByType.set(
      constraintType,
      (this.constraintViolationsByType.get(constraintType) || 0) + 1
    );
    
    this.checkConstraintViolationThreshold();
  }

  getBusinessMetrics(): BusinessMetrics {
    const holonCounts: Record<string, number> = {};
    this.holonCountsByType.forEach((count, type) => {
      holonCounts[type] = count;
    });
    
    const relationshipCounts: Record<string, number> = {};
    this.relationshipCountsByType.forEach((count, type) => {
      relationshipCounts[type] = count;
    });
    
    const constraintViolationsByType: Record<string, number> = {};
    this.constraintViolationsByType.forEach((count, type) => {
      constraintViolationsByType[type] = count;
    });
    
    return {
      holonCounts,
      totalHolons: this.activeHolonCount + this.inactiveHolonCount,
      activeHolons: this.activeHolonCount,
      inactiveHolons: this.inactiveHolonCount,
      relationshipCounts,
      totalRelationships: Array.from(this.relationshipCountsByType.values()).reduce((a, b) => a + b, 0),
      activeRelationships: this.activeRelationshipCount,
      constraintViolations: this.constraintViolationCount,
      constraintViolationsByType,
    };
  }

  // System Health Monitoring
  updateComponentHealth(
    component: keyof SystemHealth['components'],
    status: ComponentHealth['status'],
    latency: number,
    message?: string
  ): void {
    this.componentHealth[component] = {
      status,
      lastCheck: new Date(),
      errorCount: status !== 'healthy' ? this.componentHealth[component].errorCount + 1 : 0,
      latency,
      message,
    };
  }

  getSystemHealth(): SystemHealth {
    const uptime = Date.now() - this.startTime.getTime();
    
    // Determine overall system status
    const componentStatuses = Object.values(this.componentHealth).map(c => c.status);
    let overallStatus: SystemHealth['status'] = 'healthy';
    
    if (componentStatuses.some(s => s === 'unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (componentStatuses.some(s => s === 'degraded')) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      uptime,
      lastHealthCheck: new Date(),
      components: { ...this.componentHealth },
    };
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      const health = this.getSystemHealth();
      
      if (health.status === 'unhealthy') {
        this.raiseAlert({
          severity: 'critical',
          type: 'system_error',
          message: 'System health is unhealthy',
          metadata: { health },
        });
      } else if (health.status === 'degraded') {
        this.raiseAlert({
          severity: 'warning',
          type: 'system_error',
          message: 'System health is degraded',
          metadata: { health },
        });
      }
    }, this.config.healthCheckInterval);
  }

  // Alerting
  registerAlertHandler(handler: AlertHandler): void {
    this.alertHandlers.push(handler);
  }

  private raiseAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };
    
    this.alerts.push(alert);
    
    // Notify all handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler error:', error);
      }
    });
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  // Threshold Checks
  private checkValidationFailureThreshold(): void {
    const metrics = this.getEventMetrics();
    if (metrics.validationFailureRate > this.config.alertThresholds.validationFailureRate) {
      this.raiseAlert({
        severity: 'critical',
        type: 'validation_failure',
        message: `Validation failure rate exceeded threshold: ${metrics.validationFailureRate.toFixed(2)}%`,
        metadata: {
          currentRate: metrics.validationFailureRate,
          threshold: this.config.alertThresholds.validationFailureRate,
          totalFailures: metrics.validationFailures,
        },
      });
    }
  }

  private checkQueryErrorThreshold(): void {
    const metrics = this.getQueryMetrics();
    if (metrics.errorRate > this.config.alertThresholds.queryErrorRate) {
      this.raiseAlert({
        severity: 'warning',
        type: 'system_error',
        message: `Query error rate exceeded threshold: ${metrics.errorRate.toFixed(2)}%`,
        metadata: {
          currentRate: metrics.errorRate,
          threshold: this.config.alertThresholds.queryErrorRate,
        },
      });
    }
  }

  private checkConstraintViolationThreshold(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    // Count violations in the last hour
    const recentViolations = this.eventRecords.filter(
      r => !r.success && r.timestamp.getTime() > oneHourAgo
    ).length;
    
    if (recentViolations > this.config.alertThresholds.constraintViolationRate) {
      this.raiseAlert({
        severity: 'warning',
        type: 'business_rule',
        message: `Constraint violation rate exceeded threshold: ${recentViolations} violations in the last hour`,
        metadata: {
          violationsLastHour: recentViolations,
          threshold: this.config.alertThresholds.constraintViolationRate,
        },
      });
    }
  }

  // Utility Methods
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(sortedValues.length * percentile) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private cleanupOldRecords(): void {
    const cutoff = Date.now() - this.config.metricsRetentionPeriod;
    
    this.eventRecords = this.eventRecords.filter(
      r => r.timestamp.getTime() > cutoff
    );
    
    this.queryRecords = this.queryRecords.filter(
      r => r.timestamp.getTime() > cutoff
    );
  }

  // Lifecycle
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }

  // Reset for testing
  reset(): void {
    this.eventRecords = [];
    this.queryRecords = [];
    this.alerts = [];
    this.holonCountsByType.clear();
    this.activeHolonCount = 0;
    this.inactiveHolonCount = 0;
    this.relationshipCountsByType.clear();
    this.activeRelationshipCount = 0;
    this.constraintViolationCount = 0;
    this.constraintViolationsByType.clear();
    this.startTime = new Date();
  }
}

// Singleton instance for global access
let globalMonitoringService: MonitoringService | null = null;

export function initializeMonitoring(config?: Partial<MonitoringConfig>): MonitoringService {
  if (globalMonitoringService) {
    globalMonitoringService.shutdown();
  }
  globalMonitoringService = new MonitoringService(config);
  return globalMonitoringService;
}

export function getMonitoringService(): MonitoringService {
  if (!globalMonitoringService) {
    globalMonitoringService = new MonitoringService();
  }
  return globalMonitoringService;
}
