#!/bin/bash

set -e

# Get base URL from environment or use default
BASE_URL="${BASE_URL:-https://fanengage-pro.onrender.com}"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
  echo "❌ k6 is not installed. Install it with: brew install k6"
  exit 1
fi

# Validate BASE_URL is provided
if [ -z "$BASE_URL" ]; then
  echo "❌ BASE_URL is required. Usage: BASE_URL=https://... ./scripts/run-load-test.sh"
  exit 1
fi

echo "🚀 Starting k6 load test..."
echo "   Target: $BASE_URL"
echo "   Profile: Ramp 100→1k req/min (5m) → Sustain 1k req/min (30m) → Cool-down (5m)"
echo ""
echo "⏱️  Total runtime: ~40 minutes"
echo "📊 Acceptance criteria:"
echo "   • Error rate < 0.1%"
echo "   • p95 < 1000ms"
echo "   • p99 < 2000ms"
echo ""

# Run k6 with JSON output for parsing
k6 run \
  --env BASE_URL="$BASE_URL" \
  -o json=load-test-results.json \
  tests/load/email-capture-load-test.js

echo ""
echo "✅ Load test completed"
echo "📁 Results saved to: load-test-results.json"
echo ""

# Parse and display summary
echo "📈 Summary:"
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('load-test-results.json', 'utf-8'));

// Aggregate metrics from samples
let errorCount = 0;
let totalRequests = 0;
const durations = [];

data.samples?.forEach(sample => {
  if (sample.type === 'Point' && sample.metric === 'http_req_duration') {
    durations.push(sample.value);
  }
  if (sample.type === 'Point' && sample.metric === 'http_req_failed') {
    if (sample.value === 1) errorCount++;
  }
  if (sample.metric === 'http_reqs') {
    totalRequests = sample.value;
  }
});

const errorRate = totalRequests > 0 ? (errorCount / totalRequests * 100).toFixed(2) : 0;
durations.sort((a, b) => a - b);
const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

console.log('  Total requests: ' + totalRequests);
console.log('  Errors: ' + errorCount + ' (' + errorRate + '%)');
console.log('  p95: ' + p95.toFixed(0) + 'ms');
console.log('  p99: ' + p99.toFixed(0) + 'ms');
console.log('');

// Pass/fail
const passes = [
  errorRate < 0.1,
  p95 < 1000,
  p99 < 2000,
];

const allPass = passes.every(p => p);
console.log('🎯 Acceptance Criteria:');
console.log('  ' + (passes[0] ? '✅' : '❌') + ' Error rate < 0.1%: ' + errorRate + '%');
console.log('  ' + (passes[1] ? '✅' : '❌') + ' p95 < 1000ms: ' + p95.toFixed(0) + 'ms');
console.log('  ' + (passes[2] ? '✅' : '❌') + ' p99 < 2000ms: ' + p99.toFixed(0) + 'ms');
console.log('');

if (allPass) {
  console.log('🎉 All criteria passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some criteria not met');
  process.exit(1);
}
"
