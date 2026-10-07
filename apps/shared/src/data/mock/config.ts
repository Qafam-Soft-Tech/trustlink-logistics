/** Central mock latency — the ONLY place artificial latency is allowed. */
export const mockConfig = {
  latencyMs: 400,
};

export function setMockLatency(ms: number): void {
  mockConfig.latencyMs = ms;
}
