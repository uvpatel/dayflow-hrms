import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { PayrollPeriod } from "@/db/schema/payroll-periods";
import type { Payslip } from "@/db/schema/payslips";
import type { SalaryStructure } from "@/db/schema/salary-structures";

export const payrollKeys = {
  all: ["payroll"] as const,
  periods: (params?: { limit?: number; offset?: number }) => [...payrollKeys.all, "periods", params] as const,
  structures: () => [...payrollKeys.all, "structures"] as const,
  payslips: (params?: { limit?: number; offset?: number; search?: string }) => [...payrollKeys.all, "payslips", params] as const,
  myPayslips: () => [...payrollKeys.all, "me", "payslips"] as const,
};

export function usePayrollPeriods(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: payrollKeys.periods(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());

      const qs = searchParams.toString();
      const res = await apiClient<{ items: PayrollPeriod[]; total: number }>(
        `/api/v1/payroll/periods${qs ? `?${qs}` : ""}`
      );
      return res.data ?? { items: [], total: 0 };
    },
  });
}

export function useSalaryStructures() {
  return useQuery({
    queryKey: payrollKeys.structures(),
    queryFn: async () => {
      const res = await apiClient<SalaryStructure[]>("/api/v1/salary-structures");
      return res.data ?? [];
    },
  });
}

export function usePayslips(params?: { limit?: number; offset?: number; search?: string }) {
  return useQuery({
    queryKey: payrollKeys.payslips(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      if (params?.search) searchParams.set("search", params.search);

      const qs = searchParams.toString();
      const res = await apiClient<{ items: Payslip[]; total: number }>(
        `/api/v1/payroll/payslips${qs ? `?${qs}` : ""}`
      );
      return res.data ?? { items: [], total: 0 };
    },
  });
}

export function useMyPayslips() {
  return useQuery({
    queryKey: payrollKeys.myPayslips(),
    queryFn: async () => {
      const res = await apiClient<Payslip[]>("/api/v1/me/payslips");
      return res.data ?? [];
    },
  });
}

export function useCreatePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const res = await apiClient<PayrollPeriod>("/api/v1/payroll/periods", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.periods() });
    },
  });
}

export function useCalculatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (periodId: number) => {
      const res = await apiClient<{ message: string }>(`/api/v1/payroll/periods/${periodId}/calculate`, {
        method: "POST",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
}

export function useFinalizePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (periodId: number) => {
      const res = await apiClient<{ message: string }>(`/api/v1/payroll/periods/${periodId}/finalize`, {
        method: "POST",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
}
