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
import { Clock, CalendarDays, Timer, MessageSquare, ShieldCheck, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const { data: user, isLoading } = useUser();
  const { data: attendanceData } = useAttendance();
  const { data: leaveData } = useLeaveRequests();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const todayAttendance = attendanceData?.today;
  const leaveBalance = leaveData?.balance;

  return (
    <div className="space-y-8 pb-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-indigo-500 text-primary-foreground p-8 sm:p-10 shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Selamat datang, {user?.fullName || user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl">
            Berikut adalah ringkasan aktivitas dan status kerja Anda hari ini.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Attendance Status */}
        <Card className="relative overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Absensi Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance ? (
              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${todayAttendance.status === 'present' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${todayAttendance.status === 'present' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  </div>
                  <span className="font-semibold text-lg">{ATTENDANCE_STATUS[todayAttendance.status]}</span>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Waktu Masuk</p>
                  <p className="font-mono text-xl">
                    {todayAttendance.check_in_time
                      ? new Date(todayAttendance.check_in_time).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })
                      : "--:--"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <span className="font-semibold text-lg text-muted-foreground">Belum Check-in</span>
                </div>
                <Button asChild className="w-full shadow-sm">
                  <Link href="/dashboard/attendance">Lakukan Check In</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Balance */}
        <Card className="relative overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CalendarDays className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              Saldo Cuti Tahunan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaveBalance ? (
              <div className="mt-2 flex items-end gap-2">
                <div className="text-5xl font-bold tracking-tighter text-foreground">
                  {leaveBalance.annual_total - leaveBalance.annual_used}
                </div>
                <div className="text-sm text-muted-foreground mb-1 pb-1">
                  / {leaveBalance.annual_total} hari
                </div>
              </div>
            ) : (
              <div className="mt-2 h-12 flex items-center text-muted-foreground">Memuat...</div>
            )}
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button asChild variant="ghost" size="sm" className="w-full justify-between text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                <Link href="/dashboard/leave">
                  Ajukan Cuti <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Role Card */}
        <Card className="relative overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Tingkat Akses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <Badge variant="outline" className="text-lg px-4 py-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 font-semibold">
                {user ? ROLE_LABELS[user.role] : "Unknown"}
              </Badge>
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              Akses sistem dikonfigurasi berdasarkan peran Anda di perusahaan.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/attendance" className="group p-4 bg-card border border-border/50 rounded-xl hover:border-primary/50 hover:shadow-md transition-all text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-500 dark:bg-blue-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div className="font-medium text-sm">Absensi</div>
          </Link>
          
          <Link href="/dashboard/leave" className="group p-4 bg-card border border-border/50 rounded-xl hover:border-primary/50 hover:shadow-md transition-all text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div className="font-medium text-sm">Pengajuan Cuti</div>
          </Link>
          
          <Link href="/dashboard/overtime" className="group p-4 bg-card border border-border/50 rounded-xl hover:border-primary/50 hover:shadow-md transition-all text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-500 dark:bg-amber-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Timer className="w-6 h-6" />
            </div>
            <div className="font-medium text-sm">Lembur</div>
          </Link>
          
          <Link href="/dashboard/chat" className="group p-4 bg-card border border-border/50 rounded-xl hover:border-primary/50 hover:shadow-md transition-all text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-purple-50 text-purple-500 dark:bg-purple-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="font-medium text-sm">Asisten AI</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
