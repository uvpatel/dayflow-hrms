import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getPaginatedData } from "@/lib/api/client";
import type { PayrollPeriod } from "@/db/schema/payroll-periods";
import type { Payslip } from "@/db/schema/payslips";
import type { SalaryStructure } from "@/db/schema/salary-structures";
import { payrollKeys } from "@/lib/query-keys";

export { payrollKeys } from "@/lib/query-keys";

export function usePayrollPeriods(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: payrollKeys.periods(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());

      const qs = searchParams.toString();
      const res = await apiClient<
        PayrollPeriod[] | { items: PayrollPeriod[]; total: number }
      >(
        `/api/v1/payroll/periods${qs ? `?${qs}` : ""}`
      );
      return getPaginatedData(res);
    },
  });
}

export function useSalaryStructures() {
  return useQuery({
    queryKey: payrollKeys.structures(),
    queryFn: async () => {
      const res = await apiClient<
        SalaryStructure[] | { items: SalaryStructure[]; total: number }
      >("/api/v1/salary-structures");
      return getPaginatedData(res).items;
    },
  });
}

export function useCreateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const response = await apiClient<SalaryStructure>("/api/v1/salary-structures", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.structures() });
    },
  });
}

export function useUpdateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: number;
      name?: string;
      description?: string;
    }) => {
      const response = await apiClient<SalaryStructure>(
        `/api/v1/salary-structures/${id}`,
        { method: "PATCH", body: JSON.stringify(payload) },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.structures() });
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
      const res = await apiClient<Payslip[] | { items: Payslip[]; total: number }>(
        `/api/v1/payroll/payslips${qs ? `?${qs}` : ""}`
      );
      return getPaginatedData(res);
    },
  });
}

export function useCreatePayslip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      employeeId: number;
      payrollPeriodId: number;
      grossSalary: string;
      deductions?: string;
      basicSalary?: string;
    }) => {
      const response = await apiClient<Payslip>("/api/v1/payroll/payslips", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
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
    mutationFn: async (payload: {
      name: string;
      description?: string;
      startDate?: string;
      endDate?: string;
    }) => {
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

export function usePublishPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (periodId: number) => {
      const response = await apiClient<{ message: string }>(
        `/api/v1/payroll/periods/${periodId}/publish`,
        { method: "POST" },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
}
