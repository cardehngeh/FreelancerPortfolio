# Freelancer Portfolio

This portfolio includes a local backend API for serving Upwork review data.

## Run locally

1. Install Node.js from https://nodejs.org/
2. Open a terminal in this folder
3. Run:

```bash
npm install
npm start
```

4. Open http://localhost:3000

## How it works

- The site loads review data from `/api/reviews`
- The backend currently serves `upwork-reviews.json`
- To connect real Upwork reviews, you need either:
  - official Upwork API access, or
  - a custom authenticated review proxy that fetches your Upwork page/server-side

## Notes

Upwork does not allow direct browser-side access to protected review data due to CORS and bot protections, so a local server is required for live updates.
