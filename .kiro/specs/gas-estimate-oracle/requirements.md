# Requirements Document

## Introduction

The Gas-Estimate Oracle is a backend service for Nebula V2 that calculates the estimated transaction fees for Soroban smart contract operations. It exposes a REST API endpoint that the frontend can query before a user submits a transaction, allowing accurate cost display. The service wraps the Soroban RPC `simulateTransaction` call, extracts the inclusion fee and resource fee (CPU/RAM), and applies a 10% safety buffer to resource increments to prevent "Out of Resources" errors at execution time.

## Glossary

- **Simulation_Service**: The backend module responsible for calling the Soroban RPC `simulateTransaction` endpoint and parsing the response.
- **Fee_Calculator**: The backend module responsible for applying the 10% safety buffer to resource fee increments and computing the final fee estimates.
- **Fee_API**: The REST API layer that exposes the `GET /api/v2/fees/estimate` endpoint to the frontend.
- **Inclusion_Fee**: The base transaction fee charged by the Stellar network for including a transaction in a ledger, expressed in stroops (1 XLM = 10,000,000 stroops).
- **Resource_Fee**: The fee charged for CPU instructions and RAM consumed by a Soroban smart contract execution, expressed in stroops.
- **Safety_Buffer**: A 10% multiplicative increase applied to the resource fee increment to reduce the probability of "Out of Resources" errors.
- **Soroban_RPC**: The JSON-RPC interface provided by a Stellar RPC node for simulating and submitting Soroban transactions.
- **Transaction_Envelope**: A base64-encoded XDR representation of an unsigned Stellar transaction, used as input to `simulateTransaction`.
- **Stroops**: The smallest unit of XLM (1 XLM = 10,000,000 stroops), used for all fee calculations.

## Requirements

### Requirement 1: Simulate Transaction via Soroban RPC

**User Story:** As a backend developer, I want a simulation service that wraps the Soroban RPC `simulateTransaction` call, so that the system can obtain raw fee data for any Nebula V2 operation.

#### Acceptance Criteria

1. WHEN a valid Transaction_Envelope is provided, THE Simulation_Service SHALL call the Soroban RPC `simulateTransaction` method and return the raw simulation result.
2. WHEN the Soroban RPC returns a successful simulation response, THE Simulation_Service SHALL extract the `minResourceFee` and `cost` fields from the response.
3. WHEN the Soroban RPC returns an error response, THE Simulation_Service SHALL return a structured error containing the RPC error code and message.
4. IF the Soroban RPC node is unreachable, THEN THE Simulation_Service SHALL return a connection error within 10 seconds.
5. THE Simulation_Service SHALL accept the target Soroban RPC URL as a configurable environment variable.

### Requirement 2: Apply Safety Buffer to Resource Fees

**User Story:** As a backend developer, I want the fee calculator to apply a 10% safety buffer to resource fee increments, so that submitted transactions are unlikely to fail with "Out of Resources" errors.

#### Acceptance Criteria

1. WHEN a raw resource fee increment is received from the simulation result, THE Fee_Calculator SHALL multiply the resource fee increment by 1.10 to produce the buffered resource fee.
2. THE Fee_Calculator SHALL round the buffered resource fee up to the nearest whole stroop.
3. WHEN the raw resource fee increment is zero, THE Fee_Calculator SHALL return zero as the buffered resource fee.
4. THE Fee_Calculator SHALL preserve the inclusion fee without modification.
5. THE Fee_Calculator SHALL compute the total estimated fee as the sum of the inclusion fee and the buffered resource fee.

### Requirement 3: Fee Estimate API Endpoint

**User Story:** As a frontend developer, I want a `GET /api/v2/fees/estimate` endpoint, so that the UI can display accurate cost estimates before a user signs and submits a transaction.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/v2/fees/estimate` with a valid `transaction_xdr` query parameter, THE Fee_API SHALL return a JSON response containing `inclusion_fee_stroops`, `resource_fee_stroops`, and `total_fee_stroops`.
2. WHEN the `transaction_xdr` query parameter is missing, THE Fee_API SHALL return a 400 Bad Request response with a descriptive error message.
3. WHEN the `transaction_xdr` query parameter contains an invalid or malformed XDR string, THE Fee_API SHALL return a 422 Unprocessable Entity response with a descriptive error message.
4. WHEN the downstream Soroban RPC simulation fails, THE Fee_API SHALL return a 502 Bad Gateway response with the upstream error details.
5. WHEN a valid estimate is returned, THE Fee_API SHALL include a `buffered` boolean field set to `true` to indicate the safety buffer has been applied.
6. THE Fee_API SHALL respond to valid requests within 15 seconds.
7. THE Fee_API SHALL return all fee values as non-negative integers in stroops.

### Requirement 4: Configuration and Environment

**User Story:** As a DevOps engineer, I want the service to be configurable via environment variables, so that it can be deployed against different Soroban RPC nodes (testnet, mainnet) without code changes.

#### Acceptance Criteria

1. THE Fee_API SHALL read the Soroban RPC endpoint URL from the `SOROBAN_RPC_URL` environment variable.
2. IF the `SOROBAN_RPC_URL` environment variable is not set at startup, THEN THE Fee_API SHALL log a configuration error and exit with a non-zero status code.
3. THE Fee_API SHALL read the server listen port from the `PORT` environment variable, defaulting to `3001` if not set.
4. WHERE a `CORS_ORIGIN` environment variable is set, THE Fee_API SHALL restrict cross-origin requests to the specified origin.

### Requirement 5: Error Handling and Observability

**User Story:** As a backend developer, I want consistent error responses and structured logging, so that issues can be diagnosed quickly in production.

#### Acceptance Criteria

1. THE Fee_API SHALL return all error responses as JSON objects with `error` and `message` fields.
2. WHEN a request is processed, THE Fee_API SHALL emit a structured log entry containing the request method, path, status code, and duration in milliseconds.
3. WHEN an unhandled exception occurs, THE Fee_API SHALL return a 500 Internal Server Error response and log the full stack trace.
4. THE Fee_API SHALL expose a `GET /health` endpoint that returns a 200 OK response with `{"status": "ok"}` when the service is running.
