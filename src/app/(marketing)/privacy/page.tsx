import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Dayflow",
  description: "How Dayflow handles employee and organization information.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 sm:py-24">
      <div className="space-y-3">
        <Link
          href="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to Dayflow
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated August 22, 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Information processed</h2>
          <p>
            Dayflow processes account, employee profile, attendance, leave,
            payroll, notification, and audit information supplied by users and
            their organization.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Purpose and access</h2>
          <p>
            Information is used to operate HR workflows and is exposed only to
            authenticated users whose assigned role and reporting relationship
            permit access. Payroll and other sensitive records receive additional
            access restrictions.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Retention and disclosure</h2>
          <p>
            The organization operating this deployment controls retention and
            lawful disclosure. It should configure infrastructure, email, database,
            backups, and audit retention according to applicable policy and law.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Requests</h2>
          <p>
            Employees should contact their HR or organization administrator to
            request access, correction, export, or deletion where applicable.
          </p>
        </section>
      </div>
    </main>
  );
}
