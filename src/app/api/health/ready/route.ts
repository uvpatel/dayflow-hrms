import { checkDatabase } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabase();
  const ready = database.status === "up";

  return Response.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "dayflow-hrms",
      timestamp: new Date().toISOString(),
      dependencies: { database },
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": ready ? "0" : "5",
      },
    },
  );
}
