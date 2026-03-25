import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  sorobanRpcUrl: process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org",
  contractAddress: required("CONTRACT_ADDRESS"),
  discordWebhookUrl: required("DISCORD_WEBHOOK_URL"),
  networkPassphrase:
    process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015",

  // 5000 XLM in stroops (1 XLM = 10_000_000 stroops)
  megaStreamThreshold: BigInt(
    process.env.MEGA_STREAM_THRESHOLD_STROOPS ?? "50000000000000"
  ),

  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS ?? "5000", 10),

  // HTTP API
  apiPort: parseInt(process.env.API_PORT ?? "3001", 10),

  // Default page size for cursor-based pagination
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE ?? "20", 10),
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE ?? "100", 10),
};
