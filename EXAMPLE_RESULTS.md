# Example k6 Benchmark Results

## Simple Benchmark (benchmark.js)

```
✓ Server 1 status is 200
✓ Server 2 status is 200

checks.........................: 100.00% ✓ 600       ✗ 0   
data_received..................: 16 MB   513 kB/s
data_sent......................: 56 kB   1.9 kB/s
http_req_duration..............: avg=1.71ms  min=539.3µs  med=1.24ms  max=21.01ms p(90)=2.83ms   p(95)=3.82ms  
http_req_failed................: 0.00%   ✓ 0         ✗ 600 
http_reqs......................: 600     19.910553/s
iteration_duration.............: avg=1s      min=1s       med=1s      max=1.02s   p(90)=1s       p(95)=1s      
iterations.....................: 300     9.955277/s
vus............................: 10      min=10      max=10
```

## Server 1 Detailed Test (server1-test.js)

```
✓ health check status is 200
✓ health check has ok status
✓ features status is 200
✓ features has type FeatureCollection
✓ features response time < 500ms
✓ feature status is 200
✓ feature has correct id
✓ search status is 200
✓ search returns FeatureCollection
✓ post status is 201
✓ post returns feature

checks.........................: 100.00% ✓ 22       ✗ 0  
http_req_duration..............: avg=2.3ms    min=1.23ms  med=1.54ms  max=9.18ms
http_req_failed................: 0.00%   ✓ 0        ✗ 10 
```

## Comparison Test (compare-servers.js)

```
=== Benchmark Comparison Summary ===

Server 1 (FlatGeobuf):
  Error Rate: 0.00%
  Avg Response Time: 0.98ms
  P95 Response Time: 1.58ms

Server 2 (CityJSON):
  Error Rate: 0.00%
  Avg Response Time: 1.16ms
  P95 Response Time: 1.56ms
```

## Interpretation

- **checks**: Percentage of successful test assertions (should be 100%)
- **http_req_duration**: Response time statistics (lower is better)
  - **avg**: Average response time
  - **p(95)**: 95th percentile (95% of requests were faster than this)
- **http_req_failed**: Failed request rate (should be 0%)
- **http_reqs**: Total number of requests and rate per second
- **vus**: Number of virtual users (concurrent users)

## Key Metrics to Monitor

1. **Response Time (http_req_duration)**: Keep p(95) < 500ms
2. **Error Rate**: Should stay below 10% (ideally 0%)
3. **Throughput (http_reqs)**: Higher is better
4. **Check Success Rate**: Should be 100%
