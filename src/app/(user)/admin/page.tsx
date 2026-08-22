import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { ilike, or, desc } from "drizzle-orm";
import { SearchUsers } from "./SearchUsers";
import { removeRole, setRole } from "./_actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, User as UserIcon } from "lucide-react";

type AdminDashboardProps = {
  searchParams: Promise<{
    search?: string | string[] | undefined;
  }>;
};

export default async function AdminDashboard({
  searchParams,
}: AdminDashboardProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { search } = await searchParams;
  const query =
    typeof search === "string"
      ? search.trim()
      : Array.isArray(search)
      ? search[0]?.trim()
      : undefined;

  const usersList = query
    ? await db
        .select()
        .from(user)
        .where(
          or(
            ilike(user.name, `%${query}%`),
            ilike(user.email, `%${query}%`)
          )
        )
        .limit(20)
    : await db
        .select()
        .from(user)
        .orderBy(desc(user.createdAt))
        .limit(20);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="size-6 text-primary" />
          Admin User Management
        </h1>
        <p className="text-sm text-muted-foreground">
          View all registered users stored in Neon PostgreSQL and manage role permissions.
        </p>
      </div>

      <SearchUsers />

      {usersList.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {query ? `No users found matching "${query}".` : "No registered users in the database yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {usersList.map((u) => {
            return (
              <Card key={u.id} className="overflow-hidden">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <UserIcon className="size-4 text-muted-foreground" />
                      {u.name || "Unnamed user"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {u.email}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : u.role === "moderator"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {u.role || "user"}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0 flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-6 py-3">
                  <div className="text-xs text-muted-foreground">
                    Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={setRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="role" value="admin" />
                      <Button
                        type="submit"
                        size="sm"
                        variant={u.role === "admin" ? "secondary" : "default"}
                        disabled={u.role === "admin"}
                        className="text-xs h-8"
                      >
                        Make Admin
                      </Button>
                    </form>

                    <form action={setRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="role" value="moderator" />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={u.role === "moderator"}
                        className="text-xs h-8"
                      >
                        Make Moderator
                      </Button>
                    </form>

                    <form action={removeRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        disabled={u.role === "user" || !u.role}
                        className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Remove Role
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
