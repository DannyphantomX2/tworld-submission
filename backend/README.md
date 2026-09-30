# T-World Module Service

Backend for the Tongston technical assessment: content management with AI-powered
summarization, a token reward system, and a mock Web3-style conversion flow.

## Stack

- Node.js (v20+) + Express
- MongoDB Atlas (Mongoose)
- JWT auth, bcrypt password hashing
- Zod for request validation
- Multer for file uploads

## Getting started

```bash
npm install
cp .env.example .env   # then fill in MONGODB_URI and JWT_SECRET
npm run dev
```

`GET /health` should return `{"status":"ok"}` once it's running.

## Environment variables

See `.env.example`. Nothing beyond `MONGODB_URI` and `JWT_SECRET` is required to run
the full assessment — `CLOUDINARY_URL` and `AWS_*` are optional; without them, media
storage runs against a mock provider (see "Design decisions" below).

## Auth

All routes except `/health`, `/auth/register` and `/auth/login` require:

```
Authorization: Bearer <token>
```

Register or log in to get a token. Tokens expire after `JWT_EXPIRES_IN` (default 1 day).

## API reference

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `{ email, password }` → token + user |
| POST | `/auth/login` | `{ email, password }` → token + user |
| GET | `/auth/me` | current user |

### Content
| Method | Path | Notes |
|---|---|---|
| POST | `/content` | `{ title, body, tags? }` |
| GET | `/content?tag=&q=&page=&limit=` | paginated, `q` is full-text search |
| GET | `/content/:id` | |

### AI
| Method | Path | Notes |
|---|---|---|
| POST | `/content/:id/ai/summarize` | `{ tone?, length? }` → runs the AI provider, logs an `ai_runs` record, awards tokens on success |

### Tokens
| Method | Path | Notes |
|---|---|---|
| GET | `/tokens/balance` | |
| GET | `/tokens/history?page=&limit=` | paginated ledger |
| POST | `/tokens/convert` | `{ toAsset: "MOCK_USDT"\|"MOCK_ETH", amount }` |
| POST | `/tokens/withdraw` | `{ conversionId }` → marks a conversion withdrawn |

### Media
| Method | Path | Notes |
|---|---|---|
| POST | `/media/upload` | multipart, field name `file` → uploads to Cloudinary (or mock) |
| POST | `/media/:id/promote` | moves the asset to S3 (or mock) |

## Design decisions worth knowing

**Token balance and ledger are updated in one MongoDB transaction.**
Every place tokens move — AI reward, conversion, withdrawal — writes the balance
change and the `token_transactions` row together via `session.withTransaction`. If
either write fails, both roll back, so the cached `tokenBalance` on the user can never
drift from the ledger that's supposed to explain it.

**The ledger is append-only.** `TokenTransaction` blocks `updateOne`, `deleteOne`, and
similar calls at the schema level (see `pre` hooks in the model). This is the
"immutability" the brief asks the ledger-based approach to simulate.

**One AI reward per run.** A partial unique index on `token_transactions`
(`type: 'EARN', source: 'AI_USAGE', referenceId`) stops a retried summarize request
from awarding tokens twice for the same `ai_runs` record.

**AI and storage are both behind swappable provider interfaces**
(`src/services/aiProvider.js`, `src/services/storageProvider.js`). Both currently run
in mock mode — deterministic summarization, generated-but-realistic Cloudinary/S3
URLs — because no real API keys were provided for this environment. Both were built
so a real implementation drops in behind the same function signature without
touching any route. The AI provider also has real timeout handling
(`AI_TIMEOUT_MS`) and a fallback response path, which is exercised regardless of
whether the underlying provider is mocked or real.

**Convert/withdraw balance safety.** `POST /tokens/convert` uses an atomic
`findOneAndUpdate` with a `tokenBalance: { $gte: amount }` filter, so a balance can
never go negative even under concurrent requests.

**Auth isn't specified in the brief**, so I added a minimal register/login/JWT flow
with `admin`/`user` roles (`requireRole` middleware exists but isn't wired to any
route yet, since the brief doesn't specify which endpoints are admin-only).

**`POST /tokens/withdraw` input isn't specified in the brief** — I chose
`{ conversionId }`, referencing the `contract_conversions` record it settles.

## What isn't included

- The React admin UI (brief lists it as secondary).
- Real Cloudinary/AWS credentials — the interfaces exist and are ready for them (drop
  `CLOUDINARY_URL` / `AWS_REGION` / `AWS_S3_BUCKET` into `.env`), but they weren't
  configured for this take-home.
- The Web3 signature-verification and background-job stretch goals.

## Testing

No automated test suite is included; each endpoint was manually verified against a
live MongoDB Atlas cluster during development (happy paths, validation failures,
duplicate/insufficient-balance guards, and the append-only ledger). Given more time,
the next step would be integration tests around the transactional AI-reward and
convert/withdraw flows, since those are where a bug would be most costly.
