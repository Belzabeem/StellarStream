import express from 'express';
import cors from 'cors';
import { loadConfig } from './config';
import { router } from './api';

const config = loadConfig();

const app = express();

// CORS middleware — restrict to CORS_ORIGIN when set, otherwise allow all
app.use(cors({ origin: config.corsOrigin }));

app.use(express.json());

// Mount router at root (routes are fully qualified: /health, /api/v2/fees/estimate)
app.use(router);

app.listen(config.port, () => {
  console.log(
    JSON.stringify({
      event: 'server_started',
      port: config.port,
      sorobanRpcUrl: config.sorobanRpcUrl,
      corsOrigin: config.corsOrigin,
    }),
  );
});
