import { redirect } from "next/navigation";

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  redirect(`/dashboard/people/${encodeURIComponent(employeeId)}`);
}
