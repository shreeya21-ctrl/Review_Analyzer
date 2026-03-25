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

MongoClient.connect(mongoURL)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch(error => console.error('MongoDB connection error:', error));

// ============================================================
// ROUTES
// ============================================================

// Root
app.get('/', (req, res) => {
  res.send('Review Analyzer API is running!');
});

// Test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// ── REVIEWS ─────────────────────────────────────────────────

// Get all reviews (paginated)
app.get('/api/reviews', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    const reviews = await db.collection('reviews').find({}).skip(skip).limit(limit).toArray();
    const total = await db.collection('reviews').countDocuments({});
    res.json({ reviews, total, limit, skip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single review by ID
app.get('/api/reviews/:id', async (req, res) => {
  try {
    const review = await db.collection('reviews').findOne({ review_id: req.params.id });
    if (review) res.json(review);
    else res.status(404).json({ error: 'Review not found' });
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
    res.json({ business_id: req.params.businessId, reviews, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── BUSINESSES ───────────────────────────────────────────────

// Get top 50 businesses (legacy endpoint)
app.get('/api/businesses', async (req, res) => {
  try {
    const topReviews = await db.collection('reviews').aggregate([
      { $group: { _id: '$business_id', review_count: { $sum: 1 } } },
      { $sort: { review_count: -1 } },
      { $limit: 50 }
    ]).toArray();

    const businessIds = topReviews.map(b => b._id);
    const businessDetails = await db.collection('businesses')
      .find({ business_id: { $in: businessIds } })
      .toArray();

    const businesses = topReviews.map(review => {
      const details = businessDetails.find(b => b.business_id === review._id);
      return {
        business_id: review._id,
        name: details?.name || 'Unknown Business',
        city: details?.city || '',
        state: details?.state || '',
        review_count: review.review_count
      };
    });

    res.json({ total: businesses.length, businesses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all unique states
app.get('/api/states', async (req, res) => {
  try {
    const states = await db.collection('businesses').distinct('state');
    const cleaned = states.filter(s => s && s.trim() !== '').sort();
    res.json({ states: cleaned });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get businesses filtered by state
app.get('/api/businesses/by-state', async (req, res) => {
  try {
    const state = req.query.state;
    if (!state) return res.status(400).json({ error: 'State parameter required' });

    const businessesInState = await db.collection('businesses')
      .find({ state: state, name: { $exists: true, $ne: '' } })
      .toArray();

    const businessIds = businessesInState.map(b => b.business_id);

    const reviewCounts = await db.collection('reviews').aggregate([
      { $match: { business_id: { $in: businessIds } } },
      { $group: { _id: '$business_id', review_count: { $sum: 1 } } },
      { $sort: { review_count: -1 } }
    ]).toArray();

    const businesses = reviewCounts.map(rc => {
      const details = businessesInState.find(b => b.business_id === rc._id);
      return {
        business_id: rc._id,
        name: details?.name || 'Unknown Business',
        city: details?.city || '',
        state: details?.state || state,
        review_count: rc.review_count
      };
    }).filter(b => b.name !== 'Unknown Business');

    res.json({ state, total: businesses.length, businesses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── SCORES & SUSPICIOUS ──────────────────────────────────────

// Get credibility scores
app.get('/api/credibility-scores', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sort || 'credibility_score';
    const order = req.query.order === 'desc' ? -1 : 1;

    const scores = await db.collection('review_scores')
      .find({})
      .sort({ [sortBy]: order })
      .limit(limit)
      .toArray();

    const stats = await db.collection('review_scores').aggregate([
      {
        $group: {
          _id: null,
          avg_score: { $avg: '$credibility_score' },
          total: { $sum: 1 },
          flagged: {
            $sum: { $cond: [{ $gt: [{ $size: '$flags' }, 0] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    res.json({ scores, statistics: stats[0] || {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get similar review pairs
app.get('/api/similar-reviews', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const similarPairs = await db.collection('similar_reviews')
      .find({})
      .sort({ similarity_score: -1 })
      .limit(limit)
      .toArray();
    res.json({
      total: await db.collection('similar_reviews').countDocuments({}),
      pairs: similarPairs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get most suspicious reviews
app.get('/api/suspicious-reviews', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const suspicious = await db.collection('review_scores')
      .find({ credibility_score: { $lt: 80 } })
      .sort({ credibility_score: 1 })
      .limit(limit)
      .toArray();

    const reviewIds = suspicious.map(s => s.review_id);
    const reviews = await db.collection('reviews')
      .find({ review_id: { $in: reviewIds } })
      .toArray();

    const combined = suspicious.map(score => {
      const review = reviews.find(r => r.review_id === score.review_id);
      return {
        ...score,
        review_text: review?.text.substring(0, 150) + '...',
        stars: review?.stars,
        business_id: review?.business_id
      };
    });

    res.json({ total: suspicious.length, suspicious_reviews: combined });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── MAIN ANALYSIS ENGINE ─────────────────────────────────────

app.get('/api/business/:businessId/analyze', async (req, res) => {
  try {
    const businessId = req.params.businessId;

    const reviews = await db.collection('reviews')
      .find({ business_id: businessId })
      .toArray();

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ error: 'No reviews found for this business' });
    }

    const totalReviews = reviews.length;
    const flags = [];
    let credibilityScore = 100;

    // ── 1. RATING DISTRIBUTION ──────────────────────────────
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { if (r.stars) starCounts[r.stars]++; });
    const extremeCount = starCounts[1] + starCounts[5];
    const extremePercent = ((extremeCount / totalReviews) * 100).toFixed(1);
    const avgRating = (reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / totalReviews).toFixed(2);

    if (extremePercent > 80) {
      credibilityScore -= 25;
      flags.push({ type: 'extreme_ratings', severity: 'high', message: `${extremePercent}% of reviews are 1-star or 5-star only` });
    } else if (extremePercent > 60) {
      credibilityScore -= 12;
      flags.push({ type: 'extreme_ratings', severity: 'medium', message: `${extremePercent}% of reviews are 1-star or 5-star only` });
    }

    // ── 2. REVIEW BURST DETECTION ───────────────────────────
    const reviewsByDate = {};
    reviews.forEach(r => {
      if (r.date) {
        const dateKey = r.date.toString().substring(0, 10);
        reviewsByDate[dateKey] = (reviewsByDate[dateKey] || 0) + 1;
      }
    });

    const dateCounts = Object.values(reviewsByDate);
    const maxInOneDay = Math.max(...dateCounts, 0);
    const burstThreshold = Math.max(5, totalReviews * 0.15);

    if (maxInOneDay >= burstThreshold) {
      credibilityScore -= 20;
      flags.push({ type: 'review_burst', severity: 'high', message: `${maxInOneDay} reviews posted in a single day (suspicious burst)` });
    } else if (maxInOneDay >= 3) {
      credibilityScore -= 8;
      flags.push({ type: 'review_burst', severity: 'low', message: `${maxInOneDay} reviews posted on same day` });
    }

    // ── 3. NEAR-DUPLICATE TEXT DETECTION ────────────────────
    function tokenize(text) {
      return new Set((text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
    }

    function jaccardSimilarity(setA, setB) {
      if (setA.size === 0 || setB.size === 0) return 0;
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      return intersection.size / union.size;
    }

    const tokenizedReviews = reviews.map(r => ({
      id: r.review_id,
      tokens: tokenize(r.text),
      text: r.text
    }));

    const nearDuplicatePairs = [];
    const checked = new Set();

    for (let i = 0; i < Math.min(tokenizedReviews.length, 200); i++) {
      for (let j = i + 1; j < Math.min(tokenizedReviews.length, 200); j++) {
        const key = `${i}-${j}`;
        if (checked.has(key)) continue;
        checked.add(key);
        const sim = jaccardSimilarity(tokenizedReviews[i].tokens, tokenizedReviews[j].tokens);
        if (sim >= 0.75) {
          nearDuplicatePairs.push({
            review1: tokenizedReviews[i].id,
            review2: tokenizedReviews[j].id,
            similarity: (sim * 100).toFixed(1),
            text1: (tokenizedReviews[i].text || '').substring(0, 120),
            text2: (tokenizedReviews[j].text || '').substring(0, 120)
          });
        }
      }
    }

    if (nearDuplicatePairs.length > 5) {
      credibilityScore -= 25;
      flags.push({ type: 'near_duplicates', severity: 'high', message: `${nearDuplicatePairs.length} near-duplicate review pairs detected (≥75% similar)` });
    } else if (nearDuplicatePairs.length > 1) {
      credibilityScore -= 10;
      flags.push({ type: 'near_duplicates', severity: 'medium', message: `${nearDuplicatePairs.length} near-duplicate review pairs detected` });
    }

    // ── 4. REPEAT REVIEWER DETECTION ────────────────────────
    const reviewerCounts = {};
    reviews.forEach(r => {
      if (r.user_id) reviewerCounts[r.user_id] = (reviewerCounts[r.user_id] || 0) + 1;
    });
    const repeatReviewers = Object.entries(reviewerCounts).filter(([, count]) => count > 1);

    if (repeatReviewers.length > 0) {
      credibilityScore -= 15;
      flags.push({ type: 'repeat_reviewers', severity: 'high', message: `${repeatReviewers.length} user(s) reviewed this business more than once` });
    }

    // ── 5. LOW-EFFORT REVIEW DETECTION ──────────────────────
    const shortReviews = reviews.filter(r => (r.text || '').trim().split(/\s+/).length < 5);
    const shortPercent = ((shortReviews.length / totalReviews) * 100).toFixed(1);

    if (shortPercent > 40) {
      credibilityScore -= 10;
      flags.push({ type: 'low_effort', severity: 'medium', message: `${shortPercent}% of reviews are very short (under 5 words)` });
    }

    // ── 6. RECENCY SPIKE ─────────────────────────────────────
    const sortedDates = Object.entries(reviewsByDate).sort(([a], [b]) => new Date(b) - new Date(a));

    if (sortedDates.length >= 2) {
      const recentCount = sortedDates.slice(0, 3).reduce((sum, [, c]) => sum + c, 0);
      const olderCount = sortedDates.slice(3).reduce((sum, [, c]) => sum + c, 0);
      if (olderCount > 0 && recentCount / olderCount > 3) {
        credibilityScore -= 10;
        flags.push({ type: 'recency_spike', severity: 'medium', message: `Unusual spike in recent reviews compared to historical average` });
      }
    }

    // ── FINAL SCORE ──────────────────────────────────────────
    credibilityScore = Math.max(0, Math.min(100, credibilityScore));

    const verdict =
      credibilityScore >= 80 ? 'LIKELY AUTHENTIC' :
      credibilityScore >= 60 ? 'SUSPICIOUS' : 'LIKELY FAKE';

    res.json({
      business_id: businessId,
      total_reviews: totalReviews,
      avg_rating: parseFloat(avgRating),
      credibility_score: credibilityScore,
      verdict,
      star_distribution: starCounts,
      extreme_rating_percent: parseFloat(extremePercent),
      flags,
      near_duplicate_pairs: nearDuplicatePairs.slice(0, 5),
      daily_review_counts: reviewsByDate,
      max_reviews_in_one_day: maxInOneDay,
      repeat_reviewer_count: repeatReviewers.length
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});