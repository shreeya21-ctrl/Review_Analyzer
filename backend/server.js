const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const DEMO_STATE = 'DM';
const DEMO_BUSINESSES = [
  {
    business_id: 'demo_low_cred_01',
    name: 'Sunset Glow Dental (Demo)',
    city: 'Mocksville',
    state: DEMO_STATE,
    review_count: 18
  },
  {
    business_id: 'demo_low_cred_02',
    name: 'Rapid Fix Garage (Demo)',
    city: 'Sample City',
    state: DEMO_STATE,
    review_count: 26
  },
  {
    business_id: 'demo_low_cred_03',
    name: 'Bella Vita Med Spa (Demo)',
    city: 'Test Harbor',
    state: DEMO_STATE,
    review_count: 14
  },
  {
    business_id: 'demo_low_cred_04',
    name: 'Prime Bite Bistro (Demo)',
    city: 'North Creek',
    state: DEMO_STATE,
    review_count: 21
  },
  {
    business_id: 'demo_low_cred_05',
    name: 'EverFresh Air Ducts (Demo)',
    city: 'Lake Junction',
    state: DEMO_STATE,
    review_count: 17
  },
  {
    business_id: 'demo_low_cred_06',
    name: 'Velvet Touch Salon (Demo)',
    city: 'Redstone',
    state: DEMO_STATE,
    review_count: 31
  },
  {
    business_id: 'demo_low_cred_07',
    name: 'Guardian Tax Relief (Demo)',
    city: 'Brookfield',
    state: DEMO_STATE,
    review_count: 24
  },
  {
    business_id: 'demo_low_cred_08',
    name: 'Cloud Nine Auto Spa (Demo)',
    city: 'Pine Ridge',
    state: DEMO_STATE,
    review_count: 19
  }
];

