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

Tests **feature-fetching operations** in the FlatCityBuf API:

- Spatial queries (bbox) with 10, 100, 1000, and 10000 features
- Feature ID lookups using attribute index
- Attribute filtering and combined queries
- Multiple output formats (JSON, CityJSON, CityJSONSeq, OBJ)
- OGC API - Features compliance (pagination, links, metadata)

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

**Test Groups:**

1. Constant BBox queries (scenarios 1-4): 10, 100, 1000, 10000 features
2. Ramping BBox queries (scenarios 5-8): Scalability testing with increasing load
3-4. ID lookups (scenarios 9-10): Constant and ramping feature ID access
5-6. Filters & formats (scenarios 11-16): Attribute filters, combined queries, format comparisons

All scenarios run sequentially with 5-second buffers. See `fcb-benchmark.js` for detailed configuration.

## 🎯 Key Features

- **OGC API - Features compliant**: Tests standard endpoints (`/collections/{id}/items`, `/collections/{id}/items/{item_id}`)
- **Real geographic data**: Uses Dutch building data (BAG dataset) with Rotterdam bounding boxes (EPSG:7415)
- **Multiple formats**: JSON, CityJSON, CityJSONSeq, OBJ
- **Comprehensive metrics**: HTTP metrics, scenario-specific timing, custom query metrics

## 🛠️ Installation

**Install k6:**

- macOS: `brew install k6`
- Linux: See <https://k6.io/docs/getting-started/installation/>
- Windows: `choco install k6`

**Or use Docker** (no installation needed):

```bash
./run-fcb-benchmark-docker.sh
```

## 💻 Usage

**Basic:**

```bash
./run-fcb-benchmark.sh                    # Local API
./run-fcb-benchmark.sh -u https://api.com  # Remote API
```

**Options:**

- `-m, --mode`: `full` (default, ~9 min), `quick` (~10s), `stress`
- `-o, --output`: `json` (default), `html`, `summary`, `all`
- `-u, --url`: API base URL (default: `http://localhost:3000`)

**Manual k6:**

```bash
BASE_URL=http://localhost:3000 k6 run fcb-benchmark.js
```

## 📈 Understanding Results

**Key metrics:**

- `http_req_duration`: Request duration (p(95), p(99) percentiles)
- `http_req_failed`: Error rate (should be < 5%)
- Custom metrics: `bbox_query_time`, `id_query_time`, `filter_query_time`

**Good performance:** p(95) below threshold, error rate < 5%, check pass rate > 95%
**Issues:** p(95) above threshold, high error rate, low check pass rate

Results are saved to `results/` directory (JSON, HTML, or summary formats).

## 🎓 Examples

**Compare before/after:**

```bash
./run-fcb-benchmark.sh -m full -o json  # Before
# ... make changes ...
./run-fcb-benchmark.sh -m full -o json  # After
```

**CI/CD (GitHub Actions):**

```yaml
- name: Run Benchmark
  run: ./run-fcb-benchmark.sh -u ${{ secrets.API_URL }} -m full -o json
```

## 🔧 Customization

Edit `fcb-benchmark.js` to customize:

- **Bounding boxes**: Modify `TEST_BBOXES` object
- **Feature IDs**: Update `SAMPLE_FEATURE_IDS` array
- **Filters**: Adjust filter conditions in test functions
- **Scenarios**: Comment out scenarios or modify VUs/duration/thresholds

## 🐛 Troubleshooting

- **"k6 not found"**: Install k6 or use Docker: `./run-fcb-benchmark-docker.sh`
- **"API not accessible"**: Verify API is running: `curl http://localhost:3000/collections/pand`
- **High error rates**: Check API logs, reduce load with `-m quick`
- **Slow performance**: Check API resources, reduce test limits in `fcb-benchmark.js`

## ⚙️ Advanced Usage

**Environment Variables:**

- `BASE_URL`: API base URL (default: `http://localhost:3000`)
- `COLLECTION_ID`: Collection to query (default: `pand`)

**Running specific scenarios:** Comment out scenarios in `fcb-benchmark.js` or use k6 directly:

```bash
k6 run --vus 10 --duration 30s fcb-benchmark.js
```

**Custom thresholds:** Modify `options.thresholds` in `fcb-benchmark.js` for per-scenario performance targets.

**Adding scenarios:** Create test function, add to `options.scenarios`, set `startTime` with 5s buffer from previous scenario.

## 📄 License

Same as FlatCityBuf project. MIT License(./LICENSE).

## 🔗 Resources

- **k6 Documentation**: <https://k6.io/docs/>
- **FlatCityBuf API**: github.com/cityjson/flatcitybuf/src/rust/fcb_api/README.md
- **OGC API - Features**: <https://ogcapi.ogc.org/features/>
- **CityJSON**: <https://www.cityjson.org/>

---
