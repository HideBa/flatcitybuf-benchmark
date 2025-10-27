const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// Sample data - simulating CityJSON format response
const sampleData = {
  type: 'CityJSON',
  version: '1.1',
  CityObjects: Object.fromEntries(
    Array.from({ length: 100 }, (_, i) => [
      `building-${i}`,
      {
        type: 'Building',
        attributes: {
          name: `Building ${i}`,
          height: Math.random() * 50 + 10,
          yearOfConstruction: 1900 + Math.floor(Math.random() * 123)
        },
        geometry: [{
          type: 'Solid',
          lod: 2,
          boundaries: [[[
            [Math.random() * 100, Math.random() * 100, 0],
            [Math.random() * 100, Math.random() * 100, 0],
            [Math.random() * 100, Math.random() * 100, 0]
          ]]]
        }]
      }
    ])
  )
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'server2', timestamp: new Date().toISOString() });
});

// Get all city objects
app.get('/api/cityobjects', (req, res) => {
  res.json(sampleData);
});

// Get city objects with filtering (must be before :id route)
app.get('/api/cityobjects/search', (req, res) => {
  const { minHeight, maxHeight } = req.query;
  const filtered = {};
  
  Object.entries(sampleData.CityObjects).forEach(([id, obj]) => {
    const height = obj.attributes.height;
    if ((!minHeight || height >= parseFloat(minHeight)) &&
        (!maxHeight || height <= parseFloat(maxHeight))) {
      filtered[id] = obj;
    }
  });
  
  res.json({
    type: 'CityJSON',
    version: '1.1',
    CityObjects: filtered
  });
});

// Get city object by ID
app.get('/api/cityobjects/:id', (req, res) => {
  const id = req.params.id;
  const cityObject = sampleData.CityObjects[id];
  
  if (cityObject) {
    res.json({ id, ...cityObject });
  } else {
    res.status(404).json({ error: 'City object not found' });
  }
});

// Post new city object
app.post('/api/cityobjects', (req, res) => {
  const id = `building-${Object.keys(sampleData.CityObjects).length}`;
  const newObject = {
    type: req.body.type || 'Building',
    attributes: req.body.attributes || {},
    geometry: req.body.geometry || []
  };
  
  sampleData.CityObjects[id] = newObject;
  res.status(201).json({ id, ...newObject });
});

app.listen(PORT, () => {
  console.log(`Server 2 running on port ${PORT}`);
});
