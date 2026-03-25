import { config } from "./config";
import { pollForMegaStreams } from "./indexer";
import { startServer } from "./api/server";
import { seedMockData } from "./db";

console.log("🌊 StellarStream backend starting...");
console.log(`   Contract : ${config.contractAddress}`);
console.log(`   RPC      : ${config.sorobanRpcUrl}`);
console.log(
  `   Threshold: ${config.megaStreamThreshold.toLocaleString()} stroops (≥ 5,000 XLM)`
);
console.log(`   Interval : ${config.pollIntervalMs}ms`);
console.log(`   API Port : ${config.apiPort}\n`);

// Seed mock streams in development
if (process.env.NODE_ENV !== "production") {
  seedMockData();
  console.log("[DB] Seeded 50 mock streams\n");
}

// Start HTTP API
startServer();

// Start Soroban event poller
pollForMegaStreams();
setInterval(pollForMegaStreams, config.pollIntervalMs);
