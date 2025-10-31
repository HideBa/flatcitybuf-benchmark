import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const bboxQueryTime = new Trend('bbox_query_time');
const idQueryTime = new Trend('id_query_time');
const filterQueryTime = new Trend('filter_query_time');

// Configuration for different scenarios
export const options = {
  scenarios: {
    // ------------------------------------------------------------
    // Test group1: Constant bbox query scenarios to compare system's throughput capacity
    // Scenario 1: Small bbox query (10 features)
    constant_bbox_query_10: {
      executor: 'constant-vus',
      vus: 10, // 10 Virtual Users
      duration: '30s',
      exec: 'testBboxQuery10',
      tags: { scenario: 'constant_10vus_bbox_10features_30s', query_type: 'bbox' },
      startTime: '0s',
    },

    // Scenario 2: Medium bbox query (100 features)
    constant_bbox_query_100: {
      executor: 'constant-vus',
      vus: 10, // 10 Virtual Users
      duration: '30s',
      exec: 'testBboxQuery100',
      tags: { scenario: 'constant_10vus_bbox_100features_30s', query_type: 'bbox' },
      startTime: '35s', // Start after first test + 5s buffer
    },

    // Scenario 3: Large bbox query (1000 features)
    constant_bbox_query_1000: {
      executor: 'constant-vus',
      vus: 10, // 10 Virtual Users
      duration: '30s',
      exec: 'testBboxQuery1000',
      tags: { scenario: 'constant_10vus_bbox_1000features_30s', query_type: 'bbox' },
      startTime: '70s', // Start after second test + 5s buffer
    },

    // Scenario 4: Very large bbox query (10000 features)
    constant_bbox_query_10000: {
      executor: 'constant-vus',
      vus: 10, // 10 Virtual Users
      duration: '30s',
      exec: 'testBboxQuery10000',
      tags: { scenario: 'constant_10vus_bbox_10000features_30s', query_type: 'bbox' },
      startTime: '105s', // Start after third test + 5s buffer
    },
    // ------------------------------------------------------------

    // ------------------------------------------------------------
    // Test group2: Ramping bbox query scenarios to test system's stress handling capacity
    // Scenario 5: Ramping bbox query (10 features)
    ramping_bbox_query_10: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 15 },
        { duration: '5s', target: 30 },
        { duration: '5s', target: 50 },
        { duration: '5s', target: 70 },
        { duration: '5s', target: 90 },
        { duration: '5s', target: 0 },
      ],
      exec: 'testBboxQuery10',
      tags: { scenario: 'ramping_10_50_70_90vus_bbox_10features_30s', query_type: 'bbox' },
      startTime: '140s', // Start after all constant tests (105s + 30s + 5s)
    },

    // Scenario 6: Ramping bbox query (100 features)
    ramping_bbox_query_100: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 15 },
        { duration: '5s', target: 30 },
        { duration: '5s', target: 50 },
        { duration: '5s', target: 70 },
        { duration: '5s', target: 90 },
        { duration: '5s', target: 0 },
      ],
      exec: 'testBboxQuery100',
      tags: { scenario: 'ramping_10_50_70_90vus_bbox_100features_30s', query_type: 'bbox' },
      startTime: '175s', // Start after ramping_bbox_query_10 (140s + 30s + 5s)
    },

    // Scenario 7: Ramping bbox query (1000 features)
    ramping_bbox_query_1000: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 15 },
        { duration: '5s', target: 30 },
        { duration: '5s', target: 50 },
        { duration: '5s', target: 70 },
        { duration: '5s', target: 90 },
        { duration: '5s', target: 0 },
      ],
      exec: 'testBboxQuery1000',
      tags: { scenario: 'ramping_10_30_50_70_90vus_bbox_1000features_30s', query_type: 'bbox' },
      startTime: '210s', // Start after ramping_bbox_query_100 (175s + 30s + 5s)
    },

    // Scenario 8: Ramping bbox query (10000 features)
    ramping_bbox_query_10000: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 15 },
        { duration: '5s', target: 30 },
        { duration: '5s', target: 50 },
        { duration: '5s', target: 70 },
        { duration: '5s', target: 90 },
        { duration: '5s', target: 0 },
      ],
      exec: 'testBboxQuery10000',
      tags: { scenario: 'ramping_10_50_70_90vus_bbox_10000features_30s', query_type: 'bbox' },
      startTime: '245s', // Start after ramping_bbox_query_1000 (210s + 30s + 5s)
    },
    // ------------------------------------------------------------

    // ------------------------------------------------------------
    // Test group3: Constant feature ID lookup scenarios
    // Scenario 9: Feature ID lookup
    constant_id_lookup: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'testIdLookup',
      tags: { scenario: 'constant_10vus_id_lookup_30s', query_type: 'id' },
      startTime: '280s', // Start after ramping_bbox_query_10000 (245s + 30s + 5s)
    },

    // ------------------------------------------------------------
    // Test group4: Ramping feature ID lookup scenarios
    // Scenario 10: Ramping feature ID lookup
    ramping_id_lookup: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 15 },
        { duration: '5s', target: 30 },
        { duration: '5s', target: 50 },
        { duration: '5s', target: 70 },
        { duration: '5s', target: 90 },
        { duration: '5s', target: 0 },
      ],
      exec: 'testIdLookup',
      tags: { scenario: 'ramping_10_20_30_40_50_60vus_id_lookup_30s', query_type: 'id' },
      startTime: '315s', // Start after ramping_bbox_query_10000 (280s + 30s + 5s)
    },

    // ------------------------------------------------------------

    // ------------------------------------------------------------
    // Test group5: Constant attribute filter scenarios
    // Scenario 11: Attribute filter (small)
    constant_attribute_filter_small: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'testAttributeFilterSmall',
      tags: { scenario: 'constant_10vus_attribute_filter_small_30s', query_type: 'filter' },
      startTime: '350s', // Start after ramping_id_lookup (315s + 30s + 5s)
    },

    // Scenario 12: Combined bbox + filter
    constant_combined_query: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'testCombinedQuery',
      tags: { scenario: 'constant_10vus_combined_query_30s', query_type: 'combined' },
      startTime: '385s', // Start after constant_attribute_filter_small (350s + 30s + 5s)
    },

    // Scenario 13: Format comparison
    constant_format_comparison: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'testFormatComparison',
      tags: { scenario: 'constant_10vus_format_comparison_30s', query_type: 'format' },
      startTime: '415s', // Start after constant_combined_query (385s + 30s)
    },

    // Test group6: Ramping attribute filter scenarios
    // Scenario 14: Ramping attribute filter (small)
    ramping_attribute_filter_small: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 15 },
        { duration: '5s', target: 30 },
        { duration: '5s', target: 50 },
        { duration: '5s', target: 70 },
        { duration: '5s', target: 90 },
        { duration: '5s', target: 0 },
      ],
      exec: 'testAttributeFilterSmall',
      tags: { scenario: 'ramping_10_20_30_40_50_60vus_attribute_filter_small_30s', query_type: 'filter' },
      startTime: '445s', // Start after constant_format_comparison (415s + 30s + 5s)
    },

    // Scenario 15: Ramping combined bbox + filter
    ramping_combined_query: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 15 },
        { duration: '5s', target: 30 },
        { duration: '5s', target: 50 },
        { duration: '5s', target: 70 },
        { duration: '5s', target: 90 },
        { duration: '5s', target: 0 },
      ],
      exec: 'testCombinedQuery',
      tags: { scenario: 'ramping_10_20_30_40_50_60vus_combined_query_30s', query_type: 'combined' },
      startTime: '475s', // Start after ramping_attribute_filter_small (445s + 30s + 5s)
    },

    // Scenario 16: Ramping format comparison
    ramping_format_comparison: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 15 },
        { duration: '5s', target: 30 },
        { duration: '5s', target: 50 },
        { duration: '5s', target: 70 },
        { duration: '5s', target: 90 },
        { duration: '5s', target: 0 },
      ],
      exec: 'testFormatComparison',
      tags: { scenario: 'ramping_10_50_70_90vus_format_comparison_30s', query_type: 'format' },
      startTime: '505s', // Start after ramping_combined_query (475s + 30s + 5s)
    },

    thresholds: {
      // Global thresholds
      http_req_duration: ['p(95)<5000', 'p(99)<10000'],
      http_req_failed: ['rate<0.05'], // Allow 5% error rate for stress testing
      errors: ['rate<0.1'],

      // Per-scenario thresholds
      // TODO: Add thresholds for each scenario later
      // 'http_req_duration{scenario:bbox_10}': ['p(95)<500'],
      // 'http_req_duration{scenario:bbox_100}': ['p(95)<1000'],
      // 'http_req_duration{scenario:bbox_1000}': ['p(95)<3000'],
      // 'http_req_duration{scenario:bbox_10000}': ['p(95)<10000'],
      // 'http_req_duration{scenario:id_lookup}': ['p(95)<300'],
      // 'http_req_duration{scenario:attr_filter_small}': ['p(95)<1000'],
      // 'http_req_duration{scenario:attr_filter_medium}': ['p(95)<2000'],
      // 'http_req_duration{scenario:combined}': ['p(95)<2000'],
      // 'http_req_duration{scenario:format_comparison}': ['p(95)<3000'],
      // 'http_req_duration{scenario:pagination}': ['p(95)<2000'],
    },
  }
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const COLLECTION_ID = 'pand';

