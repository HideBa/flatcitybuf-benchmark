# Project Summary: k6 Benchmark Infrastructure

## Overview
This project provides a complete k6-based benchmarking infrastructure for comparing the performance of two API servers.

## Architecture

### API Servers
1. **Server 1 (Port 3001)** - FlatGeobuf-style API
   - Returns GeoJSON FeatureCollection format
   - Sample data: 100 geographic features
   - Endpoints: health, features, search, create

2. **Server 2 (Port 3002)** - CityJSON-style API
   - Returns CityJSON format
   - Sample data: 100 building objects
   - Endpoints: health, cityobjects, search, create

### k6 Test Suites

#### 1. benchmark.js (Simple Test)
- **Duration**: 30 seconds
- **Load**: 10 virtual users
- **Purpose**: Quick health check for both servers
- **Tests**: Basic GET requests to main endpoints

#### 2. server1-test.js (Detailed Test)
- **Load Profile**: Gradual ramp from 10 to 50 users over 3.5 minutes
- **Thresholds**: 
  - P95 response time < 500ms
  - Error rate < 10%
- **Tests**: All Server 1 endpoints including POST operations

#### 3. server2-test.js (Detailed Test)
- **Load Profile**: Gradual ramp from 10 to 50 users over 3.5 minutes
- **Thresholds**: 
  - P95 response time < 500ms
  - Error rate < 10%
- **Tests**: All Server 2 endpoints including POST operations

#### 4. compare-servers.js (Comparison Test)
- **Load Profile**: Gradual ramp from 10 to 30 users over 3.5 minutes
- **Custom Metrics**:
  - server1_errors / server2_errors
  - server1_response_time / server2_response_time
- **Purpose**: Direct performance comparison with summary

## Key Features

✅ Comprehensive test coverage for both servers
✅ Custom metrics and thresholds
✅ Docker Compose orchestration
✅ Automated CI/CD with GitHub Actions
✅ Easy-to-use shell scripts
✅ Security-hardened with CodeQL verification
✅ Detailed documentation and examples

## Quick Start

### Local Testing
```bash
# Install dependencies
npm install

# Terminal 1: Start Server 1
npm run server1

# Terminal 2: Start Server 2
npm run server2

# Terminal 3: Run benchmark
npm run benchmark
```

### Docker Testing
```bash
docker-compose up --build
```

### Individual Tests
```bash
npm run test                # Simple benchmark
npm run test:server1        # Server 1 detailed test
npm run test:server2        # Server 2 detailed test
npm run test:compare        # Comparison test
```

## Performance Targets

- **Response Time (P95)**: < 500ms
- **Error Rate**: < 10% (ideally 0%)
- **Availability**: 100% uptime during tests
- **Throughput**: Varies based on load profile

## Project Files

```
.
├── .github/
│   └── workflows/
│       └── benchmark.yml          # CI/CD workflow
├── k6-tests/
│   ├── benchmark.js               # Simple benchmark
│   ├── server1-test.js            # Server 1 tests
│   ├── server2-test.js            # Server 2 tests
│   └── compare-servers.js         # Comparison tests
├── servers/
│   ├── server1.js                 # FlatGeobuf-style server
│   └── server2.js                 # CityJSON-style server
├── docker-compose.yml             # Container orchestration
├── Dockerfile.server1             # Server 1 container
├── Dockerfile.server2             # Server 2 container
├── run-benchmark.sh               # Benchmark runner script
├── package.json                   # Dependencies and scripts
├── README.md                      # Main documentation
├── EXAMPLE_RESULTS.md             # Example output
└── SUMMARY.md                     # This file
```

## Metrics Explained

- **checks**: Test assertions passed (target: 100%)
- **http_req_duration**: Response time (lower is better)
  - avg: Average response time
  - p(95): 95th percentile
  - p(99): 99th percentile
- **http_req_failed**: Failed requests rate (target: 0%)
- **http_reqs**: Total requests and throughput
- **vus**: Virtual users (concurrent load)
- **iterations**: Completed test cycles

## Security

✅ CodeQL security scanning enabled
✅ Minimal GitHub Actions permissions
✅ No secrets or credentials in code
✅ All dependencies from trusted sources

## Next Steps

1. Customize servers with real data sources
2. Adjust load profiles for production scenarios
3. Add more complex test scenarios
4. Integrate with monitoring systems
5. Configure alerts for performance degradation

## License

MIT
