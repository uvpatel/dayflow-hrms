import { describe, expect, test } from "bun:test";

const CANONICAL_HANDLER = "src/app/api/auth/[...all]/route.ts";

async function sourceRouteFiles(): Promise<string[]> {
  const routes: string[] = [];
  const glob = new Bun.Glob("src/app/**/route.ts");

  for await (const path of glob.scan({ cwd: process.cwd(), onlyFiles: true })) {
    routes.push(path);
  }

  return routes.sort();
}

describe("Better Auth route ownership", () => {
  test("has exactly one canonical Next.js handler", async () => {
    const routeFiles = await sourceRouteFiles();
    const handlerFiles: string[] = [];

    for (const routeFile of routeFiles) {
      const source = await Bun.file(routeFile).text();
      if (source.includes("toNextJsHandler(")) handlerFiles.push(routeFile);
    }

    expect(handlerFiles).toEqual([CANONICAL_HANDLER]);

    const handlerSource = await Bun.file(CANONICAL_HANDLER).text();
    expect(handlerSource).toContain(
      "export const { GET, POST } = toNextJsHandler(auth);",
    );
  });

  test("keeps the Better Auth namespace free of business APIs", async () => {
    const routeFiles = await sourceRouteFiles();
    const authNamespaceRoutes = routeFiles.filter((path) =>
      path.startsWith("src/app/api/auth/"),
    );

    expect(authNamespaceRoutes).toEqual([CANONICAL_HANDLER]);
  });
});
