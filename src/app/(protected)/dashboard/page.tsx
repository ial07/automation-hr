"use client";

import { useUser } from "@/hooks/useUser";
import { useAttendance } from "@/hooks/useAttendance";
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
import { Badge } from "@/components/ui/badge";
import { ATTENDANCE_STATUS, ATTENDANCE_COLORS } from "@/types/attendance";

export default function DashboardPage() {
  const { data: user, isLoading } = useUser();
  const { data: attendanceData } = useAttendance();
  const { data: leaveData } = useLeaveRequests();

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  const todayAttendance = attendanceData?.today;
  const leaveBalance = leaveData?.balance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang, {user?.fullName || user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Attendance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Absensi Hari Ini</CardTitle>
            <CardDescription>Status kehadiran Anda</CardDescription>
          </CardHeader>
          <CardContent>
            {todayAttendance ? (
              <div className="space-y-2">
                <Badge className={ATTENDANCE_COLORS[todayAttendance.status]}>
                  {ATTENDANCE_STATUS[todayAttendance.status]}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Masuk:{" "}
                  {todayAttendance.check_in_time
                    ? new Date(
                        todayAttendance.check_in_time
                      ).toLocaleTimeString("id-ID")
                    : "-"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground">Belum check-in</p>
                <Button asChild size="sm">
                  <Link href="/dashboard/attendance">Check In</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Balance */}
        <Card>
          <CardHeader>
            <CardTitle>Saldo Cuti</CardTitle>
            <CardDescription>Cuti tahunan tersisa</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveBalance ? (
              <div className="space-y-1">
                <p className="text-3xl font-bold">
                  {leaveBalance.annual_total - leaveBalance.annual_used}
                </p>
                <p className="text-sm text-muted-foreground">
                  dari {leaveBalance.annual_total} hari
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Memuat...</p>
            )}
          </CardContent>
        </Card>

        {/* Role Card */}
        <Card>
          <CardHeader>
            <CardTitle>Role Anda</CardTitle>
            <CardDescription>Tingkat akses saat ini</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {user ? ROLE_LABELS[user.role] : "Unknown"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button asChild variant="outline">
            <Link href="/dashboard/attendance">Absensi</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/leave">Pengajuan Cuti</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/overtime">Pengajuan Lembur</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/chat">Asisten HR</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
