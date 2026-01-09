"use client";

import { useUser } from "@/hooks/useUser";
import { useLeaveRequests } from "@/hooks/useLeave";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/auth/roles";

export default function EmployeePage() {
  const { data: user, isLoading } = useUser();
  const { data: leaveData } = useLeaveRequests();

  if (isLoading) {
    return <div className="p-8">Loading profile...</div>;
  }

  const balance = leaveData?.balance;
  const pendingRequests =
    leaveData?.requests?.filter(
      (r) => r.status === "submitted" || r.status === "approved_manager"
    ).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Informasi dan permintaan Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
            <CardDescription>Data akun Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nama Lengkap
              </label>
              <p className="text-lg">{user?.fullName || "Belum diatur"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-lg">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Role
              </label>
              <p className="text-lg">{user ? ROLE_LABELS[user.role] : "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saldo Cuti</CardTitle>
            <CardDescription>Cuti tahunan Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {balance ? (
              <>
                <div className="flex justify-between">
                  <span>Cuti Tahunan</span>
                  <span className="font-semibold">
                    {balance.annual_total - balance.annual_used} /{" "}
                    {balance.annual_total} hari
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cuti Sakit</span>
                  <span className="font-semibold">
                    {balance.sick_total - balance.sick_used} /{" "}
                    {balance.sick_total} hari
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Memuat...</p>
            )}
            <Button asChild className="w-full">
              <Link href="/dashboard/leave">Ajukan Cuti</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permintaan Aktif</CardTitle>
          <CardDescription>Status permintaan Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests > 0 ? (
            <p className="text-lg">
              Anda memiliki{" "}
              <span className="font-semibold">{pendingRequests}</span>{" "}
              permintaan yang sedang diproses.
            </p>
          ) : (
            <p className="text-muted-foreground">Tidak ada permintaan aktif.</p>
          )}
          <div className="flex gap-3 mt-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/leave">Lihat Cuti</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/overtime">Lihat Lembur</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
