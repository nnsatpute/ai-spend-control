/** One person's spend in the current provider billing cycle, as reported by the provider. */
export type ProviderMemberSpend = {
  providerUserId: string | null;
  email: string;
  name: string | null;
  role: string | null;
  /** On-demand spend (beyond included usage), fractional cents as a decimal string. */
  spendCents: string;
  /** Total spend including included usage, fractional cents as a decimal string. */
  overallSpendCents: string;
  premiumRequests: number;
  /** Currently enforced per-user cap in cents, or null when uncapped. */
  effectiveLimitCents: string | null;
};

export type ProviderSpendReport = {
  cycleStart: Date;
  members: ProviderMemberSpend[];
};

export type PersonSpendRow = {
  personId: string;
  email: string;
  name: string | null;
  spendCents: string;
  overallSpendCents: string;
  premiumRequests: number;
  effectiveLimitCents: string | null;
};

export type SpendSummary = {
  peopleCount: number;
  totalSpendCents: string;
  totalOverallSpendCents: string;
  /** People with any on-demand spend this cycle. */
  spendingPeopleCount: number;
  /** Share of on-demand spend from the top 3 spenders, 0–1, or null when there is no spend. */
  top3Share: number | null;
  /** People at or above their provider cap. */
  atLimitCount: number;
};
