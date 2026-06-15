# Uptime Monitoring Setup for Blake Richardson Landing Page

## Overview

Configure monitoring and alerting for the Blake Richardson pre-save landing page staging and production environments.

- **Staging**: https://fanengage-pro.onrender.com/api/health
- **Production**: https://presave.blakerichardson.com/api/health (post-deployment)

## Monitoring Providers

### Option 1: Better Uptime (Recommended)

**Why**: Best balance of features, ease of setup, and granular alerting for this use case.

#### Setup Steps

1. **Create account** at https://betterstack.com/uptime
2. **Add monitor**:
   - URL: `https://fanengage-pro.onrender.com/api/health`
   - Check interval: 5 minutes
   - Timeout: 15 seconds
   - HTTP method: GET
   - Expected status: 200

3. **Configure alerts**:
   - Alert on: Down, Up (recovery)
   - Threshold: 2 failed checks (10 min window)
   - Escalation: Immediate on failure

4. **Add alert channels**:
   - **Slack**: Connect workspace, select channel `#blakerichardson-presave`
   - **Email**: ops team email (staging alerts)
   - **SMS**: On-call engineer (production only)

5. **Performance monitoring**:
   - Enable response time tracking
   - Alert threshold: Response time > 2s
   - Enable anomaly detection for traffic spikes

6. **Custom headers** (if needed):
   - Add `User-Agent: BetterUptime-Monitor`
   - Add `Authorization: Bearer [monitoring-token]` if endpoint requires auth

#### Dashboard & Status Page

- Public status page: https://betterstack.com/uptime (custom domain available)
- Enable component status for dependencies:
  - DNS resolution
  - SSL certificate validity
  - Render.com platform health

### Option 2: Checkly

**Why**: Enterprise monitoring with API testing and screenshot monitoring.

#### Setup Steps

1. **Create account** at https://app.checklyhq.com
2. **Create uptime check**:
   - URL: `https://fanengage-pro.onrender.com/api/health`
   - Frequency: Every 5 minutes
   - Regions: US, EU (distributed health checks)
   - Expected status: 200

3. **Add performance assertions**:
   - Response time < 1000ms
   - Body contains: `"status":"ok"`

4. **Alert policies**:
   - Slack webhook to `#blakerichardson-presave`
   - Email to ops team
   - PagerDuty integration (for critical incidents)

5. **Dashboard**:
   - Custom Checkly dashboard
   - Embed status widget on public site

### Option 3: Render Dashboard (Built-in)

**Why**: Simple, free, but limited features.

**Available on**:
- Render health checks (basic)
- Response time monitoring
- Uptime metrics

**Limitations**:
- No custom alerting to external channels
- Limited to Render.com infrastructure status
- No traffic anomaly detection

**Use for**: Development/staging only, not recommended for production.

## Monitoring Checklist

For each monitor, configure:

- [ ] **Endpoint Configuration**
  - [ ] URL: `/api/health` endpoint
  - [ ] HTTP method: GET
  - [ ] Expected status: 200
  - [ ] Timeout: 15 seconds
  - [ ] Interval: 5 minutes

- [ ] **Performance Thresholds**
  - [ ] Response time alert: > 2s
  - [ ] p95 latency: < 1000ms
  - [ ] p99 latency: < 2000ms
  - [ ] Error rate: > 0.1%

- [ ] **Alert Channels**
  - [ ] Slack: `#blakerichardson-presave`
  - [ ] Email: ops@company.com
  - [ ] SMS: On-call engineer (prod only)

- [ ] **Escalation Policy**
  - [ ] Immediate alert on first failure
  - [ ] Escalate after 2 consecutive failures
  - [ ] Auto-resolve on recovery (2 successful checks)

- [ ] **Traffic Anomaly Detection**
  - [ ] Enable anomaly detection
  - [ ] Flag traffic spikes > 150% of baseline
  - [ ] Special alerting during R-3 to R (launch window)

- [ ] **Status Page**
  - [ ] Create public status page
  - [ ] Link from website
  - [ ] Subscribe option for subscribers

## Integration with Load Testing

Coordinate uptime monitoring with load test results:

1. **Pre-load test**: Establish baseline metrics
   - Normal response time
   - Error rate baseline
   - Typical traffic patterns

2. **During load test**: Monitor for anomalies
   - Response time degradation
   - Error rate increase
   - Resource exhaustion

3. **Post-load test**: Validate recovery
   - Confirm system returns to normal
   - Document peak load metrics
   - Update monitoring thresholds if needed

## Load Test & Monitoring Timeline

```
Staging Load Test (40 minutes)
├── 5 min: Ramp 100→1k req/min
├── 30 min: Sustain 1k req/min (with monitoring active)
└── 5 min: Cool-down

Post-Test:
├── Check monitoring dashboards for anomalies
├── Review alert logs
└── Generate report with load test + monitoring results
```

## Acceptance Criteria

- [x] Load test script created and runnable
- [ ] Load test executes successfully (error rate < 0.1%, p95 < 1s)
- [ ] Uptime monitor configured and active
- [ ] Alert channels tested and working
- [ ] Status page public and linked
- [ ] Results posted to [JGF-1828](parent-issue) comment
- [ ] Monitoring remains active for ongoing ops

## Commands

### Run Load Test
```bash
BASE_URL=https://fanengage-pro.onrender.com ./scripts/run-load-test.sh
```

### Run Quick Validation
```bash
BASE_URL=https://fanengage-pro.onrender.com k6 run tests/load/quick-validation.js
```

## Next Steps (Post-Deployment)

1. **Create production monitor** for presave.blakerichardson.com (once live)
2. **Configure status page** for public visibility
3. **Set up incident response** playbook
4. **Configure PagerDuty** integration for critical alerts
5. **Monthly review** of monitoring effectiveness

---

**Recommended setup**: Better Uptime for staging + production, with Slack/email alerts.  
**Estimated setup time**: 15 minutes for full configuration.
