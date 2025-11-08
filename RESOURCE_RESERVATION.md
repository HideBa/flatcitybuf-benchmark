# CPU and Memory Reservation Guide for Linux

This guide explains how to reserve CPU and memory resources on Linux servers to ensure fair and consistent performance testing.

## Table of Contents
- [Why Resource Reservation Matters](#why-resource-reservation-matters)
- [CPU Reservation](#cpu-reservation)
- [Memory Reservation](#memory-reservation)
- [Control Groups (cgroups)](#control-groups-cgroups)
- [CPU Isolation](#cpu-isolation)
- [Process Priority and Nice Values](#process-priority-and-nice-values)
- [Verification and Monitoring](#verification-and-monitoring)

## Why Resource Reservation Matters

When running performance benchmarks, it's critical to:
- Isolate benchmark workloads from other system processes
- Ensure consistent and reproducible results
- Prevent interference from background tasks
- Control resource allocation for fair comparisons

## CPU Reservation

### Using taskset to Pin Processes to Specific CPUs

The `taskset` command allows you to bind a process to specific CPU cores:

```bash
# Run server on CPUs 0-3
taskset -c 0-3 node server.js

# Run k6 benchmark on CPUs 4-7
taskset -c 4-7 k6 run benchmark.js
```

### Check Available CPUs

```bash
# List number of CPUs
nproc

# List CPU information
lscpu

# View CPU topology
lscpu --extended
```

### Example: Dedicated CPU Allocation

```bash
# Reserve CPUs 0-3 for the API server
taskset -c 0-3 node server.js &
SERVER_PID=$!

# Reserve CPUs 4-7 for the benchmark tool
taskset -c 4-7 k6 run benchmark.js
```

## Memory Reservation

### Using ulimit to Set Memory Limits

```bash
# Set maximum memory for current shell session (in KB)
ulimit -v 2097152  # 2GB in KB

# Set maximum resident set size
ulimit -m 2097152

# View current limits
ulimit -a
```

### Allocate Specific Memory with systemd-run

```bash
# Run with 2GB memory limit
systemd-run --scope -p MemoryLimit=2G node server.js
```

## Control Groups (cgroups)

Control groups provide fine-grained resource control. Here's how to use them:

### Using cgroups v2 (Modern Linux)

#### 1. Create a cgroup for your benchmark

```bash
# Create cgroup
sudo mkdir -p /sys/fs/cgroup/benchmark

# Set CPU quota (50% of one CPU = 50000/100000)
echo "50000 100000" | sudo tee /sys/fs/cgroup/benchmark/cpu.max

# Set memory limit (2GB)
echo "2147483648" | sudo tee /sys/fs/cgroup/benchmark/memory.max

# Move process to cgroup
echo $PID | sudo tee /sys/fs/cgroup/benchmark/cgroup.procs
```

#### 2. Run process in cgroup using systemd-run

```bash
# Run server with resource limits
sudo systemd-run --scope \
  -p CPUQuota=200% \
  -p MemoryLimit=2G \
  -p CPUAffinity=0-3 \
  node server.js
```

### Using cgroups v1 (Older Linux)

```bash
# Create CPU cgroup
sudo cgcreate -g cpu:/benchmark
sudo cgset -r cpu.cfs_quota_us=50000 benchmark
sudo cgset -r cpu.cfs_period_us=100000 benchmark

# Create memory cgroup
sudo cgcreate -g memory:/benchmark
sudo cgset -r memory.limit_in_bytes=2147483648 benchmark

# Run process in cgroup
sudo cgexec -g cpu,memory:/benchmark node server.js
```

## CPU Isolation

For the most accurate benchmarks, isolate CPUs from the kernel scheduler:

### 1. Isolate CPUs at Boot

Edit `/etc/default/grub` and add to `GRUB_CMDLINE_LINUX`:

```
isolcpus=4-7 nohz_full=4-7 rcu_nocbs=4-7
```

Update grub and reboot:

```bash
sudo update-grub
sudo reboot
```

### 2. Verify CPU Isolation

```bash
# Check isolated CPUs
cat /sys/devices/system/cpu/isolated

# Check process affinity
taskset -p $$
```

### 3. Disable IRQ Balancing on Isolated CPUs

```bash
# Stop irqbalance service
sudo systemctl stop irqbalance

# Set IRQ affinity manually to non-isolated CPUs
echo "0-3" | sudo tee /proc/irq/default_smp_affinity
```

## Process Priority and Nice Values

### Adjust Process Priority

```bash
# Run with high priority (lower nice value = higher priority)
nice -n -10 node server.js

# Adjust running process priority
renice -n -10 -p $PID

# Use real-time priority (requires privileges)
sudo chrt -f 50 node server.js
```

### Priority Classes

- **Nice values**: -20 (highest) to 19 (lowest)
- **Real-time priorities**: 1-99 (FIFO or Round-Robin scheduling)

```bash
# Run with real-time FIFO scheduling
sudo chrt -f 80 node server.js

# Run with real-time Round-Robin scheduling
sudo chrt -r 80 node server.js
```

## Verification and Monitoring

### Monitor CPU Affinity

```bash
# Check CPU affinity of a process
taskset -p $PID

# Monitor which CPU a process is running on
ps -eLo pid,comm,psr | grep node
```

### Monitor Memory Usage

```bash
# Watch memory usage in real-time
watch -n 1 'free -h'

# Check process memory
ps aux | grep node

# Detailed memory info
cat /proc/$PID/status | grep -i mem
```

### Monitor Cgroup Resources

```bash
# Check CPU usage in cgroup
cat /sys/fs/cgroup/benchmark/cpu.stat

# Check memory usage in cgroup
cat /sys/fs/cgroup/benchmark/memory.current

# Check memory limit
cat /sys/fs/cgroup/benchmark/memory.max
```

## Complete Benchmark Setup Example

Here's a complete script to set up a fair benchmark environment:

```bash
#!/bin/bash

# Configuration
SERVER_CPUS="0-3"
BENCHMARK_CPUS="4-7"
SERVER_MEMORY="2G"
SERVER_PRIORITY="-10"

# Function to cleanup
cleanup() {
    echo "Cleaning up..."
    kill $SERVER_PID 2>/dev/null
    sudo systemctl start irqbalance
}

trap cleanup EXIT

# 1. Stop IRQ balancing on benchmark CPUs
sudo systemctl stop irqbalance

# 2. Set IRQ affinity to server CPUs only
echo "$SERVER_CPUS" | sudo tee /proc/irq/default_smp_affinity

# 3. Start server with resource constraints
echo "Starting server with CPU affinity $SERVER_CPUS..."
sudo systemd-run --scope \
  -p CPUAffinity="$SERVER_CPUS" \
  -p MemoryLimit="$SERVER_MEMORY" \
  -p Nice="$SERVER_PRIORITY" \
  node server.js &
SERVER_PID=$!

# Wait for server to be ready
sleep 5

# 4. Run benchmark on dedicated CPUs
echo "Running benchmark on CPUs $BENCHMARK_CPUS..."
taskset -c "$BENCHMARK_CPUS" k6 run benchmark.js

echo "Benchmark complete!"
```

## Best Practices

1. **Disable Hyperthreading**: For consistent results, disable hyperthreading in BIOS or via:
   ```bash
   echo off | sudo tee /sys/devices/system/cpu/smt/control
   ```

2. **Disable CPU Frequency Scaling**: Set governor to 'performance':
   ```bash
   echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
   ```

3. **Disable Turbo Boost**: For consistent CPU frequencies:
   ```bash
   echo 1 | sudo tee /sys/devices/system/cpu/intel_pstate/no_turbo
   ```

4. **Minimize Background Processes**: Stop unnecessary services:
   ```bash
   sudo systemctl stop cups bluetooth
   ```

5. **Use Dedicated Hardware**: When possible, run benchmarks on dedicated systems without other workloads.

## Troubleshooting

### Permission Denied

If you encounter permission errors:
```bash
# Add user to required groups
sudo usermod -a -G sudo $USER

# Or run specific commands with sudo
```

### cgroups Not Available

Check if cgroups are enabled:
```bash
mount | grep cgroup
```

If not available, enable in kernel parameters or use systemd-run which handles this automatically.

### CPU Isolation Not Working

Verify isolation:
```bash
cat /sys/devices/system/cpu/isolated
```

If empty, check boot parameters:
```bash
cat /proc/cmdline
```

## References

- [Linux cgroups documentation](https://www.kernel.org/doc/Documentation/cgroup-v2.txt)
- [CPU isolation guide]([https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux_for_real_time/8/html/optimizing_rhel_8_for_real_time_for_low_latency_operation/assembly_isolating-cpus-using-tuned_optimizing-rhel8-for-real-time-for-low-latency-operation](https://documentation.ubuntu.com/real-time/latest/how-to/isolate-workload-cpusets/))

- [taskset man page](https://man7.org/linux/man-pages/man1/taskset.1.html)
- [systemd resource control](https://www.freedesktop.org/software/systemd/man/systemd.resource-control.html)
