# Monitoring and Observability Module

The monitoring module provides comprehensive observability for the Semantic Operating Model (SOM), tracking metrics, health, and providing alerting capabilities.

## Features

### 1. Event Metrics Tracking
- **Ingestion Rate**: Events per second
- **Validation Failures**: Count and percentage of failed validations
- **Processing Latency**: Average, P95, and P99 latencies

### 2. Query Metrics Tracking
- **Query Latency**: Average, P95, and P99 latencies
- **Cache Hit Rate**: Percentage of queries served from cache
- **Error Rate**: Percentage of failed queries
- **Queries by Type**: Breakdown of query types

### 3. Business Metrics Tracking
- **Holon Counts**: Total, active, and inactive holons by type
- **Relationship Counts**: Total and active relationships by type
- **Constraint Violations**: Total violations and breakdown by type

### 4. System Health Monitoring
- **Component Health**: Status of event store, graph store, constraint engine, and query layer
- **System Status**: Overall health (healthy, degraded, unhealthy)
- **Uptime Tracking**: System uptime in milliseconds

### 5. Alerting
- **Validation Failures**: Critical alerts when validation failure rate exceeds threshold
- **Performance Degradation**: Warnings when latency exceeds thresholds
- **System Errors**: Alerts for component failures and query errors
- **Business Rules**: Alerts for excessive constraint violations

## Usage

### Basic Setup

```typescript
import { initializeMonitoring, getMonitoringService } from './monitoring';

// Initialize with custom configuration
const monitoring = initializeMonitoring({
  metricsRetentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
  healthCheckInterval: 60 * 1000, // 1 minute
  alertThresholds: {
    validationFailureRate: 5, // 5%
    queryErrorRate: 1, // 1%
    processingLatencyP95: 1000, // 1 second
    queryLatencyP95: 500, // 500ms
    constraintViolationRate: 100, // 100 per hour
  },
});

// Or get the global instance
const monitoring = getMonitoringService();
```

### Recording Metrics

```typescript
// Record event ingestion
monitoring.recordEventIngestion(
  processingTime: 150, // milliseconds
  success: true,
  validationError?: 'Optional error message'
);

// Record query execution
monitoring.recordQuery(
  queryType: 'getHolon',
  latency: 50, // milliseconds
  cacheHit: false,
  success: true,
  error?: 'Optional error message'
);

// Record business metrics
monitoring.recordHolonCreated('Person', true);
monitoring.recordHolonStatusChange('Person', false);
monitoring.recordRelationshipCreated('OCCUPIES');
monitoring.recordRelationshipEnded('OCCUPIES');
monitoring.recordConstraintViolation('Structural');
```

### Retrieving Metrics

```typescript
// Get event metrics
const eventMetrics = monitoring.getEventMetrics();
console.log(`Ingestion rate: ${eventMetrics.ingestionRate} events/sec`);
console.log(`Validation failure rate: ${eventMetrics.validationFailureRate}%`);
console.log(`P95 latency: ${eventMetrics.p95ProcessingLatency}ms`);

// Get query metrics
const queryMetrics = monitoring.getQueryMetrics();
console.log(`Average query latency: ${queryMetrics.averageLatency}ms`);
console.log(`Cache hit rate: ${queryMetrics.cacheHitRate}%`);
console.log(`Error rate: ${queryMetrics.errorRate}%`);

// Get business metrics
const businessMetrics = monitoring.getBusinessMetrics();
console.log(`Total holons: ${businessMetrics.totalHolons}`);
console.log(`Active relationships: ${businessMetrics.activeRelationships}`);
console.log(`Constraint violations: ${businessMetrics.constraintViolations}`);

// Get system health
const health = monitoring.getSystemHealth();
console.log(`System status: ${health.status}`);
console.log(`Uptime: ${health.uptime}ms`);
console.log(`Event store status: ${health.components.eventStore.status}`);
```

### Updating Component Health

```typescript
// Update component health status
monitoring.updateComponentHealth(
  'eventStore',
  'healthy', // or 'degraded' or 'unhealthy'
  latency: 10, // milliseconds
  message?: 'Optional status message'
);
```

### Handling Alerts

```typescript
// Register an alert handler
monitoring.registerAlertHandler((alert) => {
  console.log(`[${alert.severity}] ${alert.type}: ${alert.message}`);
  
  // Send to external monitoring system
  if (alert.severity === 'critical') {
    sendToSlack(alert);
    sendToPagerDuty(alert);
  }
});

// Get active alerts
const activeAlerts = monitoring.getActiveAlerts();
console.log(`Active alerts: ${activeAlerts.length}`);

// Resolve an alert
monitoring.resolveAlert(alertId);
```

## Integration Example

```typescript
import { EventStore } from './event-store';
import { getMonitoringService } from './monitoring';

class MonitoredEventStore extends EventStore {
  private monitoring = getMonitoringService();

  async submitEvent(event: Event): Promise<EventID> {
    const startTime = Date.now();
    
    try {
      // Update component health
      this.monitoring.updateComponentHealth('eventStore', 'healthy', 0);
      
      // Submit the event
      const result = await super.submitEvent(event);
      
      // Record successful ingestion
      const processingTime = Date.now() - startTime;
      this.monitoring.recordEventIngestion(processingTime, true);
      
      return result;
    } catch (error) {
      // Record validation failure
      const processingTime = Date.now() - startTime;
      this.monitoring.recordEventIngestion(
        processingTime,
        false,
        error.message
      );
      
      // Update component health
      this.monitoring.updateComponentHealth(
        'eventStore',
        'degraded',
        processingTime,
        error.message
      );
      
      throw error;
    }
  }
}
```

## Alert Types

- **validation_failure**: Critical alerts for high validation failure rates
- **performance_degradation**: Warnings for latency threshold violations
- **system_error**: Alerts for component failures and query errors
- **business_rule**: Alerts for excessive constraint violations

## Alert Severities

- **critical**: Requires immediate attention
- **warning**: Should be investigated soon
- **info**: Informational only

## Configuration Options

```typescript
interface MonitoringConfig {
  metricsRetentionPeriod: number; // How long to keep metrics (ms)
  healthCheckInterval: number; // How often to check health (ms)
  alertThresholds: {
    validationFailureRate: number; // Percentage
    queryErrorRate: number; // Percentage
    processingLatencyP95: number; // Milliseconds
    queryLatencyP95: number; // Milliseconds
    constraintViolationRate: number; // Per hour
  };
}
```

## Best Practices

1. **Initialize Early**: Set up monitoring at application startup
2. **Register Handlers**: Configure alert handlers before processing begins
3. **Update Health**: Regularly update component health status
4. **Clean Shutdown**: Call `monitoring.shutdown()` on application exit
5. **Tune Thresholds**: Adjust alert thresholds based on your operational needs
6. **Monitor Trends**: Track metrics over time to identify patterns
7. **Act on Alerts**: Ensure critical alerts trigger appropriate responses

## Lifecycle Management

```typescript
// Initialize
const monitoring = initializeMonitoring(config);

// Use throughout application lifecycle
// ...

// Clean shutdown
monitoring.shutdown();
```
