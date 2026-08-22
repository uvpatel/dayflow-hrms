"use client";

import React, { useState, useEffect } from "react";
import { SiteHeader } from "@/components/main/site-header";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Mail, Shield, Calendar, Loader2, Save } from "lucide-react";

export default function UserProfilePage() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [name, setName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  const user = session?.user;
  const userRole = (user as { role?: string })?.role || "user";
  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Profile details saved successfully");
        refetch();
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col min-h-screen bg-background">
        <SiteHeader title="User Profile" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-background">
      <SiteHeader title="User Profile" />

      <div className="flex flex-1 flex-col gap-6 p-6 md:p-10 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Account Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal details, account credentials, and organizational role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="md:col-span-1 flex flex-col items-center text-center p-6 space-y-4">
            <Avatar className="size-24 text-2xl font-bold">
              <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>

            <div className="space-y-1 w-full">
              <h2 className="text-lg font-semibold text-foreground truncate">{user?.name || "User"}</h2>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Badge variant="outline" className="capitalize bg-primary/5 text-primary border-primary/20 gap-1 text-xs">
                <Shield className="size-3" />
                {userRole}
              </Badge>
              {user?.emailVerified && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                  Verified
                </Badge>
              )}
            </div>

            <div className="w-full border-t pt-4 text-left text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5" />
                <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}</span>
              </div>
            </div>
          </Card>

          {/* Edit Details Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription className="text-xs">
                Update your contact and display information across Dayflow.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-xs font-medium">
                    Display Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      className="pl-9 text-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      disabled={isUpdating}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emailAddress" className="text-xs font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="emailAddress"
                      className="pl-9 text-sm bg-muted/40"
                      value={user?.email || ""}
                      readOnly
                      disabled
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Email address is managed through authentication credentials.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="roleDisplay" className="text-xs font-medium">
                    System Role
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="roleDisplay"
                      className="pl-9 text-sm bg-muted/40 capitalize"
                      value={userRole}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button type="submit" size="sm" className="gap-1.5 text-xs" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
