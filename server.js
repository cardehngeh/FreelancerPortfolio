const express = require('express');
const fs = require('fs');
const path = require('path');
const { scrapeUpworkReviews } = require('./upwork-scraper');

const app = express();
const PORT = process.env.PORT || 3000;
const reviewFile = path.join(__dirname, 'upwork-reviews.json');
const proxyReviewUrl = process.env.UPWORK_REVIEW_URL || '';

app.use(express.static(__dirname));

app.get('/api/reviews', async (req, res) => {
  // Try live Upwork scraping first
  try {
    console.log('[API] Attempting to fetch live reviews from Upwork...');
    const liveReviews = await scrapeUpworkReviews();
    if (liveReviews && liveReviews.length > 0) {
      console.log('[API] Returning live reviews');
      return res.json(liveReviews);
    }
  } catch (error) {
    console.error('[API] Live scraping failed:', error.message);
  }

  // Try custom proxy if configured
  if (proxyReviewUrl) {
    try {
      console.log('[API] Attempting custom proxy...');
      const response = await fetch(proxyReviewUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          const reviews = data.reviews || data;
          return res.json(Array.isArray(reviews) ? reviews.slice(0, 10) : reviews);
        }
      }
    } catch (error) {
      console.error('[API] Proxy failed:', error.message);
    }
  }

  // Fall back to local JSON file
  try {
    console.log('[API] Falling back to local reviews.json');
    const content = fs.readFileSync(reviewFile, 'utf-8');
    const reviews = JSON.parse(content);
    return res.json(Array.isArray(reviews) ? reviews.slice(0, 10) : reviews);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load review data', message: error.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    source: 'live Upwork scraper (with local fallback)',
    cacheInfo: 'Reviews cached for 1 hour to prevent rate limiting'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Portfolio server running at http://localhost:${PORT}`);
  console.log(`📊 API: /api/reviews (live Upwork scraper with fallback)`);
  console.log(`📋 Status: http://localhost:${PORT}/api/status\n`);
});
