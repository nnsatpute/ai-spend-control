export type Provider = "CURSOR";

export type ConnectionStatus = "CONNECTED" | "ERROR";

/** Safe view of a connection: never includes the admin key. */
export type ConnectionSummary = {
  provider: Provider;
  status: ConnectionStatus;
  keyHint: string;
  memberCount: number;
  cycleStart: Date | null;
  lastSyncedAt: Date | null;
  lastError: string | null;
};
