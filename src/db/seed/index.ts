import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/db";
import {
  organizations,
  departments,
  designations,
  locations,
  workSchedules,
  holidays,
  user,
  account,
  employees,
  leaveTypes,
  leaveAllocations,
  leaveRequests,
  attendances,
  salaryStructures,
  salaryComponents,
  payrollPeriods,
  payslips,
  notifications,
  activityLogs,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
  console.log("🌱 Starting Dayflow HRMS Idempotent Seed...");

  // 1. Organization
  console.log("🏢 Seeding organization...");
  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "dayflow"))
    .limit(1);

  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({
        name: "Dayflow Technologies",
        slug: "dayflow",
        description: "Enterprise HRMS Cloud Solutions",
      })
      .returning();
  }

  // 2. Locations
  console.log("📍 Seeding locations...");
  const locData = [
    { name: "San Francisco HQ", address: "100 Market St, Suite 400", city: "San Francisco", state: "CA", country: "USA", postalCode: "94105", organizationId: org.id },
    { name: "New York Tech Hub", address: "350 5th Ave, Floor 22", city: "New York", state: "NY", country: "USA", postalCode: "10118", organizationId: org.id },
  ];
  const seededLocations: { id: number; name: string }[] = [];
  for (const loc of locData) {
    let [existing] = await db.select().from(locations).where(eq(locations.name, loc.name)).limit(1);
    if (!existing) {
      [existing] = await db.insert(locations).values(loc).returning();
    }
    seededLocations.push(existing);
  }

  // 3. Departments
  console.log("🏛️  Seeding departments...");
  const deptData = [
    { name: "Engineering", description: "Software development and infrastructure", organizationId: org.id },
    { name: "Product & Design", description: "Product strategy and UI/UX design", organizationId: org.id },
    { name: "Human Resources", description: "People operations, talent, and compliance", organizationId: org.id },
    { name: "Operations", description: "Business operations and logistics", organizationId: org.id },
    { name: "Marketing", description: "Brand, growth, and customer outreach", organizationId: org.id },
  ];
  const seededDepts: { id: number; name: string }[] = [];
  for (const d of deptData) {
    let [existing] = await db.select().from(departments).where(eq(departments.name, d.name)).limit(1);
    if (!existing) {
      [existing] = await db.insert(departments).values(d).returning();
    }
    seededDepts.push(existing);
  }

  // 4. Designations
  console.log("💼 Seeding designations...");
  const desigData = [
    { name: "Senior Software Engineer", departmentId: seededDepts[0].id, organizationId: org.id },
    { name: "Full Stack Developer", departmentId: seededDepts[0].id, organizationId: org.id },
    { name: "Frontend Engineer", departmentId: seededDepts[0].id, organizationId: org.id },
    { name: "UI/UX Designer", departmentId: seededDepts[1].id, organizationId: org.id },
    { name: "Product Manager", departmentId: seededDepts[1].id, organizationId: org.id },
    { name: "HR Specialist", departmentId: seededDepts[2].id, organizationId: org.id },
    { name: "People Partner", departmentId: seededDepts[2].id, organizationId: org.id },
    { name: "Operations Lead", departmentId: seededDepts[3].id, organizationId: org.id },
    { name: "Growth Specialist", departmentId: seededDepts[4].id, organizationId: org.id },
  ];
  const seededDesigs: { id: number; name: string }[] = [];
  for (const des of desigData) {
    let [existing] = await db.select().from(designations).where(eq(designations.name, des.name)).limit(1);
    if (!existing) {
      [existing] = await db.insert(designations).values(des).returning();
    }
    seededDesigs.push(existing);
  }

  // 5. Holidays
  console.log("🎉 Seeding company holidays...");
  const holidayData = [
    { name: "New Year's Day", holidayDate: new Date("2026-01-01"), description: "Public holiday", organizationId: org.id },
    { name: "Memorial Day", holidayDate: new Date("2026-05-25"), description: "Federal holiday", organizationId: org.id },
    { name: "Independence Day", holidayDate: new Date("2026-07-04"), description: "National holiday", organizationId: org.id },
    { name: "Labor Day", holidayDate: new Date("2026-09-07"), description: "Federal holiday", organizationId: org.id },
    { name: "Thanksgiving Day", holidayDate: new Date("2026-11-26"), description: "National holiday", organizationId: org.id },
    { name: "Christmas Day", holidayDate: new Date("2026-12-25"), description: "Public holiday", organizationId: org.id },
  ];
  for (const h of holidayData) {
    const [existing] = await db.select().from(holidays).where(eq(holidays.name, h.name)).limit(1);
    if (!existing) {
      await db.insert(holidays).values(h);
    }
  }

  // 6. Users and Employees
  console.log("👥 Seeding users and employees...");
  const devPassword = await hashPassword("Password123!");

  const usersList = [
    // Admin
    { userId: "usr_admin_01", email: "admin@dayflow.dev", name: "Alex Vance", role: "admin" as const, empNo: "EMP-1001", deptIdx: 0, desigIdx: 0, locIdx: 0 },
    // HR Users
    { userId: "usr_hr_01", email: "hr1@dayflow.dev", name: "Sarah Jenkins", role: "hr" as const, empNo: "EMP-1002", deptIdx: 2, desigIdx: 5, locIdx: 0 },
    { userId: "usr_hr_02", email: "hr2@dayflow.dev", name: "Michael Chang", role: "hr" as const, empNo: "EMP-1003", deptIdx: 2, desigIdx: 6, locIdx: 1 },
    // Managers
    { userId: "usr_mgr_01", email: "manager1@dayflow.dev", name: "Elena Rostova", role: "manager" as const, empNo: "EMP-1004", deptIdx: 0, desigIdx: 0, locIdx: 0 },
    { userId: "usr_mgr_02", email: "manager2@dayflow.dev", name: "David Miller", role: "manager" as const, empNo: "EMP-1005", deptIdx: 1, desigIdx: 4, locIdx: 1 },
    // Employees (15 staff)
    { userId: "usr_emp_01", email: "emp1@dayflow.dev", name: "James Wilson", role: "employee" as const, empNo: "EMP-1006", deptIdx: 0, desigIdx: 1, locIdx: 0 },
    { userId: "usr_emp_02", email: "emp2@dayflow.dev", name: "Olivia Martinez", role: "employee" as const, empNo: "EMP-1007", deptIdx: 0, desigIdx: 2, locIdx: 0 },
    { userId: "usr_emp_03", email: "emp3@dayflow.dev", name: "Liam Anderson", role: "employee" as const, empNo: "EMP-1008", deptIdx: 0, desigIdx: 1, locIdx: 1 },
    { userId: "usr_emp_04", email: "emp4@dayflow.dev", name: "Sophia Taylor", role: "employee" as const, empNo: "EMP-1009", deptIdx: 1, desigIdx: 3, locIdx: 0 },
    { userId: "usr_emp_05", email: "emp5@dayflow.dev", name: "Lucas Brown", role: "employee" as const, empNo: "EMP-1010", deptIdx: 1, desigIdx: 3, locIdx: 1 },
    { userId: "usr_emp_06", email: "emp6@dayflow.dev", name: "Ava Garcia", role: "employee" as const, empNo: "EMP-1011", deptIdx: 3, desigIdx: 7, locIdx: 0 },
    { userId: "usr_emp_07", email: "emp7@dayflow.dev", name: "Ethan White", role: "employee" as const, empNo: "EMP-1012", deptIdx: 3, desigIdx: 7, locIdx: 1 },
    { userId: "usr_emp_08", email: "emp8@dayflow.dev", name: "Mia Harris", role: "employee" as const, empNo: "EMP-1013", deptIdx: 4, desigIdx: 8, locIdx: 0 },
    { userId: "usr_emp_09", email: "emp9@dayflow.dev", name: "Noah Clark", role: "employee" as const, empNo: "EMP-1014", deptIdx: 4, desigIdx: 8, locIdx: 1 },
    { userId: "usr_emp_10", email: "emp10@dayflow.dev", name: "Isabella Lewis", role: "employee" as const, empNo: "EMP-1015", deptIdx: 0, desigIdx: 2, locIdx: 0 },
    { userId: "usr_emp_11", email: "emp11@dayflow.dev", name: "Benjamin Walker", role: "employee" as const, empNo: "EMP-1016", deptIdx: 0, desigIdx: 1, locIdx: 1 },
    { userId: "usr_emp_12", email: "emp12@dayflow.dev", name: "Charlotte Hall", role: "employee" as const, empNo: "EMP-1017", deptIdx: 1, desigIdx: 3, locIdx: 0 },
    { userId: "usr_emp_13", email: "emp13@dayflow.dev", name: "Henry Young", role: "employee" as const, empNo: "EMP-1018", deptIdx: 0, desigIdx: 2, locIdx: 1 },
    { userId: "usr_emp_14", email: "emp14@dayflow.dev", name: "Amelia King", role: "employee" as const, empNo: "EMP-1019", deptIdx: 2, desigIdx: 5, locIdx: 0 },
    { userId: "usr_emp_15", email: "emp15@dayflow.dev", name: "Daniel Scott", role: "employee" as const, empNo: "EMP-1020", deptIdx: 3, desigIdx: 7, locIdx: 1 },
  ];

  const seededEmployees: { id: number; userId: string; role: string }[] = [];

  for (const u of usersList) {
    // Upsert Auth User
    let [authUser] = await db.select().from(user).where(eq(user.email, u.email)).limit(1);
    if (!authUser) {
      [authUser] = await db
        .insert(user)
        .values({
          id: u.userId,
          name: u.name,
          email: u.email,
          emailVerified: true,
          role: u.role,
        })
        .returning();

      // Create password account
      await db.insert(account).values({
        id: `acc_${u.userId}`,
        userId: authUser.id,
        accountId: u.email,
        providerId: "credential",
        password: devPassword,
      });
    }

    // Upsert Employee Record
    const nameParts = u.name.split(" ");
    let [empRecord] = await db.select().from(employees).where(eq(employees.email, u.email)).limit(1);
    if (!empRecord) {
      [empRecord] = await db
        .insert(employees)
        .values({
          userId: authUser.id,
          organizationId: org.id,
          employeeNumber: u.empNo,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" "),
          email: u.email,
          phoneNumber: "+1 (555) 010-0" + u.empNo.slice(-3),
          departmentId: seededDepts[u.deptIdx]?.id,
          designationId: seededDesigs[u.desigIdx]?.id,
          locationId: seededLocations[u.locIdx]?.id,
          role: u.role,
          employmentStatus: "active",
          employmentType: "full_time",
          joiningDate: new Date("2024-01-15"),
        })
        .returning();
    }
    seededEmployees.push({ id: empRecord.id, userId: authUser.id, role: u.role });
  }

  // 7. Work Schedules
  console.log("⏰ Seeding work schedules for employees...");
  for (const emp of seededEmployees.slice(0, 5)) {
    const [existing] = await db.select().from(workSchedules).where(eq(workSchedules.employeeId, emp.id)).limit(1);
    if (!existing) {
      await db.insert(workSchedules).values({
        employeeId: emp.id,
        scheduleName: "Standard 40h Shift",
        startDate: new Date("2024-01-15"),
      });
    }
  }

  // 8. Leave Types & Allocations
  console.log("🌴 Seeding leave types & allocations...");
  const leaveTypeData = [
    { name: "Paid Leave", description: "Standard annual vacation allowance", defaultDays: 20 },
    { name: "Sick Leave", description: "Medical and personal sick days", defaultDays: 10 },
    { name: "Casual Leave", description: "Short notice urgent personal leave", defaultDays: 5 },
    { name: "Unpaid Leave", description: "Leave without pay", defaultDays: 0 },
  ];
  for (const lt of leaveTypeData) {
    const [existing] = await db.select().from(leaveTypes).where(eq(leaveTypes.name, lt.name)).limit(1);
    if (!existing) {
      await db.insert(leaveTypes).values({
        name: lt.name,
        description: lt.description,
      });
    }
  }

  for (const emp of seededEmployees) {
    for (const lt of leaveTypeData) {
      const [existingAlloc] = await db
        .select()
        .from(leaveAllocations)
        .where(sql`${leaveAllocations.employeeId} = ${emp.id} AND ${leaveAllocations.leaveType} = ${lt.name}`)
        .limit(1);

      if (!existingAlloc) {
        await db.insert(leaveAllocations).values({
          employeeId: emp.id,
          leaveType: lt.name,
          allocatedDays: lt.defaultDays,
          usedDays: Math.floor(Math.random() * 3),
        });
      }
    }
  }

  // 9. Leave Requests
  console.log("📝 Seeding leave requests...");
  const sampleRequests = [
    { empIdx: 5, type: "Paid Leave", days: 3, status: "approved" as const, reason: "Family vacation trip" },
    { empIdx: 6, type: "Sick Leave", days: 1, status: "approved" as const, reason: "Dental procedure" },
    { empIdx: 7, type: "Paid Leave", days: 2, status: "pending" as const, reason: "Attending friend wedding" },
    { empIdx: 8, type: "Casual Leave", days: 1, status: "rejected" as const, reason: "Personal errand", rejection: "Team sprint delivery week" },
    { empIdx: 9, type: "Paid Leave", days: 4, status: "pending" as const, reason: "Summer holiday break" },
  ];
  for (const req of sampleRequests) {
    const emp = seededEmployees[req.empIdx];
    if (emp) {
      const startDate = new Date("2026-08-25");
      const endDate = new Date("2026-08-28");
      await db.insert(leaveRequests).values({
        employeeId: emp.id,
        organizationId: org.id,
        leaveType: req.type,
        startDate,
        endDate,
        days: req.days,
        reason: req.reason,
        status: req.status,
        rejectionReason: req.rejection ?? null,
      });
    }
  }

  // 10. Multi-week Attendance Records
  console.log("⏱️  Seeding attendance history...");
  const daysToSeed = 14;
  const now = new Date();

  for (let i = 0; i < daysToSeed; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    targetDate.setHours(9, 0, 0, 0);

    for (const emp of seededEmployees.slice(0, 10)) {
      const checkIn = new Date(targetDate);
      checkIn.setMinutes(Math.floor(Math.random() * 25)); // 9:00 - 9:25 AM

      const checkOut = new Date(targetDate);
      checkOut.setHours(17, 30 + Math.floor(Math.random() * 30), 0, 0); // 5:30 - 6:00 PM

      await db.insert(attendances).values({
        userId: emp.userId,
        employeeId: emp.id,
        organizationId: org.id,
        date: targetDate,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        workHours: "8.5",
        status: "present",
      });
    }
  }

  // 11. Salary Structures & Payroll
  console.log("💰 Seeding salary structures and payroll periods...");
  let [struct] = await db.select().from(salaryStructures).limit(1);
  if (!struct) {
    [struct] = await db
      .insert(salaryStructures)
      .values({
        name: "Standard Full-Time Engineering",
        description: "Base + HRA + Medical + Performance Allowance",
      })
      .returning();

    await db.insert(salaryComponents).values([
      { name: "Base Salary", description: "Fixed standard compensation" },
      { name: "Housing Allowance (HRA)", description: "Monthly housing assistance" },
      { name: "Medical Insurance", description: "Comprehensive health coverage deduction" },
    ]);
  }

  let [period] = await db.select().from(payrollPeriods).where(eq(payrollPeriods.name, "August 2026")).limit(1);
  if (!period) {
    [period] = await db
      .insert(payrollPeriods)
      .values({
        name: "August 2026",
        description: "Monthly Payroll Cycle - August 2026",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-31"),
        status: "draft",
        organizationId: org.id,
      })
      .returning();

    for (const emp of seededEmployees) {
      await db.insert(payslips).values({
        name: `Payslip - Aug 2026 (${emp.userId})`,
        description: "Monthly salary slip for August 2026",
        employeeId: emp.id,
        organizationId: org.id,
        month: "August",
        year: 2026,
        basicSalary: "7500.00",
        netSalary: "8850.00",
        status: "draft",
      });
    }
  }

  // 12. Notifications & Audit Logs
  console.log("🔔 Seeding notifications & audit events...");
  for (const emp of seededEmployees.slice(0, 5)) {
    await db.insert(notifications).values([
      { userId: emp.id, message: "Welcome to Dayflow HRMS! Complete your profile.", read: 1 },
      { userId: emp.id, message: "Company holiday: Independence Day on July 4th.", read: 0 },
    ]);
  }

  await db.insert(activityLogs).values([
    { action: "SYSTEM_INITIALIZED", description: "Dayflow HRMS seed data populated successfully." },
    { action: "ORGANIZATION_CONFIGURED", description: "Configured Dayflow Technologies organization profile." },
  ]);

  console.log("\n✅ [SEED COMPLETE] Dayflow HRMS Database seeded successfully!");
  console.log("\n=================== DEVELOPMENT CREDENTIALS ===================");
  console.log("All accounts share password:  Password123!");
  console.log("---------------------------------------------------------------");
  console.log("👑 Super Admin:  admin@dayflow.dev       (Alex Vance)");
  console.log("👔 HR Admin 1:   hr1@dayflow.dev         (Sarah Jenkins)");
  console.log("👔 HR Admin 2:   hr2@dayflow.dev         (Michael Chang)");
  console.log("💼 Manager 1:    manager1@dayflow.dev    (Elena Rostova)");
  console.log("💼 Manager 2:    manager2@dayflow.dev    (David Miller)");
  console.log("👨‍💻 Employee 1:   emp1@dayflow.dev        (James Wilson)");
  console.log("👩‍💻 Employee 2:   emp2@dayflow.dev        (Olivia Martinez)");
  console.log("... and emp3@dayflow.dev through emp15@dayflow.dev");
  console.log("===============================================================\n");
}

main()
  .catch((err) => {
    console.error("❌ Seed execution failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
