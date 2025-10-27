# flatcitybuf-benchmark

A comprehensive benchmark suite for testing API performance, measuring CPU usage, memory consumption, and response times.

## Features

- **Multiple Test Scenarios**: 5 different benchmark scenarios covering various load patterns
- **Resource Monitoring**: Real-time CPU and memory usage tracking
- **Performance Metrics**: Response times, throughput, error rates
- **Multiple Endpoints**: Test various API endpoints with different payload sizes
- **Automated Testing**: Single command to run complete benchmark suite
- **Resource Reservation**: Documentation for fair performance testing on Linux

## Prerequisites

- Node.js (v14 or higher)
- npm
- k6 (load testing tool)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/HideBa/flatcitybuf-benchmark.git
cd flatcitybuf-benchmark
```

2. Install dependencies:
```bash
npm install
```

3. Install k6:
```bash
# macOS (using Homebrew)
brew install k6

# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (using Chocolatey)
choco install k6

# Or download from https://k6.io/docs/getting-started/installation/
```

## Quick Start

### Start the API Server

```bash
npm start
```

The server will start on `http://localhost:3000` with the following endpoints:

- `GET /health` - Health check
- `GET /api/cities/small` - Get 10 cities
- `GET /api/cities/medium` - Get 100 cities
- `GET /api/cities/large` - Get 1000 cities
- `GET /api/compute/prime/:limit` - CPU-intensive prime number calculation
- `POST /api/cities` - Create a new city

### Run Benchmarks

#### Full Benchmark Suite (with resource monitoring)

```bash
npm run benchmark
```

This will:
1. Start the API server
2. Monitor CPU and memory usage
3. Run all 5 benchmark scenarios
4. Generate detailed reports
5. Save results to `benchmark-results/` directory

#### Quick Benchmark

```bash
npm run benchmark:quick
```

Run a quick 30-second benchmark with 10 virtual users.

#### Manual k6 Run

```bash
# Start server in background
npm start &

# Run k6 benchmark
k6 run benchmark.js

# Or with custom options
k6 run --vus 20 --duration 60s benchmark.js
```

## Benchmark Scenarios

The benchmark suite includes 5 different scenarios:

### 1. Small Dataset - Constant Load
- **Endpoint**: `/api/cities/small`
- **Virtual Users**: 10
- **Duration**: 30 seconds
- **Purpose**: Test baseline performance with small payloads

### 2. Medium Dataset - Ramping Load
- **Endpoint**: `/api/cities/medium`
- **Virtual Users**: 0 → 20 → 0 (ramping)
- **Duration**: 40 seconds
- **Purpose**: Test scalability with medium payloads

### 3. Large Dataset - Spike Test
- **Endpoint**: `/api/cities/large`
- **Virtual Users**: 0 → 50 → 0 (spike)
- **Duration**: 20 seconds
- **Purpose**: Test behavior under sudden load with large payloads

### 4. Compute Intensive
- **Endpoint**: `/api/compute/prime/:limit`
- **Virtual Users**: 5
- **Duration**: 30 seconds
- **Purpose**: Test CPU-intensive operations

### 5. POST Operations
- **Endpoint**: `POST /api/cities`
- **Rate**: 10 requests/second
- **Duration**: 30 seconds
- **Purpose**: Test write operations

## Performance Thresholds

The benchmark enforces these performance thresholds:

- **Global**:
  - 95th percentile response time < 500ms
  - 99th percentile response time < 1000ms
  - Error rate < 1%

- **Per Scenario**:
  - Small dataset: p95 < 200ms
  - Medium dataset: p95 < 400ms
  - Large dataset: p95 < 800ms
  - Compute intensive: p95 < 1000ms
  - POST operations: p95 < 300ms

## Results and Metrics

After running benchmarks, results are saved in the `benchmark-results/` directory:

- `metrics_TIMESTAMP.csv` - CPU and memory usage data
- `metrics_TIMESTAMP.txt` - Summary statistics
- `k6_results_TIMESTAMP.json` - Detailed k6 performance metrics

### Understanding the Results

**CPU Metrics**:
- System CPU% - Overall CPU usage
- Server CPU% - CPU usage by the API server
- Peak values indicate maximum load

**Memory Metrics**:
- Memory Used% - Percentage of total memory in use
- Server Memory% - Memory used by the API server
- RSS (Resident Set Size) - Actual memory in use

**k6 Metrics**:
- `http_req_duration` - Response time
- `http_req_failed` - Failed requests rate
- `http_reqs` - Total requests per second
- `vus` - Virtual users (concurrent connections)

## Resource Reservation for Fair Testing

For accurate and reproducible benchmarks, it's important to reserve CPU and memory resources. See [RESOURCE_RESERVATION.md](./RESOURCE_RESERVATION.md) for detailed instructions on:

- CPU pinning with `taskset`
- Memory limits with `ulimit` and cgroups
- CPU isolation for dedicated testing
- Process priority management
- Best practices for benchmark environments

### Quick Resource Reservation Example

```bash
# Reserve CPUs 0-3 for the server
taskset -c 0-3 node server.js &

# Run benchmark on CPUs 4-7
taskset -c 4-7 k6 run benchmark.js
```

## Customization

### Modifying Benchmark Parameters

Edit `benchmark.js` to customize:

```javascript
export const options = {
  scenarios: {
    your_scenario: {
      executor: 'constant-vus',
      vus: 10,        // Number of virtual users
      duration: '30s', // Test duration
      // ... other options
    }
  }
};
```

### Adding New Endpoints

1. Add endpoint to `server.js`:
```javascript
app.get('/api/your-endpoint', (req, res) => {
  // Your logic
  res.json({ data: 'your data' });
});
```

2. Add test function to `benchmark.js`:
```javascript
export function testYourEndpoint() {
  const res = http.get(`${BASE_URL}/api/your-endpoint`);
  // Add checks
}
```

3. Add scenario to `options.scenarios` in `benchmark.js`

## Environment Variables

- `PORT` - Server port (default: 3000)
- `BASE_URL` - API base URL for k6 tests (default: http://localhost:3000)

Example:
```bash
PORT=8080 npm start
BASE_URL=http://localhost:8080 k6 run benchmark.js
```

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use: `lsof -i :3000`
- Kill existing process: `kill -9 <PID>`

### k6 not found
- Install k6 (see Installation section)
- Or use npx: `npx k6 run benchmark.js`

### Permission denied on run-benchmark.sh
```bash
chmod +x run-benchmark.sh
```

### High error rates in benchmarks
- Check server logs for errors
- Verify server is running: `curl http://localhost:3000/health`
- Reduce load (lower VUs or duration)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC
