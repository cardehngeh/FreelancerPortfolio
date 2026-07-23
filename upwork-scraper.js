const axios = require('axios');
const cheerio = require('cheerio');

const UPWORK_PROFILE_URL = 'https://www.upwork.com/freelancers/~01eb27c0fd81270912';

let cachedReviews = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Scrape reviews from Upwork profile page.
 * Note: Upwork may block automated scraping. Use with caution.
 */
async function scrapeUpworkReviews() {
  const now = Date.now();
  
  // Return cached reviews if still fresh
  if (cachedReviews && now - cacheTimestamp < CACHE_DURATION) {
    console.log('[Scraper] Returning cached reviews');
    return cachedReviews;
  }

  try {
    console.log('[Scraper] Fetching Upwork profile...');
    
    const response = await axios.get(UPWORK_PROFILE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.upwork.com',
      },
      timeout: 15000,
    });

    console.log('[Scraper] HTML fetched, parsing reviews...');
    const reviews = parseReviews(response.data);
    
    if (reviews.length > 0) {
      cachedReviews = reviews;
      cacheTimestamp = now;
      console.log(`[Scraper] Found ${reviews.length} reviews, cached for 1 hour`);
      return reviews;
    }
    
    return null;
  } catch (error) {
    console.error('[Scraper] Error fetching Upwork profile:', error.message);
    return null;
  }
}

/**
 * Parse reviews from Upwork profile HTML.
 * Looks for review cards and extracts client name, text, and rating.
 */
function parseReviews(html) {
  try {
    const $ = cheerio.load(html);
    const reviews = [];

    // Try multiple selectors for review containers
    const reviewSelectors = [
      '[data-qa="ClientReviewsCard"]',
      '[class*="review"]',
      '[class*="Review"]',
      'div[role="article"]',
    ];

    let $reviews = $();
    for (const selector of reviewSelectors) {
      $reviews = $(selector);
      if ($reviews.length > 0) {
        console.log(`[Scraper] Found ${$reviews.length} reviews using selector: ${selector}`);
        break;
      }
    }

    $reviews.each((index, element) => {
      try {
        const $review = $(element);
        
        // Extract client name
        const nameSelectors = [
          '[data-qa*="name"]',
          'h3, h4, h5, h6',
          '.client-name',
          '[class*="name"]',
        ];
        let name = 'Anonymous Client';
        for (const sel of nameSelectors) {
          const foundName = $review.find(sel).first().text().trim();
          if (foundName && foundName.length > 0 && foundName.length < 100) {
            name = foundName;
            break;
          }
        }

        // Extract review text
        const textSelectors = [
          '[data-qa*="text"]',
          '[data-qa*="feedback"]',
          'p',
          '[class*="text"]',
        ];
        let text = '';
        for (const sel of textSelectors) {
          const foundText = $review.find(sel).first().text().trim();
          if (foundText && foundText.length > 20 && foundText.length < 500) {
            text = foundText;
            break;
          }
        }

        // Extract rating
        const ratingSelectors = [
          '[data-qa*="rating"]',
          '[aria-label*="star"]',
          '[class*="rating"]',
        ];
        let rating = 5;
        for (const sel of ratingSelectors) {
          const ratingText = $review.find(sel).first().attr('aria-label') || $review.find(sel).first().text();
          const match = ratingText?.match(/(\d+)/);
          if (match) {
            rating = parseInt(match[1]);
            break;
          }
        }

        if (text && name !== 'Anonymous Client') {
          reviews.push({
            name,
            text: text.substring(0, 300),
            rating: Math.min(rating, 5),
          });
        }
      } catch (err) {
        console.warn('[Scraper] Error parsing individual review:', err.message);
      }
    });

    return reviews.slice(0, 10);
  } catch (error) {
    console.error('[Scraper] Error parsing HTML:', error.message);
    return [];
  }
}

module.exports = { scrapeUpworkReviews };
