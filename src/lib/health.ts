import "server-only";

const DEFAULT_TIMEOUT_MS = 3_000;

export type DependencyHealth = {
  status: "up" | "down";
  latencyMs: number;
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Health check timed out")),
      timeoutMs,
    );

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export async function checkDatabase(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<DependencyHealth> {
  const startedAt = performance.now();

  try {
    const { sql } = await import("@/db");
    await withTimeout(sql`select 1 as healthy`, timeoutMs);

    return {
      status: "up",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return {
      status: "down",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}
