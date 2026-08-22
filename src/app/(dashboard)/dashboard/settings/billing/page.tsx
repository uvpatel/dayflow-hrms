"use client";

import React, { useState } from "react";
import { PricingTable } from "@clerk/nextjs";
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Building2,
  Users,
  Receipt,
  Calendar,
  Lock,
  
  ArrowRight,
  HelpCircle,
  Download,
  AlertCircle,
  Check,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { SiteHeader } from "@/components/main/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading invoice ${invoiceId}...`);
  };

  const invoices = [
    {
      id: "INV-2026-008",
      date: "Aug 01, 2026",
      amount: "$199.00",
      plan: "Enterprise Scale (Monthly)",
      status: "Paid",
    },
    {
      id: "INV-2026-007",
      date: "Jul 01, 2026",
      amount: "$199.00",
      plan: "Enterprise Scale (Monthly)",
      status: "Paid",
    },
    {
      id: "INV-2026-006",
      date: "Jun 01, 2026",
      amount: "$199.00",
      plan: "Enterprise Scale (Monthly)",
      status: "Paid",
    },
  ];

  const faqs = [
    {
      question: "How does per-seat employee pricing work?",
      answer:
        "You are billed based on the number of active employee profiles in your Dayflow directory. Archived or deactivated employees do not count towards your seat limit.",
    },
    {
      question: "Can I upgrade or downgrade my subscription at any time?",
      answer:
        "Yes, you can upgrade or downgrade instantly. When upgrading, changes take effect immediately with prorated billing. Downgrades take effect at the end of the current billing cycle.",
    },
    {
      question: "What payment methods are supported?",
      answer:
        "We support all major credit/debit cards (Visa, Mastercard, American Express), SEPA direct debit, and ACH bank transfers for enterprise annual contracts.",
    },
    {
      question: "Can I get custom invoices with my company VAT/Tax ID?",
      answer:
        "Yes! You can add your company billing address, Tax ID, and custom invoice notes in your Clerk billing portal.",
    },
  ];

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-background">
      <SiteHeader title="Settings & Billing" />

      <div className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/dashboard/settings" className="hover:text-foreground transition-colors">
                Settings
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">Billing & Plans</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
              <CreditCard className="size-7 text-primary" />
              Plans & Billing
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your company subscription, seat allocation, payment details, and invoices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/settings/team">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Users className="size-4" />
                Team Settings
              </Button>
            </Link>
            <Link href="/dashboard/people">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Building2 className="size-4" />
                Directory
              </Button>
            </Link>
          </div>
        </div>

        {/* Current Active Subscription Banner */}
        <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-primary/10 via-card to-card p-6 md:p-8 shadow-xs">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 size-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-center">
            {/* Plan Info */}
            <div className="space-y-3 lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1 gap-1.5 shadow-xs">
                  <Sparkles className="size-3.5" />
                  Active Plan: Enterprise Scale
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 className="size-3 mr-1" />
                  Auto-Renewal Enabled
                </Badge>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                $199<span className="text-base font-normal text-muted-foreground">/month</span>
              </h2>

              <p className="text-sm text-muted-foreground max-w-xl">
                Your enterprise tier includes unlimited attendance regularization, payroll generation,
                multi-department shift scheduling, and priority SLA support.
              </p>

              {/* Usage Progress Bar */}
              <div className="space-y-1.5 pt-2 max-w-lg">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground">Seat Usage</span>
                  <span className="text-muted-foreground font-mono">48 / 100 Employees (48%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: "48%" }} />
                </div>
              </div>
            </div>

            {/* Quick Actions & Renewal Box */}
            <div className="flex flex-col gap-3 rounded-xl border bg-card/80 backdrop-blur-xs p-5 shadow-xs">
              <div className="text-xs text-muted-foreground">Next billing date</div>
              <div className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                September 01, 2026
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                <CreditCard className="size-3.5 text-muted-foreground" />
                <span>Billed to Visa ending in <strong>4242</strong></span>
              </div>
              <Separator className="my-1" />
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={() => toast.info("Opening payment details portal...")}
              >
                Update Payment Method
              </Button>
            </div>
          </div>
        </div>

        {/* Pricing & Plan Customization Section */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="outline" className="text-xs uppercase tracking-wider text-primary border-primary/30">
              Upgrade or Switch Plans
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Flexible tiers engineered for growing teams
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose the right plan to power your HRMS attendance, time off, and payroll workflows.
            </p>
          </div>

          {/* Clerk Pricing Table Container with Custom Design Tokens */}
          <div className="rounded-2xl border bg-card p-4 sm:p-6 lg:p-8 shadow-xs">
            <div className="clerk-pricing-wrapper">
              <PricingTable
                appearance={{
                  variables: {
                    colorPrimary: "var(--primary)",
                    colorBackground: "transparent",
                    colorNeutral: "var(--foreground)",
                    borderRadius: "0.875rem",
                    fontFamily: "inherit",
                  },
                  elements: {
                    pricingTable: "w-full",
                    pricingTableCard:
                      "border border-border/80 bg-card rounded-2xl shadow-xs hover:shadow-md transition-all p-6",
                    pricingTableCardHeader: "pb-4 border-b border-border/50",
                    pricingTableCardTitle: "text-xl font-bold text-foreground",
                    pricingTableCardDescription: "text-sm text-muted-foreground mt-1",
                    pricingTableCardPrice: "text-3xl font-extrabold text-foreground my-4",
                    pricingTableCardFeaturesList: "space-y-2.5 py-4",
                    pricingTableCardFeature: "text-sm text-muted-foreground flex items-center gap-2",
                    pricingTableCardButton:
                      "w-full rounded-xl font-medium shadow-xs transition-all h-10 text-sm",
                    pricingTableCardButton__highlighted:
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Invoices & Billing History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
                Billing History & Invoices
              </h3>
              <p className="text-sm text-muted-foreground">
                Download past statements and tax receipts for your accounting.
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Invoice</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Plan / Description</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-foreground">
                          {inv.id}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground tabular-nums">
                          {inv.date}
                        </td>
                        <td className="px-6 py-4 text-foreground font-medium">
                          {inv.plan}
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground tabular-nums">
                          {inv.amount}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400">
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
                            onClick={() => handleDownloadInvoice(inv.id)}
                          >
                            <Download className="size-3.5" />
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & FAQ Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="size-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Common questions about Dayflow billing and seat management.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="rounded-xl border bg-muted/20 p-3.5 space-y-1">
                  <h4 className="font-medium text-sm text-foreground">{faq.question}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Enterprise Support & Security Guarantee */}
          <div className="flex flex-col gap-6">
            <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-card to-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="size-5 text-amber-500" />
                  Need a Custom Enterprise Agreement?
                </CardTitle>
                <CardDescription>
                  For organizations with over 500+ employees requiring dedicated instance hosting, custom SSO, or SLA guarantees.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="size-4 text-emerald-500" />
                  <span>Custom Data Retention & Dedicated PostgreSQL instance</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="size-4 text-emerald-500" />
                  <span>Custom Biometric Attendance Hardware Integration</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="size-4 text-emerald-500" />
                  <span>Dedicated Customer Success Manager & 24/7 SLA</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full gap-2 shadow-sm"
                  onClick={() => toast.info("Our enterprise sales team will contact you shortly!")}
                >
                  Contact Enterprise Sales
                  <ArrowRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Bank-Grade 256-Bit Encryption</div>
                  <div className="text-xs text-muted-foreground">
                    All payment credentials are tokenized and securely handled via Clerk and Stripe.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
