import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { SearchUsers } from "./SearchUsers"
import { removeRole, setRole } from "./_actions"

type AdminDashboardProps = {
  searchParams: Promise<{
    search?: string | string[] | undefined
  }>
}

export default async function AdminDashboard({
  searchParams,
}: AdminDashboardProps) {
  const { sessionClaims, userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

//   if (sessionClaims?.metadata?.role !== "admin") {
//     redirect("/")
//   }


  const { search } = await searchParams
  const query = typeof search === 'string' ? search.trim() : Array.isArray(search) ? search[0]?.trim() : undefined


  const client = await clerkClient()

  const { data: users } = query
    ? await client.users.getUserList({
        query,
        limit: 20,
      })
    : { data: [] }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <SearchUsers />

      {!query && (
        <p className="text-sm text-muted-foreground">
          Search for a user by name or email.
        </p>
      )}

      {query && users.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No users found.
        </p>
      )}

      <div className="space-y-4">
        {users.map((user) => {
          const primaryEmail = user.emailAddresses.find(
            (email) => email.id === user.primaryEmailAddressId
          )?.emailAddress

          return (
            <article
              key={user.id}
              className="flex flex-col gap-4 rounded-lg border p-4"
            >
              <div>
                <h2 className="font-medium">
                  {[user.firstName, user.lastName]
                    .filter(Boolean)
                    .join(" ") || "Unnamed user"}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {primaryEmail ?? "No primary email"}
                </p>

                <p className="mt-1 text-sm">
                  Role: {user.publicMetadata.role?.toString() ?? "No role"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <form action={setRole}>
                  <input type="hidden" name="id" value={user.id} />
                  <input type="hidden" name="role" value="admin" />

                  <button
                    type="submit"
                    className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                  >
                    Make Admin
                  </button>
                </form>

                <form action={setRole}>
                  <input type="hidden" name="id" value={user.id} />
                  <input type="hidden" name="role" value="moderator" />

                  <button
                    type="submit"
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    Make Moderator
                  </button>
                </form>

                <form action={removeRole}>
                  <input type="hidden" name="id" value={user.id} />

                  <button
                    type="submit"
                    className="rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground"
                  >
                    Remove Role
                  </button>
                </form>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}