const DEMO_ANALYSIS_BY_ID = {
  demo_low_cred_01: {
    business_id: 'demo_low_cred_01',
    total_reviews: 18,
    avg_rating: 4.8,
    credibility_score: 68,
    points_earned_back: 5,
    verdict: 'HIGH RISK',
    star_distribution: { 1: 1, 2: 0, 3: 0, 4: 1, 5: 16 },
    extreme_rating_percent: 94.4,
    flags: [
      { type: 'extreme_ratings', severity: 'high', points: -10, message: '94.4% of reviews are 1-star or 5-star only' },
      { type: 'review_burst', severity: 'high', points: -14, message: '8 reviews posted in a single day (suspicious burst)' },
      { type: 'near_duplicates', severity: 'high', points: -15, message: '7 near-duplicate review pairs detected (>=75% similar)' },
      { type: 'low_effort', severity: 'medium', points: -8, message: '44.4% of reviews are very short (under 5 words)' }
    ],
    rewards: [
      { type: 'unique_reviewers', points: 5, message: 'No repeat reviewers were detected for this business' }
    ],
    near_duplicate_pairs: [
      { review1: 'demo_r1', review2: 'demo_r2', similarity: '91.0', text1: 'Amazing staff, super clean office, highly recommend', text2: 'Amazing staff super clean office highly recommend' },
      { review1: 'demo_r3', review2: 'demo_r4', similarity: '88.0', text1: 'Best dental visit ever, friendly and fast service', text2: 'Friendly and fast service, best dental visit ever' }
    ],
    daily_review_counts: {
      '2026-03-11': 8,
      '2026-03-10': 1,
      '2026-02-21': 2,
      '2026-01-14': 1,
      '2025-12-02': 2,
      '2025-10-18': 1,
      '2025-08-09': 1,
      '2025-06-01': 2
    },
    max_reviews_in_one_day: 8,
    repeat_reviewer_count: 0
  },
  demo_low_cred_02: {
    business_id: 'demo_low_cred_02',
    total_reviews: 26,
    avg_rating: 4.6,
    credibility_score: 72,
    points_earned_back: 10,
    verdict: 'HIGH RISK',
    star_distribution: { 1: 2, 2: 1, 3: 0, 4: 3, 5: 20 },
    extreme_rating_percent: 84.6,
    flags: [
      { type: 'extreme_ratings', severity: 'high', points: -10, message: '84.6% of reviews are 1-star or 5-star only' },
      { type: 'review_burst', severity: 'high', points: -14, message: '6 reviews posted in a single day (suspicious burst)' },
      { type: 'repeat_reviewers', severity: 'high', points: -8, message: '2 user(s) reviewed this business more than once' },
      { type: 'recency_spike', severity: 'medium', points: -8, message: 'Unusual spike in recent reviews compared to historical average' }
    ],
    rewards: [
      { type: 'original_review_text', points: 5, message: 'Reviews appear mostly unique with little duplicated text' },
      { type: 'steady_review_flow', points: 5, message: 'Review activity is steady with no suspicious daily burst' }
    ],
    near_duplicate_pairs: [],
    daily_review_counts: {
      '2026-04-01': 6,
      '2026-03-31': 4,
      '2026-03-30': 3,
      '2025-11-10': 2,
      '2025-09-04': 2,
      '2025-06-16': 3,
      '2025-02-07': 2,
      '2024-12-20': 4
    },
    max_reviews_in_one_day: 6,
    repeat_reviewer_count: 2
  },
  demo_low_cred_03: {
    business_id: 'demo_low_cred_03',
    total_reviews: 14,
    avg_rating: 4.9,
    credibility_score: 59,
    points_earned_back: 0,
    verdict: 'HIGH RISK',
    star_distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 13 },
    extreme_rating_percent: 92.9,
    flags: [
      { type: 'extreme_ratings', severity: 'high', points: -10, message: '92.9% of reviews are 1-star or 5-star only' },
      { type: 'review_burst', severity: 'high', points: -14, message: '5 reviews posted in a single day (suspicious burst)' },
      { type: 'near_duplicates', severity: 'high', points: -15, message: '6 near-duplicate review pairs detected (>=75% similar)' },
      { type: 'repeat_reviewers', severity: 'high', points: -8, message: '1 user(s) reviewed this business more than once' },
      { type: 'low_effort', severity: 'medium', points: -8, message: '50.0% of reviews are very short (under 5 words)' },
      { type: 'recency_spike', severity: 'medium', points: -8, message: 'Unusual spike in recent reviews compared to historical average' }
    ],
    rewards: [],
    near_duplicate_pairs: [
      { review1: 'demo_r5', review2: 'demo_r6', similarity: '95.0', text1: 'Love this place great results and friendly team', text2: 'Great results and friendly team love this place' },
      { review1: 'demo_r7', review2: 'demo_r8', similarity: '90.0', text1: 'Five stars amazing experience will come again', text2: 'Amazing experience five stars will come again' }
    ],
    daily_review_counts: {
      '2026-04-07': 5,
      '2026-04-06': 2,
      '2026-04-05': 2,
      '2025-07-12': 1,
      '2025-05-03': 1,
      '2025-01-19': 1,
      '2024-10-08': 1,
      '2024-08-27': 1
    },
    max_reviews_in_one_day: 5,
    repeat_reviewer_count: 1
  },
  demo_low_cred_04: {
    business_id: 'demo_low_cred_04',
    total_reviews: 21,
    avg_rating: 4.7,
    credibility_score: 74,
    points_earned_back: 5,
    verdict: 'HIGH RISK',
    star_distribution: { 1: 2, 2: 0, 3: 1, 4: 2, 5: 16 },
    extreme_rating_percent: 85.7,
    flags: [
      { type: 'extreme_ratings', severity: 'high', points: -10, message: '85.7% of reviews are 1-star or 5-star only' },
      { type: 'review_burst', severity: 'high', points: -14, message: '7 reviews posted in a single day (suspicious burst)' },
      { type: 'repeat_reviewers', severity: 'high', points: -8, message: '1 user(s) reviewed this business more than once' }
    ],
    rewards: [
      { type: 'original_review_text', points: 5, message: 'Reviews appear mostly unique with little duplicated text' }
    ],
    near_duplicate_pairs: [],
    daily_review_counts: {
      '2026-03-18': 7,
      '2026-03-16': 2,
      '2026-02-02': 3,
      '2025-12-15': 2,
      '2025-09-09': 2,
      '2025-06-29': 2,
      '2025-03-04': 1,
      '2024-11-22': 2
    },
    max_reviews_in_one_day: 7,
    repeat_reviewer_count: 1
  },
  demo_low_cred_05: {
    business_id: 'demo_low_cred_05',
    total_reviews: 17,
    avg_rating: 4.5,
    credibility_score: 63,
    points_earned_back: 5,
    verdict: 'HIGH RISK',
    star_distribution: { 1: 2, 2: 1, 3: 0, 4: 1, 5: 13 },
    extreme_rating_percent: 88.2,
    flags: [
      { type: 'extreme_ratings', severity: 'high', points: -10, message: '88.2% of reviews are 1-star or 5-star only' },
      { type: 'near_duplicates', severity: 'high', points: -15, message: '8 near-duplicate review pairs detected (>=75% similar)' },
      { type: 'low_effort', severity: 'medium', points: -8, message: '47.1% of reviews are very short (under 5 words)' },
      { type: 'recency_spike', severity: 'medium', points: -8, message: 'Unusual spike in recent reviews compared to historical average' }
    ],
    rewards: [
      { type: 'unique_reviewers', points: 5, message: 'No repeat reviewers were detected for this business' }
    ],
    near_duplicate_pairs: [
      { review1: 'demo_r9', review2: 'demo_r10', similarity: '93.0', text1: 'Fast service fair price highly recommend this crew', text2: 'Highly recommend this crew fast service fair price' },
      { review1: 'demo_r11', review2: 'demo_r12', similarity: '87.0', text1: 'Quick clean professional and worth every dollar', text2: 'Professional quick clean and worth every dollar' }
    ],
    daily_review_counts: {
      '2026-04-10': 4,
      '2026-04-09': 3,
      '2026-04-08': 3,
      '2025-09-12': 2,
      '2025-04-02': 2,
      '2024-12-11': 1,
      '2024-08-19': 1,
      '2024-06-30': 1
    },
    max_reviews_in_one_day: 4,
    repeat_reviewer_count: 0
  },
  demo_low_cred_06: {
    business_id: 'demo_low_cred_06',
    total_reviews: 31,
    avg_rating: 4.8,
    credibility_score: 77,
    points_earned_back: 10,
    verdict: 'NEEDS REVIEW',
    star_distribution: { 1: 1, 2: 1, 3: 1, 4: 4, 5: 24 },
    extreme_rating_percent: 80.6,
    flags: [
      { type: 'extreme_ratings', severity: 'high', points: -10, message: '80.6% of reviews are 1-star or 5-star only' },
      { type: 'review_burst', severity: 'high', points: -14, message: '6 reviews posted in a single day (suspicious burst)' },
      { type: 'recency_spike', severity: 'medium', points: -8, message: 'Unusual spike in recent reviews compared to historical average' }
    ],
    rewards: [
      { type: 'original_review_text', points: 5, message: 'Reviews appear mostly unique with little duplicated text' },
      { type: 'unique_reviewers', points: 5, message: 'No repeat reviewers were detected for this business' }
    ],
    near_duplicate_pairs: [],
    daily_review_counts: {
      '2026-03-27': 6,
      '2026-03-26': 3,
      '2026-03-25': 2,
      '2025-11-14': 4,
      '2025-10-01': 3,
      '2025-06-20': 5,
      '2025-02-18': 4,
      '2024-10-10': 4
    },
    max_reviews_in_one_day: 6,
    repeat_reviewer_count: 0
  },
  demo_low_cred_07: {
    business_id: 'demo_low_cred_07',
    total_reviews: 24,
    avg_rating: 4.4,
    credibility_score: 66,
    points_earned_back: 5,
    verdict: 'HIGH RISK',
    star_distribution: { 1: 3, 2: 1, 3: 0, 4: 2, 5: 18 },
    extreme_rating_percent: 87.5,
    flags: [
      { type: 'extreme_ratings', severity: 'high', points: -10, message: '87.5% of reviews are 1-star or 5-star only' },
      { type: 'review_burst', severity: 'high', points: -14, message: '9 reviews posted in a single day (suspicious burst)' },
      { type: 'repeat_reviewers', severity: 'high', points: -8, message: '3 user(s) reviewed this business more than once' },
      { type: 'low_effort', severity: 'medium', points: -8, message: '41.7% of reviews are very short (under 5 words)' }
    ],
    rewards: [
      { type: 'original_review_text', points: 5, message: 'Reviews appear mostly unique with little duplicated text' }
    ],
    near_duplicate_pairs: [],
    daily_review_counts: {
      '2026-02-11': 9,
      '2026-02-10': 2,
      '2025-12-08': 3,
      '2025-09-15': 2,
      '2025-06-07': 3,
      '2025-01-31': 2,
      '2024-10-29': 1,
      '2024-07-16': 2
    },
    max_reviews_in_one_day: 9,
    repeat_reviewer_count: 3
  },
  demo_low_cred_08: {
    business_id: 'demo_low_cred_08',
    total_reviews: 19,
    avg_rating: 4.9,
    credibility_score: 61,
    points_earned_back: 0,
    verdict: 'HIGH RISK',
    star_distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 18 },
    extreme_rating_percent: 94.7,
    flags: [
      { type: 'extreme_ratings', severity: 'high', points: -10, message: '94.7% of reviews are 1-star or 5-star only' },
      { type: 'review_burst', severity: 'high', points: -14, message: '6 reviews posted in a single day (suspicious burst)' },
      { type: 'near_duplicates', severity: 'high', points: -15, message: '9 near-duplicate review pairs detected (>=75% similar)' },
      { type: 'recency_spike', severity: 'medium', points: -8, message: 'Unusual spike in recent reviews compared to historical average' }
    ],
    rewards: [],
    near_duplicate_pairs: [
      { review1: 'demo_r13', review2: 'demo_r14', similarity: '94.0', text1: 'Car looked brand new after wash amazing shine', text2: 'Amazing shine car looked brand new after wash' },
      { review1: 'demo_r15', review2: 'demo_r16', similarity: '89.0', text1: 'Quick detail spotless finish excellent team', text2: 'Excellent team quick detail spotless finish' }
    ],
    daily_review_counts: {
      '2026-04-12': 6,
      '2026-04-11': 3,
      '2026-04-10': 2,
      '2025-08-18': 2,
      '2025-05-06': 2,
      '2025-01-12': 1,
      '2024-09-21': 1,
      '2024-05-03': 2
    },
    max_reviews_in_one_day: 6,
    repeat_reviewer_count: 0
  }
};

