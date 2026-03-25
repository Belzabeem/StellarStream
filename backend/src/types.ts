/** Mirrors the on-chain Stream struct (amounts in stroops as strings to avoid JS bigint issues). */
export interface Stream {
  id: string;           // numeric stream ID as string (e.g. "42")
  sender: string;       // Stellar address
  receiver: string;     // Stellar address
  token: string;        // token contract address
  totalAmount: string;  // stroops
  withdrawnAmount: string;
  startTime: number;    // unix seconds
  endTime: number;      // unix seconds
  cancelled: boolean;
  isPaused: boolean;
  createdAt: number;    // unix seconds (ledger timestamp of creation)
  txHash: string;
}

// ─── Cursor Pagination ────────────────────────────────────────────────────────

/**
 * Opaque cursor — base64-encoded JSON so clients treat it as a black box.
 * Internally: { id: string; createdAt: number }
 */
export type Cursor = string;

export interface CursorPayload {
  id: string;
  createdAt: number;
}

export interface PageInfo {
  /** Cursor pointing to the last item in this page — pass as `after` to get the next page. */
  nextCursor: Cursor | null;
  /** Cursor pointing to the first item in this page — pass as `before` to get the previous page. */
  prevCursor: Cursor | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface StreamPage {
  data: Stream[];
  pageInfo: PageInfo;
  total: number; // total matching records (for UI display, not for pagination logic)
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface StreamListQuery {
  /** Return streams created after this cursor (exclusive). Forward pagination. */
  after?: string;
  /** Return streams created before this cursor (exclusive). Backward pagination. */
  before?: string;
  /** Number of items to return. Capped at MAX_PAGE_SIZE. */
  limit?: number;
  /** Filter by sender address. */
  sender?: string;
  /** Filter by receiver address. */
  receiver?: string;
  /** Filter by status. */
  status?: "active" | "paused" | "cancelled" | "completed";
}
