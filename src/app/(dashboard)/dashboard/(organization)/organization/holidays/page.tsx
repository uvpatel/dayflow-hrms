"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Holiday {
  id: number;
  name: string;
  description?: string | null;
  holidayDate: string;
}

export default function HolidayPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/holidays");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          setHolidays(result.data || []);
        } else {
          setError(result.error || "Failed to fetch holidays");
        }
      } catch (err) {
        console.error("Error fetching holidays:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-background">
      <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="size-7 text-primary" />
            Company Holidays
          </h1>
          <p className="text-sm text-muted-foreground">
            Official organization holidays and observance dates.
          </p>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading holidays...</p>}
        {error && <p className="text-sm text-destructive">Error: {error}</p>}

        {!loading && !error && holidays.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No upcoming company holidays scheduled.
            </CardContent>
          </Card>
        )}

        {!loading && !error && holidays.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {holidays.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Holiday
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {new Date(item.holidayDate).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                {item.description && (
                  <CardContent className="pt-0 text-xs text-muted-foreground">
                    {item.description}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
