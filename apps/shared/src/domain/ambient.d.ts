/** Minimal ambient timer types so the pure logic layer can typecheck without DOM/node libs. */
declare function setTimeout(handler: () => void, timeout?: number): unknown;
declare function clearTimeout(handle: unknown): void;

/** Minimal ambient `process` (guarded at runtime) for env-based source resolution. */
declare const process: { env?: Record<string, string | undefined> } | undefined;
