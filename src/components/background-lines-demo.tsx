import React from "react";
import { BackgroundLines } from "@/components/ui/background-lines";
import HoverBorderGradientDemo from "./hover-border-gradient-demo";
import Link from "next/link"

export default function BackgroundLinesDemo() {
  return (
    <BackgroundLines className="flex items-center justify-center w-full flex-col px-4">
      <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
        Dayflow HRMS, <br /> 
      </h2>
      <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center">
        Dayflow is a Human Resource Management System (HRMS) designed to streamline and optimize HR processes within organizations. It provides a comprehensive.
      </p>
      <HoverBorderGradientDemo />
    </BackgroundLines>
  );
}
