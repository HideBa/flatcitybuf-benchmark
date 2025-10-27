import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Configuration for different scenarios
export const options = {
  scenarios: {
    // Scenario 1: Constant load - small dataset
    small_dataset_constant: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'testSmallDataset',
      tags: { scenario: 'small_constant' }
    },
    
    // Scenario 2: Ramping load - medium dataset
    medium_dataset_ramping: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 20 },
        { duration: '20s', target: 20 },
        { duration: '10s', target: 0 }
      ],
      exec: 'testMediumDataset',
      tags: { scenario: 'medium_ramping' },
      startTime: '35s'  // Start after small_dataset_constant
    },
    
    // Scenario 3: Spike test - large dataset
    large_dataset_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 50 },
        { duration: '10s', target: 50 },
        { duration: '5s', target: 0 }
      ],
      exec: 'testLargeDataset',
      tags: { scenario: 'large_spike' },
      startTime: '80s'  // Start after medium_dataset_ramping
    },
    
    // Scenario 4: CPU intensive operations
    compute_intensive: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      exec: 'testComputeIntensive',
      tags: { scenario: 'compute_intensive' },
      startTime: '105s'  // Start after large_dataset_spike
    },
    
    // Scenario 5: POST requests
    post_operations: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 5,
      maxVUs: 20,
      exec: 'testPostCity',
      tags: { scenario: 'post_operations' },
      startTime: '140s'  // Start after compute_intensive
    }
  },
  
  thresholds: {
    // Global thresholds
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],  // Error rate should be less than 1%
    errors: ['rate<0.1'],  // Custom error rate
    
    // Per-scenario thresholds
    'http_req_duration{scenario:small_constant}': ['p(95)<200'],
    'http_req_duration{scenario:medium_ramping}': ['p(95)<400'],
    'http_req_duration{scenario:large_spike}': ['p(95)<800'],
    'http_req_duration{scenario:compute_intensive}': ['p(95)<1000'],
    'http_req_duration{scenario:post_operations}': ['p(95)<300']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Default function for quick tests with --vus and --duration flags
export default function() {
  testSmallDataset();
}

// Test function for small dataset
export function testSmallDataset() {
  const res = http.get(`${BASE_URL}/api/cities/small`);
  
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      const body = JSON.parse(r.body);
      return body.data && body.data.length === 10;
    },
    'response time < 200ms': (r) => r.timings.duration < 200
  });
  
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  
  sleep(0.5);
}

// Test function for medium dataset
export function testMediumDataset() {
  const res = http.get(`${BASE_URL}/api/cities/medium`);
  
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      const body = JSON.parse(r.body);
      return body.data && body.data.length === 100;
    },
    'response time < 400ms': (r) => r.timings.duration < 400
  });
  
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  
  sleep(1);
}

// Test function for large dataset
export function testLargeDataset() {
  const res = http.get(`${BASE_URL}/api/cities/large`);
  
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      const body = JSON.parse(r.body);
      return body.data && body.data.length === 1000;
    },
    'response time < 800ms': (r) => r.timings.duration < 800
  });
  
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  
  sleep(0.3);
}

// Test function for compute-intensive operations
export function testComputeIntensive() {
  const limits = [100, 500, 1000];
  const limit = limits[Math.floor(Math.random() * limits.length)];
  
  const res = http.get(`${BASE_URL}/api/compute/prime/${limit}`);
  
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has primes': (r) => {
      const body = JSON.parse(r.body);
      return body.primes && body.primes.length > 0;
    }
  });
  
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  
  sleep(1);
}

// Test function for POST operations
export function testPostCity() {
  const payload = JSON.stringify({
    name: `City ${Math.floor(Math.random() * 1000)}`,
    latitude: 40.7128 + Math.random() * 10,
    longitude: -74.0060 + Math.random() * 10,
    population: Math.floor(Math.random() * 1000000),
    area: Math.floor(Math.random() * 500)
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const res = http.post(`${BASE_URL}/api/cities`, payload, params);
  
  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'response has city': (r) => {
      const body = JSON.parse(r.body);
      return body.city && body.city.id;
    }
  });
  
  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  
  sleep(0.5);
}

// Setup function - runs once at the beginning
export function setup() {
  console.log('Starting benchmark tests...');
  console.log(`Base URL: ${BASE_URL}`);
  
  // Check if server is healthy
  const healthRes = http.get(`${BASE_URL}/health`);
  if (healthRes.status !== 200) {
    throw new Error('Server health check failed');
  }
  
  return { startTime: new Date().toISOString() };
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log(`Benchmark tests completed. Started at: ${data.startTime}`);
}
