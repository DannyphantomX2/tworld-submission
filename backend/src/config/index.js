// Everything env-driven lives here so the rest of the code never touches process.env.
const num = (v, fallback) => (v !== undefined && v !== '' ? Number(v) : fallback);

export const config = {
  port: num(process.env.PORT, 4000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  ai: {
    provider: process.env.AI_PROVIDER || 'mock',
    timeoutMs: num(process.env.AI_TIMEOUT_MS, 8000),
    tokensPerRun: num(process.env.TOKENS_PER_AI_RUN, 5),
  },
  // Mock conversion table: how many platform tokens buy one unit of the asset.
  // Derived from the brief: 100 tokens -> 1 MOCK_USDT, 200 tokens -> 0.01 MOCK_ETH.
  rates: {
    MOCK_USDT: { tokensPerUnit: 100 },
    MOCK_ETH: { tokensPerUnit: 20000 },
  },
};

export function assertConfig() {
  const missing = [];
  if (!config.mongoUri) missing.push('MONGODB_URI');
  if (!config.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
