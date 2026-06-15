import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://fanengage-pro.onrender.com';

export const options = {
  stages: [
    { duration: '5m', target: 1000 }, // Ramp from 100 to 1k req/min (VUs)
    { duration: '30m', target: 1000 }, // Sustain at 1k req/min for 30 min
    { duration: '5m', target: 0 }, // Cool-down over 5 min
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.001'],
  },
};

export default function () {
  group('Root Page Load', function () {
    const res = http.get(`${BASE_URL}/`);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
      'has content': (r) => r.body.length > 0,
    });
  });

  sleep(1);

  group('API Health Check', function () {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(1);

  group('Email Capture Endpoint', function () {
    const email = `load-test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
    const payload = JSON.stringify({ email });

    const res = http.post(`${BASE_URL}/api/email-capture`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'response status valid': (r) => r.status >= 200 && r.status < 500,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(1);
}
