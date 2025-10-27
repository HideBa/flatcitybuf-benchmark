# flatcitybuf-benchmark

A benchmark project to test and compare the performance of two API servers using k6 load testing tool.

## Project Structure

```
flatcitybuf-benchmark/
├── servers/
│   ├── server1.js          # First API server (FlatGeobuf-style API)
│   └── server2.js          # Second API server (CityJSON-style API)
├── k6-tests/
│   ├── benchmark.js        # Simple benchmark test
│   ├── server1-test.js     # Detailed test for server 1
│   ├── server2-test.js     # Detailed test for server 2
│   └── compare-servers.js  # Comparison test for both servers
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.server1      # Docker image for server 1
├── Dockerfile.server2      # Docker image for server 2
└── package.json            # Node.js dependencies
```

## Prerequisites

- Node.js (v16 or higher)
- k6 (for running load tests)
- Docker and Docker Compose (optional, for containerized testing)

### Installing k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```bash
choco install k6
```

Or download from: https://k6.io/docs/get-started/installation/

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the servers:

**Terminal 1 - Server 1:**
```bash
npm run server1
```

**Terminal 2 - Server 2:**
```bash
npm run server2
```

## Running Benchmarks

### Option 1: Run tests individually

**Simple benchmark (both servers):**
```bash
npm test
```

**Test Server 1 only:**
```bash
npm run test:server1
```

**Test Server 2 only:**
```bash
npm run test:server2
```

**Compare both servers:**
```bash
npm run test:compare
```

### Option 2: Using Docker Compose

Run all services including benchmark:
```bash
docker-compose up --build
```

Run specific k6 test:
```bash
docker-compose run k6 run /scripts/server1-test.js
```

## API Endpoints

### Server 1 (Port 3001) - FlatGeobuf-style API

- `GET /health` - Health check
- `GET /api/features` - Get all features
- `GET /api/features/:id` - Get feature by ID
- `GET /api/features/search?minValue=X&maxValue=Y` - Search features
- `POST /api/features` - Create new feature

### Server 2 (Port 3002) - CityJSON-style API

- `GET /health` - Health check
- `GET /api/cityobjects` - Get all city objects
- `GET /api/cityobjects/:id` - Get city object by ID
- `GET /api/cityobjects/search?minHeight=X&maxHeight=Y` - Search city objects
- `POST /api/cityobjects` - Create new city object

## Test Configuration

The k6 tests include:

- **Load stages**: Gradual ramp-up and ramp-down of virtual users
- **Thresholds**: Performance criteria (95% of requests < 500ms, error rate < 10%)
- **Custom metrics**: Error rates and response times for each server
- **Checks**: Validation of response status and content

## Understanding Results

k6 will output metrics including:

- **http_req_duration**: Response time statistics
- **http_reqs**: Total number of requests
- **http_req_failed**: Failed request rate
- **vus**: Number of virtual users
- **Custom metrics**: Server-specific error rates and response times

Example output:
```
✓ server1 features status is 200
✓ server2 cityobjects status is 200

checks.........................: 100.00% ✓ 2000      ✗ 0
http_req_duration..............: avg=45.2ms  min=12ms med=42ms max=156ms p(95)=89ms p(99)=120ms
http_reqs......................: 2000    66.5/s
```

## Customizing Tests

Edit the k6 test files in the `k6-tests/` directory to:

- Adjust load stages (duration, target users)
- Modify thresholds
- Add or remove test scenarios
- Change endpoint testing patterns

## Troubleshooting

**Port already in use:**
```bash
# Find process using the port
lsof -i :3001
# Kill the process
kill -9 <PID>
```

**k6 not found:**
Make sure k6 is installed and in your PATH.

**Server connection refused:**
Ensure both servers are running before executing tests.

## License

MIT