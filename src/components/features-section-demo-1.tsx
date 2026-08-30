import React from "react";
import { useId } from "react";

const DEFAULT_GRID_PATTERN = [
  [8, 1],
  [10, 3],
  [7, 5],
  [9, 2],
  [10, 6],
];

export default function FeaturesSectionDemo() {
  return (
    <div className="py-20 lg:py-40">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 md:gap-2 max-w-7xl mx-auto">
        {grid.map((feature) => (
          <div
            key={feature.title}
            className="relative bg-gradient-to-b dark:from-neutral-900 from-neutral-100 dark:to-neutral-950 to-white p-6 rounded-3xl overflow-hidden"
          >
            <Grid size={20} />
            <p className="text-base font-bold text-neutral-800 dark:text-white relative z-20">
              {feature.title}
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4 text-base font-normal relative z-20">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const grid = [
  {
    title: "Secure Authentication & Role-Based Access",
    description:
      "Protect employee information with secure sign-in, email verification, GitHub authentication, and Admin, HR, or User access enforced by the server.",
  },
  {
    title: "Employee Profile Management",
    description:
      "Manage personal details, job information, departments, designations, reporting managers, documents, profile pictures, and employment records from one place.",
  },
  {
    title: "Smart Attendance Tracking",
    description:
      "Allow employees to check in and check out while automatically tracking working hours, late arrivals, half-days, absences, overtime, and attendance corrections.",
  },
  {
    title: "Leave & Time-Off Management",
    description:
      "Let employees check leave balances, request paid, sick, or unpaid leave, track request status, and receive immediate updates when requests are reviewed.",
  },
  {
    title: "Approval Workflows",
    description:
      "Give managers and HR officers a centralized workspace to review, approve, or reject leave requests and attendance corrections with comments and complete approval history.",
  },
  {
    title: "Payroll & Payslip Management",
    description:
      "Manage salary structures, allowances, deductions, payroll cycles, and payslips while giving employees secure, read-only access to their salary information.",
  },
  {
    title: "Organization & Team Management",
    description:
      "Organize employees by department, designation, office location, work schedule, and reporting manager while providing managers with a complete view of their teams.",
  },
  {
    title: "HR Analytics & Reports",
    description:
      "Monitor employee headcount, attendance trends, leave usage, payroll summaries, department distribution, and pending approvals through real-time dashboards and reports.",
  },
];

export const Grid = ({
  pattern,
  size,
}: {
  pattern?: number[][];
  size?: number;
}) => {
  const p = pattern ?? DEFAULT_GRID_PATTERN;
  return (
    <div className="pointer-events-none absolute left-1/2 top-0  -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r  [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-zinc-900/30 from-zinc-100/30 to-zinc-300/30 dark:to-zinc-900/30 opacity-100">
        <GridPattern
          width={size ?? 20}
          height={size ?? 20}
          x="-12"
          y="4"
          squares={p}
          className="absolute inset-0 h-full w-full  mix-blend-overlay dark:fill-white/10 dark:stroke-white/10 stroke-black/10 fill-black/10"
        />
      </div>
    </div>
  );
};

type GridPatternProps = React.ComponentPropsWithoutRef<"svg"> & {
  width: number;
  height: number;
  x: number | string;
  y: number | string;
  squares?: number[][];
};

export function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: GridPatternProps) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([squareX, squareY]) => (
            <rect
              strokeWidth="0"
              key={`${squareX}-${squareY}`}
              width={width + 1}
              height={height + 1}
              x={squareX * width}
              y={squareY * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
