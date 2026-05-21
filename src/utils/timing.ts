export async function measureAsync<T>(operation: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const startedAt = Date.now();
  const result = await operation();

  return {
    result,
    durationMs: Date.now() - startedAt,
  };
}
