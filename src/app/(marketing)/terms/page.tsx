import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Dayflow",
  description: "Terms governing use of the Dayflow HR management system.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 sm:py-24">
      <div className="space-y-3">
        <Link
          href="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to Dayflow
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground">Last updated August 22, 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Authorized use</h2>
          <p>
            Dayflow is an organization-managed HR system. Use is limited to
            people provisioned by their employer and to the permissions assigned
            to their account.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Account security</h2>
          <p>
            Users must protect their credentials, keep profile information
            accurate, and promptly report suspected unauthorized access to their
            organization administrator.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">HR records</h2>
          <p>
            Attendance, leave, payroll, and employee records remain subject to
            the policies and legal obligations of the organization operating
            this deployment. The organization is responsible for configuring
            retention, payroll, and employment rules for its jurisdiction.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Availability</h2>
          <p>
            Access may be suspended for security, maintenance, policy violations,
            or when employment or organizational access ends.
          </p>
        </section>
      </div>
    </main>
  );
}
