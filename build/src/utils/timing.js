export async function measureAsync(operation) {
    const startedAt = Date.now();
    const result = await operation();
    return {
        result,
        durationMs: Date.now() - startedAt,
    };
}
//# sourceMappingURL=timing.js.map