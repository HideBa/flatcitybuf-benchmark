#!/bin/bash

# Script to monitor CPU and memory usage during benchmarks
# This script monitors system resources while k6 runs

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INTERVAL=1  # Sampling interval in seconds
OUTPUT_DIR="benchmark-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$OUTPUT_DIR/metrics_${TIMESTAMP}.txt"
CSV_FILE="$OUTPUT_DIR/metrics_${TIMESTAMP}.csv"
K6_RESULTS="$OUTPUT_DIR/k6_results_${TIMESTAMP}.json"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to get process stats
get_process_stats() {
    local pid=$1
    if [ -z "$pid" ] || ! ps -p "$pid" > /dev/null 2>&1; then
        echo "0,0,0"
        return
    fi
    
    # Get CPU and memory usage for the process
    ps -p "$pid" -o %cpu,%mem,rss --no-headers | awk '{print $1","$2","$3}'
}

# Function to get system stats
get_system_stats() {
    # CPU usage (100 - idle%)
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    
    # Memory usage
    local mem_info=$(free -m | awk 'NR==2{printf "%.2f,%.2f,%d", $3*100/$2, $3, $2}')
    
    echo "${cpu_usage},${mem_info}"
}

# Function to monitor resources
monitor_resources() {
    local server_pid=$1
    
    echo -e "${BLUE}Starting resource monitoring...${NC}"
    echo "Timestamp,System_CPU%,Memory_Used%,Memory_Used_MB,Memory_Total_MB,Server_CPU%,Server_Memory%,Server_RSS_KB" > "$CSV_FILE"
    
    while kill -0 "$server_pid" 2>/dev/null; do
        local timestamp=$(date +%s)
        local system_stats=$(get_system_stats)
        local process_stats=$(get_process_stats "$server_pid")
        
        echo "${timestamp},${system_stats},${process_stats}" >> "$CSV_FILE"
        sleep "$INTERVAL"
    done
}

# Function to display summary
display_summary() {
    echo -e "\n${GREEN}=== Benchmark Results Summary ===${NC}"
    echo -e "${YELLOW}Results saved to: $OUTPUT_DIR${NC}\n"
    
    if [ -f "$CSV_FILE" ]; then
        echo -e "${BLUE}Resource Usage Statistics:${NC}"
        
        # Calculate averages and peaks using awk
        awk -F',' 'NR>1 {
            sys_cpu += $2
            mem_used_pct += $3
            mem_used_mb += $4
            server_cpu += $6
            server_mem += $7
            count++
            
            if ($2 > max_sys_cpu) max_sys_cpu = $2
            if ($3 > max_mem_pct) max_mem_pct = $3
            if ($6 > max_server_cpu) max_server_cpu = $6
            if ($7 > max_server_mem) max_server_mem = $7
        }
        END {
            if (count > 0) {
                printf "  Average System CPU: %.2f%%\n", sys_cpu/count
                printf "  Peak System CPU: %.2f%%\n", max_sys_cpu
                printf "  Average Memory Usage: %.2f%% (%.2f MB)\n", mem_used_pct/count, mem_used_mb/count
                printf "  Peak Memory Usage: %.2f%%\n", max_mem_pct
                printf "  Average Server CPU: %.2f%%\n", server_cpu/count
                printf "  Peak Server CPU: %.2f%%\n", max_server_cpu
                printf "  Average Server Memory: %.2f%%\n", server_mem/count
                printf "  Peak Server Memory: %.2f%%\n", max_server_mem
            }
        }' "$CSV_FILE"
    fi
    
    if [ -f "$K6_RESULTS" ]; then
        echo -e "\n${BLUE}K6 Performance Statistics:${NC}"
        echo "  See detailed results in: $K6_RESULTS"
    fi
    
    echo -e "\n${GREEN}All results saved to: $OUTPUT_DIR${NC}"
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    if [ ! -z "$SERVER_PID" ]; then
        kill "$SERVER_PID" 2>/dev/null
        wait "$SERVER_PID" 2>/dev/null
    fi
    if [ ! -z "$MONITOR_PID" ]; then
        kill "$MONITOR_PID" 2>/dev/null
        wait "$MONITOR_PID" 2>/dev/null
    fi
}

trap cleanup EXIT INT TERM

# Main execution
echo -e "${GREEN}=== Flatcitybuf Benchmark Suite ===${NC}"
echo -e "${YELLOW}Starting benchmark at: $(date)${NC}\n"

# Start the API server
echo -e "${BLUE}Starting API server...${NC}"
node server.js &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}Server is ready!${NC}\n"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}Server failed to start${NC}"
        exit 1
    fi
done

# Start monitoring in background
monitor_resources "$SERVER_PID" &
MONITOR_PID=$!

# Run k6 benchmark
echo -e "${BLUE}Running k6 benchmarks...${NC}"
echo "This will take approximately 3 minutes..."
echo ""

if command -v k6 &> /dev/null; then
    k6 run --out json="$K6_RESULTS" benchmark.js
    K6_EXIT_CODE=$?
else
    echo -e "${YELLOW}Warning: k6 not found in PATH, trying npx...${NC}"
    npx k6 run --out json="$K6_RESULTS" benchmark.js
    K6_EXIT_CODE=$?
fi

# Stop monitoring
if [ ! -z "$MONITOR_PID" ]; then
    kill "$MONITOR_PID" 2>/dev/null
    wait "$MONITOR_PID" 2>/dev/null
fi

# Stop server
if [ ! -z "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null
    wait "$SERVER_PID" 2>/dev/null
fi

# Display summary
display_summary

# Exit with k6's exit code
exit $K6_EXIT_CODE
