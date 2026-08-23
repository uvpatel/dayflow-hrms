import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { employees } from "@/db/schema/employees";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import SearchUsers from "./SearchUser";
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

import { requirePageAuthContext } from "@/lib/auth/page";

export default async function AdminDashboard({
  searchParams,
}: AdminDashboardProps) {
  const ctx = await requirePageAuthContext(await headers());

  if (ctx.role !== "admin") {
    redirect("/dashboard");
  }

  if (ctx.organizationId == null) {
    redirect("/auth/access-denied?reason=employee_profile_required");
  }

  const { search } = await searchParams;
  const query =
    typeof search === "string"
      ? search.trim()
      : Array.isArray(search)
      ? search[0]?.trim()
      : undefined;

  const organizationMember = and(
    eq(employees.userId, user.id),
    eq(employees.organizationId, ctx.organizationId),
  );
  const selectedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: employees.role,
    createdAt: user.createdAt,
  };
  const usersList = query
    ? await db
        .select(selectedUser)
        .from(user)
        .innerJoin(employees, organizationMember)
        .where(
          or(
            ilike(user.name, `%${query}%`),
            ilike(user.email, `%${query}%`)
          )
        )
        .limit(20)
    : await db
        .select(selectedUser)
        .from(user)
        .innerJoin(employees, organizationMember)
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
                        : u.role === "hr"
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
                      <input type="hidden" name="role" value="hr" />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={u.role === "hr"}
                        className="text-xs h-8"
                      >
                        Make HR
                      </Button>
                    </form>

                    <form action={setRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="role" value="manager" />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={u.role === "manager"}
                        className="text-xs h-8"
                      >
                        Make Manager
                      </Button>
                    </form>

                    <form action={removeRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        disabled={u.role === "employee"}
                        className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Make Employee
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