// Test bounding boxes for different areas in the Netherlands, centered on Rotterdam
// EPSG:7415 (RD New + NAP height). Rotterdam center: 91400, 438000
// Format: minx,miny,maxx,maxy
// All bboxes are square, centered on 91400,438000
const rotterdamX = 91400;
const rotterdamY = 438000;

const TEST_BBOXES = {
  // small: 100m x 100m (centered on Rotterdam)
  small: [
    rotterdamX - 50,
    rotterdamY - 50,
    rotterdamX + 50,
    rotterdamY + 50
  ].join(','), // 100m x 100m

  // medium: 1km x 1km (centered on Rotterdam)
  medium: [
    rotterdamX - 500,
    rotterdamY - 500,
    rotterdamX + 500,
    rotterdamY + 500
  ].join(','), // 1km x 1km

  // large: 5km x 5km (centered on Rotterdam)
  large: [
    rotterdamX - 2500,
    rotterdamY - 2500,
    rotterdamX + 2500,
    rotterdamY + 2500
  ].join(','), // 5km x 5km

  // xlarge: 10km x 10km (centered on Rotterdam)
  xlarge: [
    rotterdamX - 5000,
    rotterdamY - 5000,
    rotterdamX + 5000,
    rotterdamY + 5000
  ].join(','), // 10km x 10km
};

