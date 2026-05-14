"use client";

import { useState, useEffect } from "react";
import { hasMinimumRole, UserRole } from "@/lib/auth/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileText } from "lucide-react";

type Employee = {
  id: string;
  full_name: string;
  email: string;
  isSelf?: boolean;
};

const MONTHS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export default function PayrollPage() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  const canSelectEmployee = userRole && hasMinimumRole(userRole, "hr");
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1];

  // Fetch current user role
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`);
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
        }
      } catch {
        // Ignore
      }
    }
    fetchUser();
  }, []);

  // Fetch employees list
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payroll/employees`);
        const data = await res.json();
        setEmployees(data.employees || []);

        // Auto-select self for non-HR users
        if (data.employees?.length === 1 && data.employees[0].isSelf) {
          setSelectedEmployee(data.employees[0].id);
        }
      } catch {
        setError("Gagal memuat daftar karyawan");
      } finally {
        setIsLoadingEmployees(false);
      }
    }
    fetchEmployees();
  }, []);

  const handleDownload = async () => {
    if (!selectedMonth || !selectedYear) {
      setError("Pilih bulan dan tahun terlebih dahulu");
      return;
    }

    if (canSelectEmployee && !selectedEmployee) {
      setError("Pilih karyawan terlebih dahulu");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const employeeId = canSelectEmployee ? selectedEmployee : "";
      const url = `/api/payroll/download?month=${selectedMonth}&year=${selectedYear}${
        employeeId ? `&employeeId=${employeeId}` : ""
      }`;

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal mengunduh slip gaji");
      }

      // Get blob and download
      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || "payroll.pdf";

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Slip Gaji</h1>
        <p className="text-muted-foreground">
          Download slip gaji dalam format PDF
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Download Slip Gaji
          </CardTitle>
          <CardDescription>
            {canSelectEmployee
              ? "Pilih karyawan dan periode untuk mengunduh slip gaji"
              : "Pilih periode untuk mengunduh slip gaji Anda"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Employee Selection (HR/Owner only) */}
            {canSelectEmployee && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Karyawan</label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                  disabled={isLoadingEmployees}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name || emp.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Month Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bulan</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tahun</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={
              isLoading ||
              !selectedMonth ||
              !selectedYear ||
              (!!canSelectEmployee && !selectedEmployee)
            }
            className="w-full md:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? "Mengunduh..." : "Download PDF"}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Catatan:</strong> Slip gaji ini berisi informasi gaji pokok,
            tunjangan, dan lembur.
            {!canSelectEmployee &&
              " Anda hanya dapat mengunduh slip gaji milik Anda sendiri."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
