#!/bin/bash

# Start both servers in the background
echo "Starting servers..."
npm run server1 > /dev/null 2>&1 &
SERVER1_PID=$!
npm run server2 > /dev/null 2>&1 &
SERVER2_PID=$!

# Wait for servers to start
echo "Waiting for servers to be ready..."
sleep 3

# Check if servers are running
if curl -s http://localhost:3001/health > /dev/null && curl -s http://localhost:3002/health > /dev/null; then
    echo "✓ Both servers are ready"
else
    echo "✗ Failed to start servers"
    kill $SERVER1_PID $SERVER2_PID 2>/dev/null
    exit 1
fi

# Run the benchmark
echo ""
echo "Running benchmark comparison..."
echo "================================"
k6 run k6-tests/compare-servers.js

# Save exit code
EXIT_CODE=$?

# Clean up
echo ""
echo "Stopping servers..."
kill $SERVER1_PID $SERVER2_PID 2>/dev/null

exit $EXIT_CODE
