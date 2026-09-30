# T-World Admin UI

Minimal React admin interface for the T-World backend (see `tworld-service`).
Kept deliberately simple — the assessment lists this as secondary, correctness
over polish.

## Stack

- React 18 (Vite)
- Tailwind CSS

## Running it

Requires the backend (`tworld-service`) running on `http://localhost:4000` at the
same time.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

The dev server proxies `/auth`, `/content`, `/tokens` and `/media` requests to
`localhost:4000` (see `vite.config.js`), so no CORS setup or `.env` is needed for
local development. If the backend runs somewhere else, set `VITE_API_BASE` in a
`.env` file (see `.env.example`).

## What it does

- Register / log in (JWT stored in `localStorage`)
- Create and list content items
- Trigger AI summarization per item, showing status, latency, output, and tokens
  earned
- View token balance and recent transaction history
- Convert tokens to a mock asset (`MOCK_USDT` / `MOCK_ETH`)
- Simulate a withdrawal for a conversion just made

## Known limitation

Withdrawal is only offered for the conversion just created in the current
browser session — the backend has no "list my conversions" endpoint, so the UI
has no way to look up older, unwithdrawn conversions after a page refresh. The
data itself isn't lost (it's on the `contract_conversions` collection and in
`/tokens/history`), it's just not withdrawable from this UI without that
endpoint. A `GET /tokens/conversions` route would be the fix.
