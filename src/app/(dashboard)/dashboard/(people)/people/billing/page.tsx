"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Shield } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Essential HR & attendance tracking for small teams.",
    features: [
      "Up to 25 Employees",
      "Daily Attendance Check-in/out",
      "Basic Leave Management",
      "Standard Email Support",
    ],
    highlighted: false,
    cta: "Get Started",
  },
  {
    name: "Growth",
    price: "$89",
    period: "/month",
    description: "Comprehensive management for scaling companies.",
    features: [
      "Up to 100 Employees",
      "Automated Payroll Calculation",
      "Leave & Approval Workflows",
      "Attendance Regularization",
      "Priority Support (24h SLA)",
    ],
    highlighted: true,
    badge: "Most Popular",
    cta: "Upgrade to Growth",
  },
  {
    name: "Enterprise Scale",
    price: "$199",
    period: "/month",
    description: "Dedicated resources, custom integrations, and SLA.",
    features: [
      "Unlimited Employees",
      "Custom Salary Structures & Payslips",
      "Multi-Department Shift Scheduling",
      "Dedicated PostgreSQL Instance",
      "24/7 Dedicated Account Manager",
    ],
    highlighted: false,
    cta: "Contact Sales",
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col min-h-screen bg-background">
      <div className="flex flex-1 flex-col gap-8 p-6 md:p-10 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-xs uppercase tracking-wider text-primary border-primary/30">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Choose the right plan for your organization
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Scale your workforce operations with full attendance automation, leave management, and automated payroll.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col justify-between relative transition-all duration-200 hover:shadow-lg ${
                plan.highlighted
                  ? "border-primary shadow-md bg-linear-to-b from-primary/5 via-card to-card"
                  : "border-border/80"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5 shadow-sm">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center justify-between">
                  {plan.name}
                  {plan.highlighted && <Sparkles className="size-5 text-primary" />}
                </CardTitle>
                <CardDescription className="text-xs min-h-[32px] pt-1">
                  {plan.description}
                </CardDescription>
                <div className="pt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 py-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Included Features
                </div>
                <ul className="space-y-2 text-xs">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-foreground">
                      <Check className="size-3.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  className="w-full text-sm font-medium"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => toast.success(`Selected ${plan.name} plan`)}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
