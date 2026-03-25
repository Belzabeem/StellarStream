# Implementation Plan: Gas-Estimate Oracle

## Overview

Build a standalone Node.js/TypeScript Express service under `backend/` that wraps the Soroban RPC `simulateTransaction` call, applies a 10% safety buffer to resource fees, and exposes `GET /api/v2/fees/estimate`.

## Tasks

- [x] 1. Scaffold the backend service
  - Create `backend/` directory with `package.json`, `tsconfig.json`, and `src/` layout
  - Add dependencies: `express`, `cors`, `dotenv`; dev dependencies: `typescript`, `ts-node`, `jest`, `supertest`, `fast-check`, `@types/*`
  - Create `src/config.ts` that reads `SOROBAN_RPC_URL`, `PORT`, `CORS_ORIGIN` from environment; exits with non-zero code if `SOROBAN_RPC_URL` is missing
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 2. Implement the Fee Calculator
  - [x] 2.1 Create `src/fee-calculator.ts` with `applyBuffer(raw: RawFeeData): BufferedFees`
    - Compute `resourceFeeStroops = Math.ceil(raw.minResourceFee * 1.10)`
    - Compute `totalFeeStroops = inclusionFeeStroops + resourceFeeStroops`
    - Return all three fields as non-negative integers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Write property tests for Fee Calculator
    - **Property 1: Safety buffer is always at least 10%** — for any non-negative integer `raw`, assert `result.resourceFeeStroops >= Math.ceil(raw * 1.10)`
    - **Property 2: Zero resource fee stays zero** — edge case: input 0, assert output 0
    - **Property 3: Inclusion fee is preserved unchanged** — for any `inclusionFee`, assert output `inclusionFeeStroops === input`
    - **Property 4: Total fee is the sum of its parts** — for any input, assert `total === inclusion + resource`
    - **Property 5: All fee values are non-negative integers** — for any input, assert all output fields are integers >= 0
    - Use `fast-check`, minimum 100 iterations per property
    - Tag: `Feature: gas-estimate-oracle, Property N: <text>`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Implement the Simulation Service
  - [x] 3.1 Create `src/simulation-service.ts` with `simulate(transactionXdr: string): Promise<RawFeeData>`
    - POST to `SOROBAN_RPC_URL` with JSON-RPC body `{ method: "simulateTransaction", params: { transaction: transactionXdr } }`
    - Extract `result.minResourceFee` and the transaction's base `fee` from the XDR envelope
    - Enforce a 10-second timeout via `AbortController`
    - Throw structured errors for RPC error responses and network failures
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 3.2 Write unit tests for Simulation Service
    - Mock `fetch` to return a known successful RPC response; assert `minResourceFee` is extracted correctly
    - Mock `fetch` to return an RPC error response; assert structured error is thrown
    - Mock `fetch` to simulate a network timeout; assert connection error is thrown
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement the Fee API
  - [x] 5.1 Create `src/api.ts` with Express router
    - `GET /api/v2/fees/estimate`: validate `transaction_xdr` query param, call Simulation Service, call Fee Calculator, return `FeeEstimateResponse`
    - Return 400 if `transaction_xdr` is missing
    - Return 422 if `transaction_xdr` fails basic XDR validation (non-base64 or empty)
    - Return 502 if the Simulation Service throws an RPC or network error
    - Return 500 for unhandled exceptions with stack trace logged
    - `GET /health`: return `200 { status: "ok" }`
    - Add request logging middleware (method, path, status, duration ms)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 5.2 Write property test for valid response shape
    - **Property 6: Valid response always contains required fields as non-negative integers with buffered=true** — for any mocked valid simulation result, assert response shape matches `FeeEstimateResponse`
    - _Requirements: 3.1, 3.5, 3.7_

  - [ ]* 5.3 Write property test for invalid XDR inputs
    - **Property 7: Any non-base64 or empty transaction_xdr returns 422** — generate arbitrary invalid strings, assert 422 status
    - _Requirements: 3.3_

  - [ ]* 5.4 Write property test for error response shape
    - **Property 8: All error responses have error and message fields** — for each error path (400, 422, 502, 500), assert response body contains both fields
    - _Requirements: 5.1_

  - [ ]* 5.5 Write unit tests for API edge cases
    - Missing `transaction_xdr` → 400
    - RPC failure → 502 with upstream error details
    - `GET /health` → 200 `{ status: "ok" }`
    - Unhandled exception → 500
    - _Requirements: 3.2, 3.4, 5.3, 5.4_

- [ ] 6. Wire everything together in the entry point
  - [x] 6.1 Create `src/index.ts` that loads config, applies CORS middleware, mounts the router, and starts the HTTP server on `PORT`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All fee arithmetic uses integer math (stroops); no floating-point storage
- The service is stateless — no database required
- Property tests use `fast-check` with a minimum of 100 iterations each
