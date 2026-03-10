const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
const mongoURL = 'mongodb://localhost:27017';
const dbName = 'review_analyzer';

// Connect to MongoDB when server starts
MongoClient.connect(mongoURL)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch(error => console.error('MongoDB connection error:', error));

// Root route
app.get('/', (req, res) => {
  res.send('Review Analyzer API is running!');
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Get all reviews (with pagination)
app.get('/api/reviews', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    
    const reviews = await db.collection('reviews')
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('reviews').countDocuments({});
    
    res.json({
      reviews: reviews,
      total: total,
      limit: limit,
      skip: skip
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single review by ID
app.get('/api/reviews/:id', async (req, res) => {
  try {
    const review = await db.collection('reviews')
      .findOne({ review_id: req.params.id });
    
    if (review) {
      res.json(review);
    } else {
      res.status(404).json({ error: 'Review not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews for a specific business
app.get('/api/business/:businessId/reviews', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const reviews = await db.collection('reviews')
      .find({ business_id: req.params.businessId })
      .limit(limit)
      .toArray();
    
    const total = await db.collection('reviews')
      .countDocuments({ business_id: req.params.businessId });
    
    res.json({
      business_id: req.params.businessId,
      reviews: reviews,
      total: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get database statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalReviews = await db.collection('reviews').countDocuments({});
    
    const avgStars = await db.collection('reviews').aggregate([
      { $group: { _id: null, avgRating: { $avg: '$stars' } } }
    ]).toArray();
    
    res.json({
      total_reviews: totalReviews,
      average_rating: avgStars[0]?.avgRating.toFixed(2) || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});