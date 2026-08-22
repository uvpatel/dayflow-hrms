"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-8">
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <h1 className="font-semibold">This dashboard view could not be loaded</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Retry the request. If it continues, return to the dashboard overview.
              </p>
            </div>
          </div>
          <Button onClick={reset} variant="outline">
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
