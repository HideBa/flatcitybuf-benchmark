const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Sample data - simulating FlatGeobuf format response
const sampleData = {
  type: 'FeatureCollection',
  features: Array.from({ length: 100 }, (_, i) => ({
    type: 'Feature',
    id: i,
    geometry: {
      type: 'Point',
      coordinates: [Math.random() * 180 - 90, Math.random() * 180 - 90]
    },
    properties: {
      name: `Feature ${i}`,
      value: Math.random() * 100,
      timestamp: new Date().toISOString()
    }
  }))
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'server1', timestamp: new Date().toISOString() });
});

// Get all features
app.get('/api/features', (req, res) => {
  res.json(sampleData);
});

// Get features with filtering (must be before :id route)
app.get('/api/features/search', (req, res) => {
  const { minValue, maxValue } = req.query;
  let filtered = sampleData.features;
  
  if (minValue) {
    filtered = filtered.filter(f => f.properties.value >= parseFloat(minValue));
  }
  if (maxValue) {
    filtered = filtered.filter(f => f.properties.value <= parseFloat(maxValue));
  }
  
  res.json({
    type: 'FeatureCollection',
    features: filtered
  });
});

// Get feature by ID
app.get('/api/features/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const feature = sampleData.features.find(f => f.id === id);
  
  if (feature) {
    res.json(feature);
  } else {
    res.status(404).json({ error: 'Feature not found' });
  }
});

// Post new feature
app.post('/api/features', (req, res) => {
  const newFeature = {
    type: 'Feature',
    id: sampleData.features.length,
    geometry: req.body.geometry || { type: 'Point', coordinates: [0, 0] },
    properties: req.body.properties || {}
  };
  
  sampleData.features.push(newFeature);
  res.status(201).json(newFeature);
});

app.listen(PORT, () => {
  console.log(`Server 1 running on port ${PORT}`);
});
