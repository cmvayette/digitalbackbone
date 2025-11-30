import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  MonitoringService,
  initializeMonitoring,
  getMonitoringService,
  type Alert,
  type MonitoringConfig,
} from './index';

describe('MonitoringService', () => {
  let monitoring: MonitoringService;

  beforeEach(() => {
    monitoring = new MonitoringService({
      metricsRetentionPeriod: 60000, // 1 minute for testing
      healthCheckInterval: 10000, // 10 seconds for testing
      alertThresholds: {
        validationFailureRate: 10,
        queryErrorRate: 5,
        processingLatencyP95: 500,
        queryLatencyP95: 200,
        constraintViolationRate: 50,
      },
    });
  });

  afterEach(() => {
    monitoring.shutdown();
  });

  describe('Event Metrics Tracking', () => {
    it('should record successful event ingestion', () => {
      monitoring.recordEventIngestion(100, true);
      monitoring.recordEventIngestion(150, true);
      monitoring.recordEventIngestion(200, true);

      const metrics = monitoring.getEventMetrics();
      expect(metrics.totalEventsIngested).toBe(3);
      expect(metrics.validationFailures).toBe(0);
      expect(metrics.validationFailureRate).toBe(0);
      expect(metrics.averageProcessingLatency).toBeGreaterThan(0);
    });

    it('should record validation failures', () => {
      monitoring.recordEventIngestion(100, true);
      monitoring.recordEventIngestion(150, false, 'Invalid constraint');
      monitoring.recordEventIngestion(200, false, 'Missing field');

      const metrics = monitoring.getEventMetrics();
      expect(metrics.totalEventsIngested).toBe(3);
      expect(metrics.validationFailures).toBe(2);
      expect(metrics.validationFailureRate).toBeCloseTo(66.67, 1);
    });

    it('should calculate processing latency percentiles', () => {
      const latencies = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
      latencies.forEach(latency => {
        monitoring.recordEventIngestion(latency, true);
      });

      const metrics = monitoring.getEventMetrics();
      expect(metrics.p95ProcessingLatency).toBeGreaterThanOrEqual(450);
      expect(metrics.p99ProcessingLatency).toBeGreaterThanOrEqual(450);
      expect(metrics.averageProcessingLatency).toBe(275);
    });

    it('should calculate ingestion rate per second', () => {
      // Record 10 events
      for (let i = 0; i < 10; i++) {
        monitoring.recordEventIngestion(100, true);
      }

      const metrics = monitoring.getEventMetrics();
      expect(metrics.ingestionRate).toBeGreaterThan(0);
    });

    it('should raise alert when processing latency exceeds threshold', () => {
      const alerts: Alert[] = [];
      monitoring.registerAlertHandler(alert => alerts.push(alert));

      monitoring.recordEventIngestion(600, true); // Exceeds 500ms threshold

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('performance_degradation');
      expect(alerts[0].severity).toBe('warning');
      expect(alerts[0].message).toContain('processing latency exceeded threshold');
    });
  });

  describe('Query Metrics Tracking', () => {
    it('should record successful queries', () => {
      monitoring.recordQuery('getHolon', 50, false, true);
      monitoring.recordQuery('getRelationships', 75, true, true);
      monitoring.recordQuery('temporalQuery', 100, false, true);

      const metrics = monitoring.getQueryMetrics();
      expect(metrics.totalQueries).toBe(3);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.cacheHitRate).toBeCloseTo(33.33, 1);
    });

    it('should track query errors', () => {
      monitoring.recordQuery('getHolon', 50, false, true);
      monitoring.recordQuery('getRelationships', 75, false, false, 'Not found');
      monitoring.recordQuery('temporalQuery', 100, false, false, 'Invalid timestamp');

      const metrics = monitoring.getQueryMetrics();
      expect(metrics.totalQueries).toBe(3);
      expect(metrics.errorRate).toBeCloseTo(66.67, 1);
    });

    it('should calculate query latency percentiles', () => {
      const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      latencies.forEach(latency => {
        monitoring.recordQuery('test', latency, false, true);
      });

      const metrics = monitoring.getQueryMetrics();
      expect(metrics.p95Latency).toBeGreaterThanOrEqual(90);
      expect(metrics.averageLatency).toBe(55);
    });

    it('should track queries by type', () => {
      monitoring.recordQuery('getHolon', 50, false, true);
      monitoring.recordQuery('getHolon', 60, false, true);
      monitoring.recordQuery('getRelationships', 70, false, true);

      const metrics = monitoring.getQueryMetrics();
      expect(metrics.queriesByType['getHolon']).toBe(2);
      expect(metrics.queriesByType['getRelationships']).toBe(1);
    });

    it('should raise alert when query latency exceeds threshold', () => {
      const alerts: Alert[] = [];
      monitoring.registerAlertHandler(alert => alerts.push(alert));

      monitoring.recordQuery('slowQuery', 300, false, true); // Exceeds 200ms threshold

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('performance_degradation');
      expect(alerts[0].message).toContain('Query latency exceeded threshold');
    });
  });

  describe('Business Metrics Tracking', () => {
    it('should track holon creation by type', () => {
      monitoring.recordHolonCreated('Person', true);
      monitoring.recordHolonCreated('Person', true);
      monitoring.recordHolonCreated('Organization', true);
      monitoring.recordHolonCreated('Position', false);

      const metrics = monitoring.getBusinessMetrics();
      expect(metrics.holonCounts['Person']).toBe(2);
      expect(metrics.holonCounts['Organization']).toBe(1);
      expect(metrics.holonCounts['Position']).toBe(1);
      expect(metrics.totalHolons).toBe(4);
      expect(metrics.activeHolons).toBe(3);
      expect(metrics.inactiveHolons).toBe(1);
    });

    it('should track holon status changes', () => {
      monitoring.recordHolonCreated('Person', true);
      monitoring.recordHolonCreated('Person', true);

      let metrics = monitoring.getBusinessMetrics();
      expect(metrics.activeHolons).toBe(2);
      expect(metrics.inactiveHolons).toBe(0);

      monitoring.recordHolonStatusChange('Person', false);

      metrics = monitoring.getBusinessMetrics();
      expect(metrics.activeHolons).toBe(1);
      expect(metrics.inactiveHolons).toBe(1);
    });

    it('should track relationship creation by type', () => {
      monitoring.recordRelationshipCreated('OCCUPIES');
      monitoring.recordRelationshipCreated('OCCUPIES');
      monitoring.recordRelationshipCreated('BELONGS_TO');

      const metrics = monitoring.getBusinessMetrics();
      expect(metrics.relationshipCounts['OCCUPIES']).toBe(2);
      expect(metrics.relationshipCounts['BELONGS_TO']).toBe(1);
      expect(metrics.totalRelationships).toBe(3);
      expect(metrics.activeRelationships).toBe(3);
    });

    it('should track relationship endings', () => {
      monitoring.recordRelationshipCreated('OCCUPIES');
      monitoring.recordRelationshipCreated('OCCUPIES');

      let metrics = monitoring.getBusinessMetrics();
      expect(metrics.activeRelationships).toBe(2);

      monitoring.recordRelationshipEnded('OCCUPIES');

      metrics = monitoring.getBusinessMetrics();
      expect(metrics.activeRelationships).toBe(1);
    });

    it('should track constraint violations by type', () => {
      monitoring.recordConstraintViolation('Structural');
      monitoring.recordConstraintViolation('Structural');
      monitoring.recordConstraintViolation('Policy');

      const metrics = monitoring.getBusinessMetrics();
      expect(metrics.constraintViolations).toBe(3);
      expect(metrics.constraintViolationsByType['Structural']).toBe(2);
      expect(metrics.constraintViolationsByType['Policy']).toBe(1);
    });
  });

  describe('System Health Monitoring', () => {
    it('should report healthy status when all components are healthy', () => {
      monitoring.updateComponentHealth('eventStore', 'healthy', 10);
      monitoring.updateComponentHealth('graphStore', 'healthy', 15);
      monitoring.updateComponentHealth('constraintEngine', 'healthy', 20);
      monitoring.updateComponentHealth('queryLayer', 'healthy', 25);

      const health = monitoring.getSystemHealth();
      expect(health.status).toBe('healthy');
      expect(health.components.eventStore.status).toBe('healthy');
    });

    it('should report degraded status when any component is degraded', () => {
      monitoring.updateComponentHealth('eventStore', 'healthy', 10);
      monitoring.updateComponentHealth('graphStore', 'degraded', 50, 'High latency');
      monitoring.updateComponentHealth('constraintEngine', 'healthy', 20);
      monitoring.updateComponentHealth('queryLayer', 'healthy', 25);

      const health = monitoring.getSystemHealth();
      expect(health.status).toBe('degraded');
      expect(health.components.graphStore.status).toBe('degraded');
      expect(health.components.graphStore.message).toBe('High latency');
    });

    it('should report unhealthy status when any component is unhealthy', () => {
      monitoring.updateComponentHealth('eventStore', 'healthy', 10);
      monitoring.updateComponentHealth('graphStore', 'unhealthy', 1000, 'Connection failed');
      monitoring.updateComponentHealth('constraintEngine', 'healthy', 20);
      monitoring.updateComponentHealth('queryLayer', 'healthy', 25);

      const health = monitoring.getSystemHealth();
      expect(health.status).toBe('unhealthy');
      expect(health.components.graphStore.status).toBe('unhealthy');
    });

    it('should track component error counts', () => {
      monitoring.updateComponentHealth('eventStore', 'unhealthy', 100, 'Error 1');
      monitoring.updateComponentHealth('eventStore', 'unhealthy', 100, 'Error 2');
      monitoring.updateComponentHealth('eventStore', 'healthy', 10);

      const health = monitoring.getSystemHealth();
      expect(health.components.eventStore.errorCount).toBe(0); // Reset on healthy
    });

    it('should track system uptime', async () => {
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait a bit for uptime
      const health = monitoring.getSystemHealth();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Alerting', () => {
    it('should register and call alert handlers', () => {
      const alerts: Alert[] = [];
      monitoring.registerAlertHandler(alert => alerts.push(alert));

      monitoring.recordEventIngestion(600, true); // Triggers latency alert

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toHaveProperty('id');
      expect(alerts[0]).toHaveProperty('timestamp');
      expect(alerts[0].resolved).toBe(false);
    });

    it('should raise alert when validation failure rate exceeds threshold', () => {
      const alerts: Alert[] = [];
      monitoring.registerAlertHandler(alert => alerts.push(alert));

      // Record 10 events with 2 failures (20% failure rate, threshold is 10%)
      for (let i = 0; i < 8; i++) {
        monitoring.recordEventIngestion(100, true);
      }
      for (let i = 0; i < 2; i++) {
        monitoring.recordEventIngestion(100, false, 'Validation error');
      }

      const validationAlerts = alerts.filter(a => a.type === 'validation_failure');
      expect(validationAlerts.length).toBeGreaterThan(0);
      expect(validationAlerts[0].severity).toBe('critical');
    });

    it('should raise alert when query error rate exceeds threshold', () => {
      const alerts: Alert[] = [];
      monitoring.registerAlertHandler(alert => alerts.push(alert));

      // Record 10 queries with 1 error (10% error rate, threshold is 5%)
      for (let i = 0; i < 9; i++) {
        monitoring.recordQuery('test', 50, false, true);
      }
      monitoring.recordQuery('test', 50, false, false, 'Error');

      const errorAlerts = alerts.filter(a => a.type === 'system_error' && a.message.includes('Query error'));
      expect(errorAlerts.length).toBeGreaterThan(0);
    });

    it('should resolve alerts', () => {
      const alerts: Alert[] = [];
      monitoring.registerAlertHandler(alert => alerts.push(alert));

      monitoring.recordEventIngestion(600, true);

      const alertId = alerts[0].id;
      monitoring.resolveAlert(alertId);

      const activeAlerts = monitoring.getActiveAlerts();
      expect(activeAlerts.length).toBe(0);

      const allAlerts = monitoring.getAllAlerts();
      expect(allAlerts[0].resolved).toBe(true);
    });

    it('should track multiple alert handlers', () => {
      const alerts1: Alert[] = [];
      const alerts2: Alert[] = [];

      monitoring.registerAlertHandler(alert => alerts1.push(alert));
      monitoring.registerAlertHandler(alert => alerts2.push(alert));

      monitoring.recordEventIngestion(600, true);

      expect(alerts1.length).toBe(1);
      expect(alerts2.length).toBe(1);
    });
  });

  describe('Metrics Cleanup', () => {
    it('should clean up old event records', async () => {
      const shortRetentionMonitoring = new MonitoringService({
        metricsRetentionPeriod: 100, // 100ms
      });

      shortRetentionMonitoring.recordEventIngestion(50, true);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      shortRetentionMonitoring.recordEventIngestion(50, true);

      const metrics = shortRetentionMonitoring.getEventMetrics();
      expect(metrics.totalEventsIngested).toBe(1); // Old record cleaned up

      shortRetentionMonitoring.shutdown();
    });

    it('should clean up old query records', async () => {
      const shortRetentionMonitoring = new MonitoringService({
        metricsRetentionPeriod: 100, // 100ms
      });

      shortRetentionMonitoring.recordQuery('test', 50, false, true);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      shortRetentionMonitoring.recordQuery('test', 50, false, true);

      const metrics = shortRetentionMonitoring.getQueryMetrics();
      expect(metrics.totalQueries).toBe(1); // Old record cleaned up

      shortRetentionMonitoring.shutdown();
    });
  });

  describe('Global Monitoring Service', () => {
    it('should initialize global monitoring service', () => {
      const service = initializeMonitoring();
      expect(service).toBeInstanceOf(MonitoringService);
      service.shutdown();
    });

    it('should get global monitoring service', () => {
      const service1 = getMonitoringService();
      const service2 = getMonitoringService();
      expect(service1).toBe(service2);
      service1.shutdown();
    });

    it('should replace global service on re-initialization', () => {
      const service1 = initializeMonitoring();
      const service2 = initializeMonitoring();
      expect(service1).not.toBe(service2);
      service2.shutdown();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics and state', () => {
      monitoring.recordEventIngestion(100, true);
      monitoring.recordQuery('test', 50, false, true);
      monitoring.recordHolonCreated('Person', true);
      monitoring.recordRelationshipCreated('OCCUPIES');
      monitoring.recordConstraintViolation('Structural');

      monitoring.reset();

      const eventMetrics = monitoring.getEventMetrics();
      const queryMetrics = monitoring.getQueryMetrics();
      const businessMetrics = monitoring.getBusinessMetrics();

      expect(eventMetrics.totalEventsIngested).toBe(0);
      expect(queryMetrics.totalQueries).toBe(0);
      expect(businessMetrics.totalHolons).toBe(0);
      expect(businessMetrics.totalRelationships).toBe(0);
      expect(businessMetrics.constraintViolations).toBe(0);
      expect(monitoring.getAllAlerts().length).toBe(0);
    });
  });
});