// Sample feature IDs for testing
const SAMPLE_FEATURE_IDS = [
  'NL.IMBAG.Pand.0503100000032914', // TU Delft BK building
  'NL.IMBAG.Pand.0363100012185598', // Amsterdam Central Station
  'NL.IMBAG.Pand.0014100010938997', // Groningen Station
  'NL.IMBAG.Pand.0772100000295227', // Eindhoven Station
  'NL.IMBAG.Pand.0153100000261851', // Enschede Station
];

// Default function for quick tests with --vus and --duration flags
export default function () {
  testBboxQuery100();
}

// Test function: Bbox query with 10 features
export function testBboxQuery10() {
  const res = http.get(
    `${BASE_URL}/collections/${COLLECTION_ID}/items?bbox=${TEST_BBOXES.small}&limit=10`
  );

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.features && body.features.length > 0;
      } catch {
        return false;
      }
    },
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  bboxQueryTime.add(res.timings.duration);

  sleep(0.5);
}

// Test function: Bbox query with 100 features
export function testBboxQuery100() {
  const res = http.get(
    `${BASE_URL}/collections/${COLLECTION_ID}/items?bbox=${TEST_BBOXES.medium}&limit=100`
  );

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.features && body.features.length > 0;
      } catch {
        return false;
      }
    },
    'numberReturned matches': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.numberReturned && body.numberReturned <= 100;
      } catch {
        return false;
      }
    },
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  bboxQueryTime.add(res.timings.duration);

  sleep(1);
}

// Test function: Bbox query with 1000 features
export function testBboxQuery1000() {
  const res = http.get(
    `${BASE_URL}/collections/${COLLECTION_ID}/items?bbox=${TEST_BBOXES.large}&limit=1000`
  );

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.features && body.features.length > 0;
      } catch {
        return false;
      }
    },
    'response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  bboxQueryTime.add(res.timings.duration);

  sleep(2);
}

// Test function: Bbox query with 10000 features
export function testBboxQuery10000() {
  const res = http.get(
    `${BASE_URL}/collections/${COLLECTION_ID}/items?bbox=${TEST_BBOXES.xlarge}&limit=10000`
  );

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.features && body.features.length > 0;
      } catch {
        return false;
      }
    },
    'response time < 10000ms': (r) => r.timings.duration < 10000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  bboxQueryTime.add(res.timings.duration);

  sleep(3);
}

