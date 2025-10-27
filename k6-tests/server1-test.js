import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.1'],              // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.SERVER1_URL || 'http://localhost:3001';

export default function () {
  // Test 1: Health check
  let healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check has ok status': (r) => r.json('status') === 'ok',
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Get all features
  let featuresResponse = http.get(`${BASE_URL}/api/features`);
  check(featuresResponse, {
    'features status is 200': (r) => r.status === 200,
    'features has type FeatureCollection': (r) => r.json('type') === 'FeatureCollection',
    'features response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Get specific feature
  const featureId = Math.floor(Math.random() * 100);
  let featureResponse = http.get(`${BASE_URL}/api/features/${featureId}`);
  check(featureResponse, {
    'feature status is 200': (r) => r.status === 200,
    'feature has correct id': (r) => r.json('id') === featureId,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Search features
  let searchResponse = http.get(`${BASE_URL}/api/features/search?minValue=20&maxValue=80`);
  check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search returns FeatureCollection': (r) => r.json('type') === 'FeatureCollection',
  }) || errorRate.add(1);

  sleep(1);

  // Test 5: Post new feature
  const payload = JSON.stringify({
    geometry: {
      type: 'Point',
      coordinates: [Math.random() * 180 - 90, Math.random() * 180 - 90]
    },
    properties: {
      name: 'Test Feature',
      value: Math.random() * 100
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let postResponse = http.post(`${BASE_URL}/api/features`, payload, params);
  check(postResponse, {
    'post status is 201': (r) => r.status === 201,
    'post returns feature': (r) => r.json('type') === 'Feature',
  }) || errorRate.add(1);

  sleep(1);
}
