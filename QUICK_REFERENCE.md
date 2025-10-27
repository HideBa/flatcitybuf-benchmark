# Quick Reference Guide

## Installation (One-time setup)

```bash
# Clone repository
git clone https://github.com/HideBa/flatcitybuf-benchmark.git
cd flatcitybuf-benchmark

# Install Node.js dependencies
npm install

# Install k6 (choose your platform)
# macOS:
brew install k6

# Ubuntu/Debian:
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (Chocolatey):
choco install k6
```

## Usage

### Run Full Benchmark Suite
```bash
npm run benchmark
```
Results saved to: `benchmark-results/metrics_TIMESTAMP.csv` and `k6_results_TIMESTAMP.json`

### Run Quick Test (30 seconds)
```bash
npm run benchmark:quick
```

### Start Server Only
```bash
npm start
# Server runs on http://localhost:3000
```

### Run k6 Manually
```bash
# Start server in background
npm start &

# Run benchmark
k6 run benchmark.js

# Or with custom settings
k6 run --vus 20 --duration 60s benchmark.js
```

## API Endpoints

| Endpoint | Method | Description | Items |
|----------|--------|-------------|-------|
| `/health` | GET | Health check | - |
| `/api/cities/small` | GET | Small dataset | 10 |
| `/api/cities/medium` | GET | Medium dataset | 100 |
| `/api/cities/large` | GET | Large dataset | 1000 |
| `/api/compute/prime/:limit` | GET | CPU-intensive | varies |
| `/api/cities` | POST | Create city | 1 |

## Benchmark Scenarios

| Scenario | VUs | Duration | Endpoint |
|----------|-----|----------|----------|
| Small Constant | 10 | 30s | /api/cities/small |
| Medium Ramping | 0→20→0 | 40s | /api/cities/medium |
| Large Spike | 0→50→0 | 20s | /api/cities/large |
| Compute Intensive | 5 | 30s | /api/compute/prime/:limit |
| POST Operations | 10/s | 30s | POST /api/cities |

**Total Duration:** ~3 minutes

## Performance Thresholds

- Global: p95 < 500ms, p99 < 1000ms, errors < 1%
- Small dataset: p95 < 200ms
- Medium dataset: p95 < 400ms
- Large dataset: p95 < 800ms
- Compute intensive: p95 < 1000ms
- POST operations: p95 < 300ms

## Resource Reservation (Optional)

### Basic CPU Pinning
```bash
# Reserve CPUs 0-3 for server
taskset -c 0-3 node server.js &

# Run benchmark on CPUs 4-7
taskset -c 4-7 k6 run benchmark.js
```

### With Memory Limits
```bash
# Limit server to 2GB memory
systemd-run --scope -p MemoryLimit=2G -p CPUAffinity=0-3 node server.js &

# Run benchmark
taskset -c 4-7 k6 run benchmark.js
```

See `RESOURCE_RESERVATION.md` for advanced options.

## Results

After running benchmarks, check `benchmark-results/` directory:

```bash
# View latest metrics summary
ls -lt benchmark-results/
cat benchmark-results/metrics_*.txt

# Analyze CSV data
less benchmark-results/metrics_*.csv

# View k6 JSON results
cat benchmark-results/k6_results_*.json | jq .
```

## Common Issues

### Port 3000 already in use
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

### k6 not found
```bash
# Use npx instead
npx k6 run benchmark.js
```

### Permission denied
```bash
# Make script executable
chmod +x run-benchmark.sh
```

## Environment Variables

```bash
# Change server port
PORT=8080 npm start

# Change k6 target URL
BASE_URL=http://localhost:8080 k6 run benchmark.js
```

## Customization

Edit `benchmark.js` to customize:
- VUs (virtual users)
- Duration
- Endpoints
- Thresholds
- Scenarios

Edit `server.js` to add new endpoints or modify data generation.

## Documentation

- `README.md` - Complete setup and usage guide
- `RESOURCE_RESERVATION.md` - Linux CPU/memory reservation techniques
- `SETUP_SUMMARY.md` - Implementation details and security notes
- `QUICK_REFERENCE.md` - This file

## Support

For issues or questions:
1. Check README.md troubleshooting section
2. Review RESOURCE_RESERVATION.md for advanced setup
3. Open an issue on GitHub