function getDemoScoreRows() {
  return Object.values(DEMO_ANALYSIS_BY_ID).map(item => ({
    review_id: `demo-score-${item.business_id}`,
    business_id: item.business_id,
    credibility_score: item.credibility_score,
    flags: item.flags || [],
    is_demo: true
  }));
}

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

// Root
app.get('/', (req, res) => {
  res.send('Review Analyzer API is running!');
});

// Test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.get('/api/stats', async (req, res) => {
  try {
    const total_reviews = await db.collection('reviews').countDocuments({});
    res.json({ total_reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----- REVIEWS -------------------------------------- 

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

// -----BUSINESSES -------------------------------------- 

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
    const cleaned = Array.from(new Set([
      ...states.filter(s => s && s.trim() !== ''),
      DEMO_STATE
    ])).sort();
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

    if (state === DEMO_STATE) {
      return res.json({
        state,
        total: DEMO_BUSINESSES.length,
        businesses: DEMO_BUSINESSES
      });
    }

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

// ----- SCORES & SUSPICIOUS -------------------------------------- 

// Get credibility scores
app.get('/api/credibility-scores', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sort || 'credibility_score';
    const order = req.query.order === 'desc' ? -1 : 1;
    const includeDemo = req.query.includeDemo !== 'false';

    const dbScores = await db.collection('review_scores')
      .find({})
      .toArray();

    const mergedScores = includeDemo
      ? dbScores.concat(getDemoScoreRows())
      : dbScores;

    const sortedScores = mergedScores.sort((a, b) => {
      const left = a?.[sortBy];
      const right = b?.[sortBy];

      if (left === right) return 0;
      if (left == null) return 1;
      if (right == null) return -1;

      if (typeof left === 'string' && typeof right === 'string') {
        return order * left.localeCompare(right);
      }

      return order * (Number(left) - Number(right));
    });

    const scores = sortedScores.slice(0, limit);
    const total = mergedScores.length;
    const flagged = mergedScores.filter(item => Array.isArray(item.flags) && item.flags.length > 0).length;
    const avgScore = total > 0
      ? mergedScores.reduce((sum, item) => sum + Number(item.credibility_score || 0), 0) / total
      : 0;

    res.json({
      scores,
      statistics: {
        total,
        flagged,
        avg_score: avgScore
      }
    });
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
      // FIX: guard against null/undefined review.text
      const text = review?.text || '';
      return {
        ...score,
        review_text: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
        stars: review?.stars,
        business_id: review?.business_id
      };
    });

    res.json({ total: suspicious.length, suspicious_reviews: combined });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----- MAIN ANALYSIS ENGINE -------------------------------------- 

app.get('/api/business/:businessId/analyze', async (req, res) => {
  try {
    const businessId = req.params.businessId;

    if (DEMO_ANALYSIS_BY_ID[businessId]) {
      return res.json(DEMO_ANALYSIS_BY_ID[businessId]);
    }

    const reviews = await db.collection('reviews')
      .find({ business_id: businessId })
      .toArray();

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ error: 'No reviews found for this business' });
    }

    const totalReviews = reviews.length;
    const flags = [];
    const rewards = [];
    const baseCredibilityScore = 100;

    const maxRewardPoints = 10;

    let credibilityScore = baseCredibilityScore;
    let pointsEarnedBack = 0;

    function addReward(type, points, message) {
      const availableRewardPoints = maxRewardPoints - pointsEarnedBack;
      const appliedPoints = Math.min(points, availableRewardPoints);

      if (appliedPoints <= 0) return;

      pointsEarnedBack += appliedPoints;
      rewards.push({ type, points: appliedPoints, message });
    }

    // ----- 1. RATING DISTRIBUTION --------------------------------------
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { if (r.stars) starCounts[r.stars]++; });
    const extremeCount = starCounts[1] + starCounts[5];
    const extremePercent = ((extremeCount / totalReviews) * 100).toFixed(1);
    const avgRating = (reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / totalReviews).toFixed(2);

    if (extremePercent > 80) {
      credibilityScore -= 10;
      flags.push({ type: 'extreme_ratings', severity: 'high', points: -10, message: `${extremePercent}% of reviews are 1-star or 5-star only` });
    }

    // ----- 2. REVIEW BURST DETECTION -------------------------------------- 
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
      credibilityScore -= 14;
      flags.push({ type: 'review_burst', severity: 'high', points: -14, message: `${maxInOneDay} reviews posted in a single day (suspicious burst)` });
    } else {
      addReward('steady_review_flow', 5, `Review activity is steady with no suspicious daily burst`);
    }

    // ----- 3. NEAR-DUPLICATE TEXT DETECTION --------------------------------------
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
      text: r.text || ''
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
            text1: tokenizedReviews[i].text.substring(0, 120),
            text2: tokenizedReviews[j].text.substring(0, 120)
          });
        }
      }
    }

    if (nearDuplicatePairs.length > 5) {
      credibilityScore -= 15;
      flags.push({ type: 'near_duplicates', severity: 'high', points: -15, message: `${nearDuplicatePairs.length} near-duplicate review pairs detected (≥75% similar)` });
    } else {
      addReward('original_review_text', 5, `Reviews appear mostly unique with little duplicated text`);
    }

    // ----- 4. REPEAT REVIEWER DETECTION --------------------------------------
    const reviewerCounts = {};
    reviews.forEach(r => {
      if (r.user_id) reviewerCounts[r.user_id] = (reviewerCounts[r.user_id] || 0) + 1;
    });
    const repeatReviewers = Object.entries(reviewerCounts).filter(([, count]) => count > 1);

    if (repeatReviewers.length > 0) {
      credibilityScore -= 8;
      flags.push({ type: 'repeat_reviewers', severity: 'high', points: -8, message: `${repeatReviewers.length} user(s) reviewed this business more than once` });
    } else {
      addReward('unique_reviewers', 5, `No repeat reviewers were detected for this business`);
    }

    // ----- 5. LOW-EFFORT REVIEW DETECTION --------------------------------------
    const shortReviews = reviews.filter(r => (r.text || '').trim().split(/\s+/).length < 5);
    const shortPercent = ((shortReviews.length / totalReviews) * 100).toFixed(1);

    if (shortPercent > 40) {
      credibilityScore -= 8;
      flags.push({ type: 'low_effort', severity: 'medium', points: -8, message: `${shortPercent}% of reviews are very short (under 5 words)` });
    }

    // ----- 6. RECENCY SPIKE -------------------------------------- 
    const sortedByDate = Object.entries(reviewsByDate).sort(([a], [b]) => new Date(b) - new Date(a));

    if (sortedByDate.length >= 2) {
      const recentCount = sortedByDate.slice(0, 3).reduce((sum, [, c]) => sum + c, 0);
      const olderCount = sortedByDate.slice(3).reduce((sum, [, c]) => sum + c, 0);
      if (olderCount > 0 && recentCount / olderCount > 3) {
        credibilityScore -= 8;
        flags.push({ type: 'recency_spike', severity: 'medium', points: -8, message: `Unusual spike in recent reviews compared to historical average` });
      } else {
        addReward('consistent_history', 5, `Review volume is consistent over time with no recency spike`);
      }
    }

    // ----- FINAL SCORE -------------------------------------- 
    credibilityScore += pointsEarnedBack;
    credibilityScore = Math.max(0, Math.min(100, credibilityScore));

    const verdict =
      credibilityScore >= 90 ? 'LIKELY AUTHENTIC' :
      credibilityScore >= 75 ? 'NEEDS REVIEW' : 'HIGH RISK';

    res.json({
      business_id: businessId,
      total_reviews: totalReviews,
      avg_rating: parseFloat(avgRating),
      credibility_score: credibilityScore,
      points_earned_back: pointsEarnedBack,
      verdict,
      star_distribution: starCounts,
      extreme_rating_percent: parseFloat(extremePercent),
      flags,
      rewards,
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
