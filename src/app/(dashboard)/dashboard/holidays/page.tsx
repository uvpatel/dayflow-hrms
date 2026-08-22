import { redirect } from "next/navigation";

export default function HolidaysPage() {
  redirect("/dashboard/organization?tab=holidays");
}
