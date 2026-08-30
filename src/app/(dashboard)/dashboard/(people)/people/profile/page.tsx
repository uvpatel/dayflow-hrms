"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useMe, useUpdateMe } from "@/hooks/use-me";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Mail, Phone, Shield, Calendar, Loader2, Save } from "lucide-react";
import { normalizeAccessRole } from "@/lib/permissions";

export default function UserProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const { data: me } = useMe();
  const updateMe = useUpdateMe();
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();

  const user = session?.user;
  const displayName = me?.employee
    ? `${me.employee.firstName} ${me.employee.lastName}`.trim()
    : user?.name ?? "";
  const displayPhone = phoneNumber ?? me?.employee?.phoneNumber ?? "";
  const accessRole =
    me?.accessRole ??
    normalizeAccessRole((user as { role?: string })?.role);
  const hasManagerPermissions = me?.employee?.role === "manager";
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayPhone.trim().length < 5) {
      toast.error("Enter a valid phone number");
      return;
    }

    try {
      await updateMe.mutateAsync({ phoneNumber: displayPhone.trim() });
      toast.success("Contact details saved successfully");
      setPhoneNumber(undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    }
  };

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col min-h-screen bg-background">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-background">

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
              <h2 className="text-lg font-semibold text-foreground truncate">{displayName || "User"}</h2>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Badge variant="outline" className="capitalize bg-primary/5 text-primary border-primary/20 gap-1 text-xs">
                <Shield className="size-3" />
                {accessRole}
              </Badge>
              {hasManagerPermissions ? (
                <Badge variant="secondary" className="text-xs">
                  Manager permissions
                </Badge>
              ) : null}
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
                      value={displayName}
                      readOnly
                      disabled
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Name changes are managed by HR.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber" className="text-xs font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      className="pl-9 text-sm"
                      value={displayPhone}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="Your phone number"
                      disabled={updateMe.isPending}
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
                    Access Role
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="roleDisplay"
                      className="pl-9 text-sm bg-muted/40 capitalize"
                      value={accessRole}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button type="submit" size="sm" className="gap-1.5 text-xs" disabled={updateMe.isPending}>
                  {updateMe.isPending ? (
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
