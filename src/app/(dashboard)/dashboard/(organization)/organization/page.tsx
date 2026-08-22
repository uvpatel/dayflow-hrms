"use client";

import React, { useState } from "react";
import {
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Plus,
  RefreshCw,
  Search,
  Users,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useDepartments,
  useDesignations,
  useLocations,
  useHolidays,
  useCreateDepartment,
  useCreateDesignation,
  useCreateLocation,
  useCreateHoliday,
} from "@/hooks/use-organization";

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState("departments");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog open states
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isDesigOpen, setIsDesigOpen] = useState(false);
  const [isLocOpen, setIsLocOpen] = useState(false);
  const [isHolidayOpen, setIsHolidayOpen] = useState(false);

  // Form states
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [desigName, setDesigName] = useState("");
  const [desigDeptId, setDesigDeptId] = useState<number | undefined>();
  const [locName, setLocName] = useState("");
  const [locCity, setLocCity] = useState("");
  const [locCountry, setLocCountry] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayDesc, setHolidayDesc] = useState("");

  const { data: departments = [], isLoading: deptsLoading, refetch: refetchDepts } = useDepartments();
  const { data: designations = [], isLoading: desigsLoading, refetch: refetchDesigs } = useDesignations();
  const { data: locations = [], isLoading: locsLoading, refetch: refetchLocs } = useLocations();
  const { data: holidays = [], isLoading: holidaysLoading, refetch: refetchHolidays } = useHolidays();

  const createDeptMutation = useCreateDepartment();
  const createDesigMutation = useCreateDesignation();
  const createLocMutation = useCreateLocation();
  const createHolidayMutation = useCreateHoliday();

  const handleRefresh = () => {
    refetchDepts();
    refetchDesigs();
    refetchLocs();
    refetchHolidays();
    toast.success("Organization structure synchronized");
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDeptMutation.mutateAsync({ name: deptName, description: deptDesc });
      toast.success(`Department "${deptName}" created!`);
      setIsDeptOpen(false);
      setDeptName("");
      setDeptDesc("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create department";
      toast.error(errorMsg);
    }
  };

  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDesigMutation.mutateAsync({ name: desigName, departmentId: desigDeptId });
      toast.success(`Designation "${desigName}" created!`);
      setIsDesigOpen(false);
      setDesigName("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create designation";
      toast.error(errorMsg);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLocMutation.mutateAsync({ name: locName, city: locCity, country: locCountry });
      toast.success(`Office location "${locName}" created!`);
      setIsLocOpen(false);
      setLocName("");
      setLocCity("");
      setLocCountry("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create location";
      toast.error(errorMsg);
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHolidayMutation.mutateAsync({
        name: holidayName,
        holidayDate: new Date(holidayDate),
        description: holidayDesc,
      });
      toast.success(`Holiday "${holidayName}" added!`);
      setIsHolidayOpen(false);
      setHolidayName("");
      setHolidayDate("");
      setHolidayDesc("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create holiday";
      toast.error(errorMsg);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDesigs = designations.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredLocs = locations.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.city && l.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredHolidays = holidays.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <Building2 className="size-7 text-primary" />
            Organization &amp; Workforce Structure
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure enterprise departments, job designations, global branch offices, and holiday schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Departments</CardDescription>
            <Building className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground pt-1">Active business units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Job Designations</CardDescription>
            <Briefcase className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{designations.length}</div>
            <p className="text-xs text-muted-foreground pt-1">Standardized roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Locations &amp; Hubs</CardDescription>
            <MapPin className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground pt-1">Workplace campuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Company Holidays</CardDescription>
            <Calendar className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holidays.length}</div>
            <p className="text-xs text-muted-foreground pt-1">Scheduled for this year</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-4">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="designations">Designations</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {activeTab === "departments" && (
              <Dialog open={isDeptOpen} onOpenChange={setIsDeptOpen}>
                <DialogTrigger render={<Button size="sm" className="gap-1.5 bg-primary text-primary-foreground" />}>
                    <Plus className="size-4" />
                    Add Dept
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateDepartment}>
                    <DialogHeader>
                      <DialogTitle>Add Department</DialogTitle>
                      <DialogDescription>Create a new functional department.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="dName">Department Name</Label>
                        <Input
                          id="dName"
                          placeholder="e.g. Legal & Compliance"
                          value={deptName}
                          onChange={(e) => setDeptName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dDesc">Description</Label>
                        <Input
                          id="dDesc"
                          placeholder="Team mission or scope"
                          value={deptDesc}
                          onChange={(e) => setDeptDesc(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDeptOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createDeptMutation.isPending}>
                        Save Department
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === "designations" && (
              <Dialog open={isDesigOpen} onOpenChange={setIsDesigOpen}>
                <DialogTrigger render={<Button size="sm" className="gap-1.5 bg-primary text-primary-foreground" />}>
                    <Plus className="size-4" />
                    Add Role
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateDesignation}>
                    <DialogHeader>
                      <DialogTitle>Add Job Designation</DialogTitle>
                      <DialogDescription>Add a title to standard job ladder.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="desName">Designation Title</Label>
                        <Input
                          id="desName"
                          placeholder="e.g. Staff Platform Architect"
                          value={desigName}
                          onChange={(e) => setDesigName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDesigOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createDesigMutation.isPending}>
                        Save Designation
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === "locations" && (
              <Dialog open={isLocOpen} onOpenChange={setIsLocOpen}>
                <DialogTrigger render={<Button size="sm" className="gap-1.5 bg-primary text-primary-foreground" />}>
                    <Plus className="size-4" />
                    Add Location
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateLocation}>
                    <DialogHeader>
                      <DialogTitle>Add Office Location</DialogTitle>
                      <DialogDescription>Register a new company office or hub.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="lName">Campus / Office Name</Label>
                        <Input
                          id="lName"
                          placeholder="e.g. Austin Innovation Center"
                          value={locName}
                          onChange={(e) => setLocName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="lCity">City</Label>
                          <Input
                            id="lCity"
                            placeholder="Austin"
                            value={locCity}
                            onChange={(e) => setLocCity(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lCountry">Country</Label>
                          <Input
                            id="lCountry"
                            placeholder="USA"
                            value={locCountry}
                            onChange={(e) => setLocCountry(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsLocOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createLocMutation.isPending}>
                        Save Location
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === "holidays" && (
              <Dialog open={isHolidayOpen} onOpenChange={setIsHolidayOpen}>
                <DialogTrigger render={<Button size="sm" className="gap-1.5 bg-primary text-primary-foreground" />}>
                    <Plus className="size-4" />
                    Add Holiday
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateHoliday}>
                    <DialogHeader>
                      <DialogTitle>Add Company Holiday</DialogTitle>
                      <DialogDescription>Schedule paid non-working company observance.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="hName">Holiday Name</Label>
                        <Input
                          id="hName"
                          placeholder="e.g. New Year Holiday"
                          value={holidayName}
                          onChange={(e) => setHolidayName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hDate">Holiday Date</Label>
                        <Input
                          id="hDate"
                          type="date"
                          value={holidayDate}
                          onChange={(e) => setHolidayDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hDesc">Description</Label>
                        <Input
                          id="hDesc"
                          placeholder="Public / Federal holiday"
                          value={holidayDesc}
                          onChange={(e) => setHolidayDesc(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsHolidayOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createHolidayMutation.isPending}>
                        Save Holiday
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Loading departments...
                      </TableCell>
                    </TableRow>
                  ) : filteredDepts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No departments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDepts.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium text-foreground">{d.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.description || "Operational unit"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "Active"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Designations Tab */}
        <TabsContent value="designations">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Designation Title</TableHead>
                    <TableHead>Department ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {desigsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Loading designations...
                      </TableCell>
                    </TableRow>
                  ) : filteredDesigs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No designations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDesigs.map((des) => (
                      <TableRow key={des.id}>
                        <TableCell className="font-medium text-foreground">{des.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {departments.find((dept) => dept.id === des.departmentId)?.name ?? "Organization-wide"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {des.createdAt ? new Date(des.createdAt).toLocaleDateString() : "Active"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location / Campus</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Loading locations...
                      </TableCell>
                    </TableRow>
                  ) : filteredLocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No locations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLocs.map((loc) => (
                      <TableRow key={loc.id}>
                        <TableCell className="font-medium text-foreground">{loc.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{loc.city || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{loc.country || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Active Hub</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays Tab */}
        <TabsContent value="holidays">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holiday</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidaysLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Loading holidays...
                      </TableCell>
                    </TableRow>
                  ) : filteredHolidays.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No holidays found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHolidays.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium text-foreground">{h.name}</TableCell>
                        <TableCell className="text-sm font-semibold tabular-nums text-primary">
                          {h.holidayDate ? new Date(h.holidayDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{h.description || "Company Holiday"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700">Official</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
