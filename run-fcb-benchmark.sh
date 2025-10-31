#!/bin/bash

# FlatCityBuf API Benchmark Runner
# This script runs k6 benchmarks against the FlatCityBuf API with resource monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_BASE_URL="http://localhost:8080"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BENCHMARK_SCRIPT="${SCRIPT_DIR}/fcb-benchmark.js"
RESULTS_DIR="${SCRIPT_DIR}/results"
MONITOR_INTERVAL=1  # Resource sampling interval in seconds

# Parse command line arguments
BASE_URL="${BASE_URL:-$DEFAULT_BASE_URL}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-json}"
RUN_MODE="${RUN_MODE:-full}"
ENABLE_MONITORING="${ENABLE_MONITORING:-true}"
API_SERVER_PID="${API_SERVER_PID:-}"

# Display usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL          API base URL (default: ${DEFAULT_BASE_URL})"
    echo "  -m, --mode MODE        Run mode: full, quick, stress (default: full)"
    echo "  -o, --output FORMAT    Output format: json, html, summary, all (default: json)"
    echo "  -p, --pid PID          API server PID for resource monitoring (optional)"
    echo "  --no-monitor           Disable resource monitoring"
    echo "  -h, --help             Display this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BASE_URL               API base URL"
    echo "  API_SERVER_PID         API server process ID for monitoring"
    echo "  ENABLE_MONITORING      Enable/disable monitoring (true/false)"
    echo ""
    echo "Examples:"
    echo "  $0 -u http://localhost:8080 -m quick"
    echo "  $0 -p 12345 -o html          # Monitor API server with PID 12345"
    echo "  $0 --no-monitor              # Run without resource monitoring"
    echo "  BASE_URL=https://api.example.com $0"
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -m|--mode)
            RUN_MODE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        -p|--pid)
            API_SERVER_PID="$2"
            shift 2
            ;;
        --no-monitor)
            ENABLE_MONITORING="false"
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            usage
            ;;
    esac
done

# Validate dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"

if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: k6 is not installed${NC}"
    echo "Please install k6 from: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check if benchmark script exists
if [ ! -f "$BENCHMARK_SCRIPT" ]; then
    echo -e "${RED}Error: Benchmark script not found: $BENCHMARK_SCRIPT${NC}"
    exit 1
fi

# Create results directory
mkdir -p "$RESULTS_DIR"

# Generate output filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="${RESULTS_DIR}/fcb_benchmark_${TIMESTAMP}"
METRICS_CSV="${RESULTS_DIR}/metrics_${TIMESTAMP}.csv"
METRICS_SUMMARY="${RESULTS_DIR}/metrics_summary_${TIMESTAMP}.txt"

# Resource monitoring functions
get_process_stats() {
    local pid=$1
    if [ -z "$pid" ] || ! ps -p "$pid" > /dev/null 2>&1; then
        echo "0,0,0"
        return
    fi

    # macOS vs Linux compatibility
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ps -p "$pid" -o %cpu,%mem,rss= | tail -1 | awk '{print $1","$2","$3}'
    else
        # Linux
        ps -p "$pid" -o %cpu,%mem,rss --no-headers | awk '{print $1","$2","$3}'
    fi
}

get_system_stats() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        local cpu_usage=$(ps -A -o %cpu | awk '{s+=$1} END {print s}')
        local mem_info=$(vm_stat | awk '/Pages active/ {active=$3} /Pages wired/ {wired=$4} /Pages free/ {free=$3} END {gsub(/\./,"",active); gsub(/\./,"",wired); gsub(/\./,"",free); total=(active+wired+free)*4096/1024/1024; used=(active+wired)*4096/1024/1024; printf "%.2f,%d,%d", (used/total)*100, used, total}')
        echo "${cpu_usage},${mem_info}"
    else
        # Linux
        local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
        local mem_info=$(free -m | awk 'NR==2{printf "%.2f,%d,%d", $3*100/$2, $3, $2}')
        echo "${cpu_usage},${mem_info}"
    fi
}

