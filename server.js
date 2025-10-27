const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Simulate some data
const generateData = (size) => {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    name: `City ${i + 1}`,
    latitude: 40.7128 + Math.random() * 10,
    longitude: -74.0060 + Math.random() * 10,
    population: Math.floor(Math.random() * 1000000),
    area: Math.floor(Math.random() * 500),
    properties: {
      country: 'USA',
      timezone: 'UTC-5',
      established: 1900 + Math.floor(Math.random() * 123)
    }
  }));
};

// Endpoint 1: Get small dataset (10 items)
app.get('/api/cities/small', (req, res) => {
  const data = generateData(10);
  res.json({ data, count: data.length });
});

// Endpoint 2: Get medium dataset (100 items)
app.get('/api/cities/medium', (req, res) => {
  const data = generateData(100);
  res.json({ data, count: data.length });
});

// Endpoint 3: Get large dataset (1000 items)
app.get('/api/cities/large', (req, res) => {
  const data = generateData(1000);
  res.json({ data, count: data.length });
});

// Endpoint 4: CPU intensive - calculate prime numbers
app.get('/api/compute/prime/:limit', (req, res) => {
  const limit = parseInt(req.params.limit) || 100;
  const primes = [];
  
  const isPrime = (num) => {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    
    for (let i = 5; i * i <= num; i += 6) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
  };
  
  for (let i = 2; i <= limit; i++) {
    if (isPrime(i)) primes.push(i);
  }
  
  res.json({ primes, count: primes.length, limit });
});

// Endpoint 5: POST endpoint to create city
app.post('/api/cities', (req, res) => {
  const city = req.body;
  // Simulate processing
  setTimeout(() => {
    res.status(201).json({ 
      message: 'City created successfully',
      city: { ...city, id: Math.floor(Math.random() * 10000) }
    });
  }, 50);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const server = app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
