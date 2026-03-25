import * as dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[config] Fatal: environment variable "${name}" is not set. Exiting.`);
    process.exit(1);
  }
  return value;
}

export interface Config {
  sorobanRpcUrl: string;
  port: number;
  corsOrigin: string;
}

export function loadConfig(): Config {
  const sorobanRpcUrl = requireEnv('SOROBAN_RPC_URL');
  const port = parseInt(process.env['PORT'] ?? '3001', 10);
  const corsOrigin = process.env['CORS_ORIGIN'] ?? '*';

  return { sorobanRpcUrl, port, corsOrigin };
}
