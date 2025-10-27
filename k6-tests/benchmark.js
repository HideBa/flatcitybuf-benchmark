import http from 'k6/http';
import { check, sleep } from 'k6';

// Simple benchmark configuration
export const options = {
  vus: 10, // 10 virtual users
  duration: '30s', // Run for 30 seconds
};

const SERVER1_URL = __ENV.SERVER1_URL || 'http://localhost:3001';
const SERVER2_URL = __ENV.SERVER2_URL || 'http://localhost:3002';

export default function () {
  // Test Server 1
  let res1 = http.get(`${SERVER1_URL}/api/features`);
  check(res1, { 'Server 1 status is 200': (r) => r.status === 200 });
  
  // Test Server 2
  let res2 = http.get(`${SERVER2_URL}/api/cityobjects`);
  check(res2, { 'Server 2 status is 200': (r) => r.status === 200 });
  
  sleep(1);
}
