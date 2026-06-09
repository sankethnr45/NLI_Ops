/**
 * Custom logger abstraction to avoid tight coupling with a specific logging library.
 * It enforces structured metadata across all logging calls.
 */
export declare const logger: {
    info: (message: string, metadata?: Record<string, unknown>) => void;
    warn: (message: string, metadata?: Record<string, unknown>) => void;
    error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => void;
    debug: (message: string, metadata?: Record<string, unknown>) => void;
};
//# sourceMappingURL=logger.d.ts.map