import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://fanengage-pro.onrender.com';

export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp to 10 VUs
    { duration: '2m', target: 10 }, // Sustain for 2 min
    { duration: '1m', target: 0 }, // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  group('Root Page Load', function () {
    const res = http.get(`${BASE_URL}/`);
    check(res, {
      'status is 200': (r) => r.status === 200,
    });
  });

  sleep(0.5);

  group('API Health Check', function () {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'response received': (r) => r.status >= 200 && r.status < 500,
    });
  });

  sleep(0.5);

  group('Email Capture Endpoint', function () {
    const email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
    const payload = JSON.stringify({ email });

    const res = http.post(`${BASE_URL}/api/email-capture`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'response received': (r) => r.status >= 200 && r.status < 500,
    });
  });

  sleep(0.5);
}
