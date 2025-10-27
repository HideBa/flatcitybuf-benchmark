import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const server1ErrorRate = new Rate('server1_errors');
const server2ErrorRate = new Rate('server2_errors');
const server1ResponseTime = new Trend('server1_response_time');
const server2ResponseTime = new Trend('server2_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 30 },  // Ramp up to 30 users
    { duration: '1m', target: 30 },   // Stay at 30 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    'server1_errors': ['rate<0.1'],
    'server2_errors': ['rate<0.1'],
  },
};

const SERVER1_URL = __ENV.SERVER1_URL || 'http://localhost:3001';
const SERVER2_URL = __ENV.SERVER2_URL || 'http://localhost:3002';

export default function () {
  // Test Server 1
  group('Server 1 - FlatGeobuf API', function () {
    // Health check
    let response = http.get(`${SERVER1_URL}/health`);
    server1ResponseTime.add(response.timings.duration);
    check(response, {
      'server1 health status is 200': (r) => r.status === 200,
    }) || server1ErrorRate.add(1);

    sleep(0.5);

    // Get all features
    response = http.get(`${SERVER1_URL}/api/features`);
    server1ResponseTime.add(response.timings.duration);
    check(response, {
      'server1 features status is 200': (r) => r.status === 200,
      'server1 features response < 500ms': (r) => r.timings.duration < 500,
    }) || server1ErrorRate.add(1);

    sleep(0.5);

    // Get specific feature
    const featureId = Math.floor(Math.random() * 100);
    response = http.get(`${SERVER1_URL}/api/features/${featureId}`);
    server1ResponseTime.add(response.timings.duration);
    check(response, {
      'server1 feature status is 200': (r) => r.status === 200,
    }) || server1ErrorRate.add(1);

    sleep(0.5);
  });

  // Test Server 2
  group('Server 2 - CityJSON API', function () {
    // Health check
    let response = http.get(`${SERVER2_URL}/health`);
    server2ResponseTime.add(response.timings.duration);
    check(response, {
      'server2 health status is 200': (r) => r.status === 200,
    }) || server2ErrorRate.add(1);

    sleep(0.5);

    // Get all city objects
    response = http.get(`${SERVER2_URL}/api/cityobjects`);
    server2ResponseTime.add(response.timings.duration);
    check(response, {
      'server2 cityobjects status is 200': (r) => r.status === 200,
      'server2 cityobjects response < 500ms': (r) => r.timings.duration < 500,
    }) || server2ErrorRate.add(1);

    sleep(0.5);

    // Get specific city object
    const objectId = `building-${Math.floor(Math.random() * 100)}`;
    response = http.get(`${SERVER2_URL}/api/cityobjects/${objectId}`);
    server2ResponseTime.add(response.timings.duration);
    check(response, {
      'server2 cityobject status is 200': (r) => r.status === 200,
    }) || server2ErrorRate.add(1);

    sleep(0.5);
  });

  sleep(1);
}

export function handleSummary(data) {
  console.log('\n=== Benchmark Comparison Summary ===\n');
  
  // Extract metrics
  const server1Errors = data.metrics.server1_errors;
  const server2Errors = data.metrics.server2_errors;
  const server1RT = data.metrics.server1_response_time;
  const server2RT = data.metrics.server2_response_time;
  
  console.log('Server 1 (FlatGeobuf):');
  console.log(`  Error Rate: ${(server1Errors.values.rate * 100).toFixed(2)}%`);
  console.log(`  Avg Response Time: ${server1RT.values.avg.toFixed(2)}ms`);
  console.log(`  P95 Response Time: ${server1RT.values['p(95)'].toFixed(2)}ms`);
  
  console.log('\nServer 2 (CityJSON):');
  console.log(`  Error Rate: ${(server2Errors.values.rate * 100).toFixed(2)}%`);
  console.log(`  Avg Response Time: ${server2RT.values.avg.toFixed(2)}ms`);
  console.log(`  P95 Response Time: ${server2RT.values['p(95)'].toFixed(2)}ms`);
  
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
