# FlatCityBuf API Benchmark Suite

Comprehensive performance benchmarking for FlatCityBuf API using k6 load testing framework.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![k6](https://img.shields.io/badge/k6-latest-7d64ff.svg)](https://k6.io)

## 🚀 Quick Start

```bash
# Install k6
brew install k6  # macOS

# Run benchmark
./run-fcb-benchmark.sh
```

**Or use Docker/Podman** (no k6 installation needed):

```bash
./run-fcb-benchmark-docker.sh
```

**That's it!** Results will be saved to `results/` directory.

## 📋 What This Tests

This benchmark suite specifically tests **feature-fetching operations** in the FlatCityBuf API:

- ✅ **Spatial queries** (bounding box) with 10, 100, 1000, and 10000 features
- ✅ **Feature ID lookups** using attribute index
- ✅ **Attribute filtering** with various conditions
- ✅ **Combined queries** (spatial + attribute)
- ✅ **Multiple output formats** (JSON, CityJSON, CityJSONSeq, OBJ)
- ✅ **Pagination** with different offsets
- ✅ **OGC API compliance** (links, metadata, pagination)

**Note:** This benchmark focuses on **read operations** that fetch features. Endpoints returning constant values (landing page, conformance, collections metadata) are not included.

## 📊 Test Scenarios Overview

The benchmark suite includes **16 scenarios** organized into **6 test groups**, running sequentially with 5-second buffers to prevent interference.

**Total test duration:** ~540 seconds (~9 minutes)

### Quick Summary

| Scenario | Duration | VUs | Features | p(95) Threshold |
|----------|----------|-----|----------|-----------------|
| BBox Query (10) | 30s | 10 | 10 | < 500ms |
| BBox Query (100) | 30s | 10 | 100 | < 1000ms |
| BBox Query (1000) | 30s | 10 | 1000 | < 3000ms |
| BBox Query (10000) | 30s | 10 | 10000 | < 10000ms |
| ID Lookup | 30s | 10 | 1 | < 300ms |
| Attr Filter (Small) | 30s | 10 | 10 | < 1000ms |
| Combined Query | 30s | 10 | 50 | < 2000ms |
| Format Comparison | 30s | 10 | 10 | < 3000ms |

*Note: Ramping tests scale from 0→15→30→50→70→90 VUs over 30 seconds*

### Detailed Scenario Breakdown

<details>
<summary><strong>Test Group 1: Constant BBox Queries (Throughput Testing)</strong></summary>

#### Scenario 1: Small BBox Query (100m × 100m)

- **Start Time:** 0s
- **VUs:** 10 constant
- **Duration:** 30s
- **Query:** `bbox=91350,437950,91450,438050&limit=10`
- **Purpose:** Baseline performance for minimal spatial queries

#### Scenario 2: Medium BBox Query (1km × 1km)

- **Start Time:** 35s
- **VUs:** 10 constant
- **Duration:** 30s
- **Query:** `bbox=90900,437500,91900,438500&limit=100`
- **Purpose:** Typical urban area query performance

#### Scenario 3: Large BBox Query (5km × 5km)

- **Start Time:** 70s
- **VUs:** 10 constant
- **Duration:** 30s
- **Query:** `bbox=88900,435500,93900,440500&limit=1000`
- **Purpose:** Large area query with substantial data volume

#### Scenario 4: Very Large BBox Query (10km × 10km)

- **Start Time:** 105s
- **VUs:** 10 constant
- **Duration:** 30s
- **Query:** `bbox=86400,433000,96400,443000&limit=10000`
- **Purpose:** Stress test with maximum result sets

</details>

<details>
<summary><strong>Test Group 2: Ramping BBox Queries (Scalability Testing)</strong></summary>

#### Scenario 5-8: Ramping BBox Queries

- **Start Times:** 140s, 175s, 210s, 245s
- **VUs:** Ramping 0→15→30→50→70→90→0 (5s each stage)
- **Duration:** 30s each
- **Sizes:** Small (100m²), Medium (1km²), Large (5km²), Very Large (10km²)
- **Purpose:** Test system scalability under increasing load for each bbox size

</details>

<details>
<summary><strong>Test Group 3-4: Feature ID Lookup</strong></summary>

#### Scenario 9: Constant ID Lookup

- **Start Time:** 280s
- **VUs:** 10 constant
- **Duration:** 30s
- **Purpose:** Test attribute index performance for direct feature access
- **Sample IDs:** TU Delft BK, Amsterdam Central Station, etc.

#### Scenario 10: Ramping ID Lookup

- **Start Time:** 315s
- **VUs:** Ramping 0→15→30→50→70→90→0
- **Duration:** 30s
- **Purpose:** Test ID lookup scalability under increasing concurrent requests

</details>

<details>
<summary><strong>Test Group 5-6: Attribute Filters & Combined Queries</strong></summary>

#### Scenario 11: Constant Attribute Filter

- **Start Time:** 350s
- **VUs:** 10 constant
- **Duration:** 30s
- **Filter:** `b3_h_dak_50p>50` (buildings taller than 50m)
- **Note:** Other filter examples available in code but this test uses height filter only

#### Scenario 12: Constant Combined Query (BBox + Filter)

- **Start Time:** 385s
- **VUs:** 10 constant
- **Duration:** 30s
- **Query:** `bbox=<medium>&filter=b3_bouwlagen>2&limit=50`

#### Scenario 13: Constant Format Comparison

- **Start Time:** 415s
- **VUs:** 10 constant
- **Duration:** 30s
- **Formats:** JSON, CityJSON, CityJSONSeq, OBJ

#### Scenarios 14-16: Ramping Versions

- **Start Times:** 445s, 475s, 505s
- **VUs:** Ramping 0→15→30→50→70→90→0
- **Purpose:** Test scalability of attribute filters, combined queries, and format conversion

</details>

## 🎯 Key Features

### OGC API - Features Compliant

Tests standard OGC API endpoints and query parameters:

- `/collections/{collection_id}/items` with bbox, limit, offset, filter, f parameters
- `/collections/{collection_id}/items/{item_id}` for direct feature access
- Validates pagination links, metadata, and response structure

### Real Geographic Data

Uses actual Dutch building data (BAG dataset):

- Rotterdam bounding boxes centered on `91400,438000` (EPSG:7415) - see Test Data Details section below
- Real feature IDs: `NL.IMBAG.Pand.0153100000209948`
- Realistic attribute filters: `b3_h_dak_50p>50`, `b3_bouwlagen>5`

### Multiple Output Formats

Tests all supported serialization formats:

- **JSON** (GeoJSON-like) - Default, fastest
- **CityJSON** - Complete CityJSON object
- **CityJSONSeq** - Newline-delimited streaming format
- **OBJ** - Wavefront 3D mesh format

### Comprehensive Metrics

Tracks detailed performance data:

- Overall HTTP metrics (duration, failures, throughput)
- Scenario-specific metrics (per query type)
- Custom metrics (bbox_query_time, id_query_time, filter_query_time)
- Response validation (checks pass rate)

## 🛠️ Installation

### Prerequisites

- **k6** - Load testing tool
- **bash** - Shell script execution
- **jq** (optional) - JSON processing

### Install k6

**macOS:**

```bash
brew install k6
```

**Linux (Debian/Ubuntu):**

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**

```powershell
choco install k6
```

For other methods: <https://k6.io/docs/getting-started/installation/>

### Setup

```bash
# Clone or navigate to benchmark directory
cd flatcitybuf-benchmark

# Make scripts executable
chmod +x run-fcb-benchmark.sh

# Verify installation
k6 version
```

## 💻 Usage

### Basic Usage

**Test local API:**

```bash
./run-fcb-benchmark.sh
```

**Test remote API:**

```bash
./run-fcb-benchmark.sh -u https://your-api-url.com
```

Or using environment variable:

```bash
BASE_URL=https://your-api-url.com ./run-fcb-benchmark.sh
```

### Run Modes

**Full benchmark** (all scenarios, ~9 minutes):

```bash
./run-fcb-benchmark.sh -m full
```

**Quick test** (reduced duration, ~10 seconds):

```bash
./run-fcb-benchmark.sh -m quick
```

**Stress test** (high load):

```bash
./run-fcb-benchmark.sh -m stress
```

### Output Formats

**JSON output** (default):

```bash
./run-fcb-benchmark.sh -o json
```

**HTML report:**

```bash
./run-fcb-benchmark.sh -o html
```

**Summary only:**

```bash
./run-fcb-benchmark.sh -o summary
```

### Combined Options

```bash
./run-fcb-benchmark-docker.sh -u http://127.0.0.1:3000 -m full -o all
```

### Manual k6 Execution

If you prefer to run k6 directly:

```bash
# Run all scenarios
BASE_URL=http://localhost:3000 k6 run fcb-benchmark.js

# Custom VUs and duration
BASE_URL=http://localhost:3000 k6 run --vus 10 --duration 30s fcb-benchmark.js

# Output to JSON
BASE_URL=http://localhost:3000 k6 run --out json=results.json fcb-benchmark.js

# Docker execution
docker run -it --rm -v $(pwd):/app -w /app docker.io/grafana/k6 run --out json=results.json fcb-benchmark.js
```

## 📈 Understanding Results

### Console Output

```
✓ status is 200
✓ response has data
✓ response time < 500ms

checks.........................: 97.23% ✓ 2000      ✗ 56
http_req_duration..............: avg=245ms  p(95)=450ms p(99)=650ms
http_req_failed................: 2.15%  ✓ 43        ✗ 1957
bbox_query_time................: avg=312ms  p(95)=580ms
id_query_time..................: avg=128ms  p(95)=245ms
```

### What to Look For

**✅ Good Performance:**

- p(95) below threshold for each scenario
- Error rate < 5%
- Check pass rate > 95%
- Consistent response times

**❌ Issues:**

- p(95) above threshold
- High error rate (> 5%)
- Low check pass rate (< 90%)
- Erratic response times

### Key Metrics

**Standard HTTP Metrics:**

- **http_req_duration**: Total time for HTTP request (waiting + receiving)
- **http_req_waiting**: Time spent waiting for response from server (TTFB)
- **http_req_receiving**: Time spent receiving response data
- **http_req_failed**: Rate of failed requests
- **iterations**: Number of complete test iterations
- **vus**: Number of virtual users

**Custom Metrics:**

- **bbox_query_time**: Bounding box query-specific timing
- **id_query_time**: ID lookup query-specific timing
- **filter_query_time**: Attribute filter query-specific timing
- **errors**: Custom error rate metric
- **response_time**: Overall response time trend

**Important Values:**

- **p(95)**: 95% of requests faster than this value
- **p(99)**: 99% of requests faster than this value

## 🎓 Examples

### Example 1: Baseline Test

```bash
# Run baseline test
./run-fcb-benchmark-docker.sh -m full -o json

# Save baseline
cp results/fcb_benchmark_*.json baseline.json
```

### Example 2: Compare Before/After

```bash
# Before optimization
./run-fcb-benchmark-docker.sh -m full -o json
# Note p(95) values

# Make optimizations...

# After optimization
./run-fcb-benchmark-docker.sh -m full -o json
# Compare p(95) values
```

### Example 3: Test Different Environments

```bash
# Test staging
./run-fcb-benchmark-docker.sh -u https://staging.api.com -m quick

# Test production
./run-fcb-benchmark-docker.sh -u https://prod.api.com -m quick

# Compare results
```

### Example 4: CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Benchmark
  run: ./run-fcb-benchmark.sh -u ${{ secrets.API_URL }} -m full -o json
```

## 🔧 Customization

### Custom Bounding Boxes

Edit `fcb-benchmark.js`:

```javascript
const TEST_BBOXES = {
  my_area: 'minx,miny,maxx,maxy',  // Your coordinates
};

export function testMyArea() {
  const res = http.get(
    `${BASE_URL}/collections/pand/items?bbox=${TEST_BBOXES.my_area}&limit=100`
  );
  // ... validation
}
```

### Custom Feature IDs

```javascript
const SAMPLE_FEATURE_IDS = [
  'your-feature-id-1',
  'your-feature-id-2',
  'your-feature-id-3',
];
```

### Custom Filters

```javascript
const filters = [
  'your_attribute>value',
  'another_attribute BETWEEN 10 AND 20',
];
```

See [fcb-benchmark.config.example.js](fcb-benchmark.config.example.js) for more examples.

## 🐛 Troubleshooting

### Common Issues

**"k6 not found"**

```bash
# Install k6
brew install k6  # macOS
```

**"API not accessible"**

```bash
# Verify API is running
curl http://localhost:3000/collections/pand
```

**High error rates**

```bash
# Check API logs
docker logs <container_id>

# Reduce load
./run-fcb-benchmark.sh -m quick
```

**Slow performance**

```bash
# Check API resources
top  # or htop

# Test with smaller dataset
# Edit fcb-benchmark.js, reduce limits
```

## 🔍 Performance Expectations

### Expected Performance (Constant VU Tests)

Based on the FlatCityBuf API architecture with 10 concurrent VUs:

| Query Type | VUs | Expected p(95) | What It Tests |
|------------|-----|---------------|---------------|
| ID Lookup | 10 | < 300ms | Highly optimized with attribute index |
| BBox (100m²) | 10 | < 500ms | Small result set, minimal data transfer |
| BBox (1km²) | 10 | < 1000ms | Medium result set, typical urban query |
| BBox (5km²) | 10 | < 3000ms | Large result set |
| BBox (10km²) | 10 | < 10000ms | Very large result set, stress test |
| Attr Filter | 10 | < 1000ms | Index lookup + feature retrieval |
| Combined Query | 10 | < 2000ms | Spatial + attribute filtering |
| Format Conversion | 10 | < 3000ms | Varies by format (OBJ slowest) |

### Expected Performance (Ramping VU Tests)

Ramping tests (0→90 VUs) test scalability and identify breaking points. Performance degrades gracefully:

- **Low load (15-30 VUs):** Similar to constant VU performance
- **Medium load (50-70 VUs):** 1.5-2x slower than baseline
- **High load (90 VUs):** 2-3x slower than baseline, possible increased error rates

### Performance Factors

**Efficient:**

- Spatial queries (bbox) using R-tree index
- ID lookups using attribute index
- HTTP range request optimization
- Zero-copy FlatBuffers access

**Less Efficient:**

- Complex attribute filtering (multiple range requests)
- Very large result sets (10000+ features)
- Format conversion (especially OBJ)
- Combined spatial + attribute queries

### Test Data Details

**Bounding Boxes** (EPSG:7415 - RD New + NAP height, centered on Rotterdam):

- **Small:** `91350,437950,91450,438050` (100m × 100m)
- **Medium:** `90900,437500,91900,438500` (1km × 1km)
- **Large:** `88900,435500,93900,440500` (5km × 5km)
- **X-Large:** `86400,433000,96400,443000` (10km × 10km)

**Sample Feature IDs:**

- `NL.IMBAG.Pand.0503100000032914` (TU Delft BK building)
- `NL.IMBAG.Pand.0363100012185598` (Amsterdam Central Station)
- `NL.IMBAG.Pand.0014100010938997` (Groningen Station)
- `NL.IMBAG.Pand.0772100000295227` (Eindhoven Station)
- `NL.IMBAG.Pand.0153100000261851` (Enschede Station)

**Example Attribute Filters:**

- Height: `b3_h_dak_50p>50` (buildings taller than 50m)
- Floors: `b3_bouwlagen>5` (buildings with more than 5 floors)
- Status: `status='Pand in gebruik'` (buildings in use)

## ⚙️ Advanced Usage

### Configuration

**Environment Variables:**

- `BASE_URL`: API base URL (default: `http://localhost:3000` in code, `http://localhost:3000` in scripts)
- `COLLECTION_ID`: Collection to query (default: `pand`)

### Running Specific Scenarios

**Option 1: Comment out scenarios**

Edit `fcb-benchmark.js` and comment out scenarios in the `options.scenarios` object:

```javascript
scenarios: {
  constant_bbox_query_10: { ... },
  // constant_bbox_query_100: { ... },  // Disabled
  // constant_bbox_query_1000: { ... }, // Disabled
}
```

**Option 2: Run specific test groups**

Only run constant tests (Groups 1, 3, 5) or only ramping tests (Groups 2, 4, 6) by selectively commenting scenarios.

**Option 3: Quick single test**

Use k6 directly with the default function:

```bash
k6 run --vus 10 --duration 30s fcb-benchmark.js
```

This runs only `testBboxQuery100()` without the full scenario suite.

### Custom Thresholds

Modify thresholds in `fcb-benchmark.js` to set specific performance targets:

```javascript
thresholds: {
  // Global thresholds (apply to all scenarios)
  http_req_duration: ['p(95)<5000', 'p(99)<10000'],
  http_req_failed: ['rate<0.05'],

  // Per-scenario thresholds (more specific)
  'http_req_duration{scenario:constant_10vus_bbox_10features_30s}': ['p(95)<500'],
  'http_req_duration{scenario:constant_10vus_bbox_100features_30s}': ['p(95)<1000'],
  'http_req_duration{scenario:constant_10vus_id_lookup_30s}': ['p(95)<300'],
}
```

Note: Per-scenario thresholds are active in the default configuration and provide detailed performance expectations for each test scenario.

### Modifying Scenarios

Edit `fcb-benchmark.js` to customize:

- **Virtual users (VUs):** Adjust `vus` property in each scenario
- **Test duration:** Modify `duration` property
- **Start times:** Adjust `startTime` to prevent scenario overlap
- **Ramping stages:** Customize `stages` array for ramping scenarios
- **Thresholds:** Set performance expectations in `thresholds` object
- **Bounding boxes:** Modify `TEST_BBOXES` object coordinates
- **Filter conditions:** Update filter arrays in test functions

**Important:** When adjusting start times, ensure 5-second buffers between scenarios to prevent interference.

### Cloud Testing

Use k6 Cloud for distributed load testing:

```bash
k6 cloud fcb-benchmark.js
```

### Adding New Scenarios

To add new benchmark scenarios:

1. **Define the test function** - Create a new exported function (e.g., `export function testNewScenario() { ... }`)
2. **Add scenario configuration** - Add to `options.scenarios` with:
   - `executor`: Choose executor type (`constant-vus`, `ramping-vus`, etc.)
   - `vus` or `stages`: Define load pattern
   - `duration`: Set test duration
   - `exec`: Reference your test function name
   - `tags`: Add metadata for result filtering
   - `startTime`: Calculate based on previous scenarios + buffer
3. **Define thresholds** (optional) - Add performance expectations to `options.thresholds`
4. **Update documentation** - Add scenario details to this README
5. **Test locally** - Run and verify the new scenario works correctly

**Important:** Maintain the 5-second buffer between start times to prevent interference.

## 📝 What's Different from Generic Benchmark

The original `benchmark.js` provides generic API load testing. This FlatCityBuf benchmark is specialized for:

### Original Benchmark

- Generic CRUD operations
- Simple size-based queries
- POST operations
- Compute operations

### FlatCityBuf Benchmark

- **Spatial queries** (real bounding boxes)
- **Attribute queries** (indexed filters)
- **Multiple formats** (CityJSON, OBJ, etc.)
- **OGC compliance** (pagination, links)
- **Real geographic data**
- **Index performance** (R-tree, B+Tree)

## 🤝 Contributing

Contributions welcome! To add scenarios or improve documentation:

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Same as FlatCityBuf project.

## 🔗 Resources

- **k6 Documentation**: <https://k6.io/docs/>
- **FlatCityBuf API**: github.com/cityjson/flatcitybuf/src/rust/fcb_api/README.md
- **OGC API - Features**: <https://ogcapi.ogc.org/features/>
- **CityJSON**: <https://www.cityjson.org/>

---
