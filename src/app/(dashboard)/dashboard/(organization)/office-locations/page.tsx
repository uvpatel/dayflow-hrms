import { redirect } from "next/navigation";

export default function OfficeLocationsPage() {
  redirect("/dashboard/organization?tab=locations");
}
