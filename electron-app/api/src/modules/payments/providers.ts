// -----------------------------------------------------------------------------
// Payment provider abstraction (spec §37 — never hard-code one provider).
//
// The platform exposes one payment contract (initiate + confirm) and keeps a
// registry of providers. Only the SIMULATED provider ships in this build — a
// test/demo provider that is ALWAYS clearly labeled and never touches real
// money. Real MOMO / card providers plug in behind the same contract with
// their own initiate/confirm implementations and env configuration (the
// integrations-engine pattern: unconfigured ⇒ listed but not usable).
//
// The provider list endpoint is truthful: a provider only appears as usable
// when it is configured, and the simulated provider states its test-only
// nature in every response.
// -----------------------------------------------------------------------------

export interface PaymentProviderInfo {
  id: string;
  name: string;
  /** What this provider is for (MOMO / CARD / TEST). */
  kind: 'MOMO' | 'CARD' | 'TEST';
  configured: boolean;
  /** Human-facing note — the simulated provider must always say it is fake. */
  note: string;
}

export interface InitiateResult {
  providerRef: string;
  /** Where the payer completes the payment (hosted checkout / deep link). */
  checkoutUrl: string | null;
  /** Provider instructions for the payer, e.g. "Dial *170# and enter the ref". */
  instructions: string | null;
}

export interface PaymentProvider {
  info: PaymentProviderInfo;
  initiate: (amount: number, ref: string) => Promise<InitiateResult>;
  /**
   * Confirm a payment ref. Returns the status the platform should record.
   * A real provider implementation would poll its API or be driven by its
   * webhook; the simulated provider derives a deterministic outcome so the
   * whole flow is testable without real money.
   */
  confirm: (providerRef: string) => Promise<{ status: 'SUCCESS' | 'FAILED'; error?: string }>;
}

/** Deterministic test provider: SUCCESS unless the amount contains "FAIL". */
const simulated: PaymentProvider = {
  info: {
    id: 'SIMULATED',
    name: 'Simulated payment (test only)',
    kind: 'TEST',
    configured: true,
    note: 'SIMULATED — test/demo only, never processes real money.',
  },
  initiate: async (amount, ref) => ({
    providerRef: `SIM-${ref.slice(0, 12)}-${String(Math.round(amount))}`,
    checkoutUrl: null,
    instructions: `Simulated checkout — confirm via POST /payments/webhook/simulated (test only, no real money).`,
  }),
  confirm: async (providerRef) => {
    if (/FAIL/.test(providerRef)) return { status: 'FAILED', error: 'Simulated rejection (test) — the ref contains FAIL.' };
    return { status: 'SUCCESS' };
  },
};

const REGISTRY: Record<string, PaymentProvider> = {
  SIMULATED: simulated,
  // Real providers plug in here with env-gated configuration, e.g.:
  // MOMO:   { info: { id: 'MOMO', kind: 'MOMO', configured: Boolean(process.env.PAYMENT_MOMO_URL), ... }, ... },
};

/** The provider a confirmation webhook should resolve to (by provider id). */
export function getProvider(id: string): PaymentProvider | undefined {
  const key = id.toUpperCase();
  return REGISTRY[key];
}

export function listProviders(): PaymentProviderInfo[] {
  return Object.values(REGISTRY).map((p) => p.info);
}