monitor_resources() {
    local server_pid=$1
    local output_csv=$2

    echo "Timestamp,System_CPU%,Memory_Used%,Memory_Used_MB,Memory_Total_MB,Server_CPU%,Server_Memory%,Server_RSS_KB" > "$output_csv"

    while [ "$ENABLE_MONITORING" = "true" ]; do
        local timestamp=$(date +%s)
        local system_stats=$(get_system_stats)
        local process_stats=""

        if [ -n "$server_pid" ]; then
            process_stats=$(get_process_stats "$server_pid")
        else
            process_stats="0,0,0"
        fi

        echo "${timestamp},${system_stats},${process_stats}" >> "$output_csv"
        sleep "$MONITOR_INTERVAL"
    done
}

display_resource_summary() {
    local csv_file=$1

    if [ ! -f "$csv_file" ] || [ ! -s "$csv_file" ]; then
        return
    fi

    echo -e "\n${BLUE}=== Resource Usage Summary ===${NC}" | tee -a "$METRICS_SUMMARY"

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
            printf "  System CPU:    Avg: %.2f%%  Peak: %.2f%%\n", sys_cpu/count, max_sys_cpu
            printf "  System Memory: Avg: %.2f%% (%.0f MB)  Peak: %.2f%%\n", mem_used_pct/count, mem_used_mb/count, max_mem_pct
            if (server_cpu/count > 0) {
                printf "  Server CPU:    Avg: %.2f%%  Peak: %.2f%%\n", server_cpu/count, max_server_cpu
                printf "  Server Memory: Avg: %.2f%%  Peak: %.2f%%\n", server_mem/count, max_server_mem
            }
        }
    }' "$csv_file" | tee -a "$METRICS_SUMMARY"
}

cleanup() {
    if [ ! -z "$MONITOR_PID" ]; then
        kill "$MONITOR_PID" 2>/dev/null || true
        wait "$MONITOR_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT INT TERM

echo -e "${GREEN}FlatCityBuf API Benchmark${NC}"
echo "================================"
echo "Base URL: $BASE_URL"
echo "Run Mode: $RUN_MODE"
echo "Output Format: $OUTPUT_FORMAT"
echo "Resource Monitoring: $ENABLE_MONITORING"
if [ -n "$API_SERVER_PID" ]; then
    echo "Monitoring PID: $API_SERVER_PID"
fi
echo "================================"
echo ""

# Prepare k6 options based on run mode
K6_OPTIONS=""

case $RUN_MODE in
    quick)
        echo -e "${YELLOW}Running quick benchmark (reduced duration)...${NC}"
        K6_OPTIONS="--duration 10s --vus 5"
        ;;
    stress)
        echo -e "${YELLOW}Running stress test (increased load)...${NC}"
        K6_OPTIONS="--vus 50 --duration 60s"
        ;;
    full)
        echo -e "${YELLOW}Running full benchmark suite...${NC}"
        # Use default options from script
        ;;
    *)
        echo -e "${RED}Error: Invalid run mode: $RUN_MODE${NC}"
        echo "Valid modes: full, quick, stress"
        exit 1
        ;;
esac

# Prepare output options
case $OUTPUT_FORMAT in
    json)
        K6_OUTPUT_OPTIONS="--out json=${OUTPUT_FILE}.json"
        ;;
    html)
        K6_OUTPUT_OPTIONS="--out json=${OUTPUT_FILE}.json"
        echo -e "${YELLOW}Note: HTML report will be generated after test completion${NC}"
        ;;
    summary)
        K6_OUTPUT_OPTIONS="--summary-export=${OUTPUT_FILE}_summary.json"
        ;;
    all)
        K6_OUTPUT_OPTIONS="--out json=${OUTPUT_FILE}.json --summary-export=${OUTPUT_FILE}_summary.json"
        echo -e "${YELLOW}Note: Generating both JSON and summary outputs${NC}"
        ;;
    *)
        echo -e "${RED}Error: Invalid output format: $OUTPUT_FORMAT${NC}"
        echo "Valid formats: json, html, summary, all"
        exit 1
        ;;
esac

