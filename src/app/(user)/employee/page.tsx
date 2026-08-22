import { redirect } from "next/navigation";

export default function EmployeePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Employee Page</h1>
      <p className="text-center text-muted-foreground">
        This is the employee page. You can add your content here.
      </p>
    </div>
  )
}
