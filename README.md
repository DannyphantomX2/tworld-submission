# T-World Module Service — Tongston Assessment

Submission for the Full Stack Engineer (Back-End Focus) technical assessment.

- `backend/` — Node.js/Express + MongoDB API (content, AI summarization, token
  rewards, mock Web3 conversion, media storage). See `backend/README.md`.
- `admin/` — React admin UI. See `admin/README.md`.

## Quick start

1. `cd backend && npm install && cp .env.example .env` (fill in `MONGODB_URI`,
   `JWT_SECRET`), then `npm run dev`.
2. In a separate terminal: `cd admin && npm install && npm run dev`.

Each folder's own README has the full API reference, setup details, and the
design decisions made where the brief left something unspecified.