# Start resource monitoring if enabled
if [ "$ENABLE_MONITORING" = "true" ]; then
    echo -e "${BLUE}Starting resource monitoring...${NC}"
    monitor_resources "$API_SERVER_PID" "$METRICS_CSV" &
    MONITOR_PID=$!
    echo -e "${GREEN}Resource monitoring started (PID: $MONITOR_PID)${NC}"
    echo ""
fi

# Run the benchmark
echo -e "${YELLOW}Starting benchmark tests...${NC}"
if [ "$RUN_MODE" = "full" ]; then
    echo -e "${YELLOW}Expected duration: ~540 seconds (~9 minutes)${NC}"
else
    echo -e "${YELLOW}Running in $RUN_MODE mode${NC}"
fi
echo ""

export BASE_URL

if [ "$RUN_MODE" = "full" ]; then
    # Run full benchmark with all scenarios
    k6 run $K6_OUTPUT_OPTIONS "$BENCHMARK_SCRIPT"
else
    # Run with custom options
    k6 run $K6_OPTIONS $K6_OUTPUT_OPTIONS "$BENCHMARK_SCRIPT"
fi

K6_EXIT_CODE=$?

# Stop monitoring
if [ "$ENABLE_MONITORING" = "true" ] && [ ! -z "$MONITOR_PID" ]; then
    echo -e "\n${YELLOW}Stopping resource monitoring...${NC}"
    ENABLE_MONITORING="false"  # Signal monitor to stop
    sleep 2
    kill "$MONITOR_PID" 2>/dev/null || true
    wait "$MONITOR_PID" 2>/dev/null || true
fi

echo ""
echo "================================"

if [ $K6_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Benchmark completed successfully!${NC}"

    # Generate HTML report if requested
    if [ "$OUTPUT_FORMAT" = "html" ] && [ -f "${OUTPUT_FILE}.json" ]; then
        echo -e "${YELLOW}Generating HTML report...${NC}"

        # Check if k6-reporter is available
        if command -v k6-reporter &> /dev/null; then
            k6-reporter "${OUTPUT_FILE}.json" --output "${OUTPUT_FILE}.html"
            echo -e "${GREEN}HTML report generated: ${OUTPUT_FILE}.html${NC}"
        else
            echo -e "${YELLOW}k6-reporter not found. Install with: npm install -g k6-html-reporter${NC}"
            echo -e "${YELLOW}JSON results available at: ${OUTPUT_FILE}.json${NC}"
        fi
    fi

    # Display resource monitoring summary
    if [ "$ENABLE_MONITORING" = "true" ] && [ -f "$METRICS_CSV" ]; then
        display_resource_summary "$METRICS_CSV"
    fi

    # Display results location
    echo ""
    echo -e "${GREEN}=== Results ===${NC}"
    echo "Benchmark results:"
    case $OUTPUT_FORMAT in
        json)
            echo "  - JSON: ${OUTPUT_FILE}.json"
            ;;
        html)
            echo "  - JSON: ${OUTPUT_FILE}.json"
            echo "  - HTML: ${OUTPUT_FILE}.html"
            ;;
        summary)
            echo "  - Summary: ${OUTPUT_FILE}_summary.json"
            ;;
        all)
            echo "  - JSON: ${OUTPUT_FILE}.json"
            echo "  - Summary: ${OUTPUT_FILE}_summary.json"
            ;;
    esac

    if [ "$ENABLE_MONITORING" = "true" ]; then
        echo ""
        echo "Resource monitoring results:"
        echo "  - CSV: ${METRICS_CSV}"
        echo "  - Summary: ${METRICS_SUMMARY}"
    fi

else
    echo -e "${RED}Benchmark failed with exit code: $K6_EXIT_CODE${NC}"

    # Still save resource monitoring if available
    if [ "$ENABLE_MONITORING" = "true" ] && [ -f "$METRICS_CSV" ]; then
        echo -e "\n${YELLOW}Resource monitoring data still available at: ${METRICS_CSV}${NC}"
    fi

    exit $K6_EXIT_CODE
fi

echo ""
echo -e "${GREEN}Done!${NC}"
