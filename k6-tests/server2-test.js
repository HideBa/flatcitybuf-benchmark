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

const BASE_URL = __ENV.SERVER2_URL || 'http://localhost:3002';

export default function () {
  // Test 1: Health check
  let healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check has ok status': (r) => r.json('status') === 'ok',
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Get all city objects
  let cityObjectsResponse = http.get(`${BASE_URL}/api/cityobjects`);
  check(cityObjectsResponse, {
    'cityobjects status is 200': (r) => r.status === 200,
    'cityobjects has type CityJSON': (r) => r.json('type') === 'CityJSON',
    'cityobjects response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Get specific city object
  const objectId = `building-${Math.floor(Math.random() * 100)}`;
  let objectResponse = http.get(`${BASE_URL}/api/cityobjects/${objectId}`);
  check(objectResponse, {
    'object status is 200': (r) => r.status === 200,
    'object has correct id': (r) => r.json('id') === objectId,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Search city objects
  let searchResponse = http.get(`${BASE_URL}/api/cityobjects/search?minHeight=20&maxHeight=40`);
  check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search returns CityJSON': (r) => r.json('type') === 'CityJSON',
  }) || errorRate.add(1);

  sleep(1);

  // Test 5: Post new city object
  const payload = JSON.stringify({
    type: 'Building',
    attributes: {
      name: 'Test Building',
      height: Math.random() * 50 + 10,
      yearOfConstruction: 2023
    },
    geometry: []
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let postResponse = http.post(`${BASE_URL}/api/cityobjects`, payload, params);
  check(postResponse, {
    'post status is 201': (r) => r.status === 201,
    'post returns object with id': (r) => r.json('id') !== undefined,
  }) || errorRate.add(1);

  sleep(1);
}
