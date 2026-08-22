import { redirect } from "next/navigation";

export default function OrganizationHolidaysPage() {
  redirect("/dashboard/organization?tab=holidays");
}