// Test function: Feature ID lookup (optimized with attribute index)
export function testIdLookup() {
  const featureId =
    SAMPLE_FEATURE_IDS[Math.floor(Math.random() * SAMPLE_FEATURE_IDS.length)];
  const res = http.get(
    `${BASE_URL}/collections/${COLLECTION_ID}/items/${featureId}`
  );

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has feature': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id && body.feature;
      } catch {
        return false;
      }
    },
    'response time < 300ms': (r) => r.timings.duration < 300,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  idQueryTime.add(res.timings.duration);

  sleep(0.3);
}

// Test function: Attribute filter (small result set)
export function testAttributeFilterSmall() {
  // Filter for buildings with specific attribute (e.g., high buildings)
  const filters = [
    'b3_h_dak_50p>50',
    'b3_bouwlagen>5',
    "status='Pand in gebruik'",
  ];

  const filter = filters[Math.floor(Math.random() * filters.length)];
  const res = http.get(
    `${BASE_URL}/collections/${COLLECTION_ID}/items?filter=${encodeURIComponent(
      filter
    )}&limit=10`
  );

  const success = check(res, {
    'status is 200 or 400': (r) => r.status === 200 || r.status === 400, // Some filters might not be indexed
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (res.status === 200) {
    filterQueryTime.add(res.timings.duration);
  }

  errorRate.add(!success);
  responseTime.add(res.timings.duration);

  sleep(0.8);
}

// Test function: Attribute filter (medium result set)
export function testAttributeFilterMedium() {
  // Range queries that might return more results
  const filters = [
    'b3_h_dak_50p>50',
    'b3_bouwlagen>5',
    "status='Pand in gebruik'",
  ];

  const filter = filters[Math.floor(Math.random() * filters.length)];
  const res = http.get(
    `${BASE_URL}/collections/${COLLECTION_ID}/items?filter=${encodeURIComponent(
      filter
    )}&limit=100`
  );

  const success = check(res, {
    'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (res.status === 200) {
    filterQueryTime.add(res.timings.duration);
  }

  errorRate.add(!success);
  responseTime.add(res.timings.duration);

  sleep(1.5);
}

// Test function: Combined bbox + filter query
export function testCombinedQuery() {
  const res = http.get(
    `${BASE_URL}/collections/${COLLECTION_ID}/items?bbox=${TEST_BBOXES.medium
    }&filter=${encodeURIComponent('b3_bouwlagen>2')}&limit=50`
  );

  const success = check(res, {
    'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);

  sleep(1.5);
}

// Test function: Different output formats
export function testFormatComparison() {
  const formats = ['json', 'cityjson', 'cjseq', 'obj'];
  const format = formats[Math.floor(Math.random() * formats.length)];

  const res = http.get(
    `${BASE_URL}/collections/${COLLECTION_ID}/items?bbox=${TEST_BBOXES.small}&limit=10&f=${format}`
  );

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'has content': (r) => r.body && r.body.length > 0,
    'response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);

  sleep(1);
}


// Test function: CRS transformation (bbox in different CRS)
// NOTE: This is not tested for now. Later we'll test.
export function testCrsTransformation() {
  // WGS 84 bbox (EPSG:4326) - coordinates in lon/lat order
  // Latitude: 51.926517, Longitude: 4.462456 (centered on Rotterdam)
  // TODO: check if this bbox is correct.
  const wgs84Bbox = '4.462456,51.926517,4.462456,51.926517';

  const res = http.get(
    `${BASE_URL}/collections/${COLLECTION_ID}/items?bbox=${wgs84Bbox}&bbox-crs=EPSG:4326&limit=100`
  );

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.features && body.features.length > 0;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);

  sleep(1);
}

// Setup function - runs once at the beginning
export function setup() {
  console.log('Starting FlatCityBuf API benchmark tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Collection ID: ${COLLECTION_ID}`);

  // Check if API is accessible
  const collectionRes = http.get(`${BASE_URL}/collections/${COLLECTION_ID}`);
  if (collectionRes.status !== 200) {
    throw new Error(
      `API not accessible. Collection endpoint returned: ${collectionRes.status}`
    );
  }

  console.log('API is accessible. Starting benchmark scenarios...');

  return { startTime: new Date().toISOString() };
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log(
    `FlatCityBuf API benchmark tests completed. Started at: ${data.startTime}`
  );
  console.log('Check the results for performance metrics per scenario.');
}
