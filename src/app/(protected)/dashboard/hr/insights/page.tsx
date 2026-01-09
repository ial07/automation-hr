"use client";

import { useHRInsights } from "@/hooks/useHRInsights";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SIGNAL_COLORS = {
  needs_attention: "bg-red-100 text-red-800 border-red-200",
  monitor: "bg-yellow-100 text-yellow-800 border-yellow-200",
  stable: "bg-green-100 text-green-800 border-green-200",
};

const SIGNAL_LABELS = {
  needs_attention: "Perlu Perhatian",
  monitor: "Monitor",
  stable: "Stabil",
};

export default function HRInsightsPage() {
  const { data, isLoading, error } = useHRInsights();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat HR Insights...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500">
        Gagal memuat data insights.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">HR Insights</h1>
        <p className="text-muted-foreground">
          Ringkasan dan analisis data HR periode {data.period}
        </p>
      </div>

      {/* AI Summary */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>🤖</span> Ringkasan AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{data.aiSummary}</p>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Karyawan</CardDescription>
            <CardTitle className="text-3xl">
              {data.summary.totalEmployees}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Record Kehadiran</CardDescription>
            <CardTitle className="text-3xl">
              {data.summary.attendanceRecords}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliance Rate</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {data.attendance.complianceRate}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Lembur</CardDescription>
            <CardTitle className="text-3xl">
              {data.overtime.totalHours} jam
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Insight Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Insight Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.insightCards.map((card) => (
            <Card
              key={card.id}
              className={`border-2 ${SIGNAL_COLORS[card.signal]}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <Badge className={SIGNAL_COLORS[card.signal]}>
                    {SIGNAL_LABELS[card.signal]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-2">{card.description}</p>
                <p className="text-2xl font-bold">{card.metric}</p>
                {card.affectedEmployees &&
                  card.affectedEmployees.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Karyawan terkait: {card.affectedEmployees.join(", ")}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Kehadiran</CardTitle>
            <CardDescription>Ringkasan 30 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Hadir Tepat Waktu</span>
              <span className="font-semibold text-green-600">
                {data.attendance.totalPresent}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Terlambat</span>
              <span className="font-semibold text-yellow-600">
                {data.attendance.totalLate}
              </span>
            </div>
            <div className="flex justify-between">
              <span>WFH</span>
              <span className="font-semibold">{data.attendance.totalWfh}</span>
            </div>
            <div className="flex justify-between">
              <span>Cuti</span>
              <span className="font-semibold">
                {data.attendance.totalLeave}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Leave */}
        <Card>
          <CardHeader>
            <CardTitle>Cuti</CardTitle>
            <CardDescription>Status pengajuan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Pending</span>
              <Badge variant="outline">{data.leave.pendingRequests}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Disetujui</span>
              <Badge className="bg-green-100 text-green-800">
                {data.leave.approvedThisMonth}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Ditolak</span>
              <Badge className="bg-red-100 text-red-800">
                {data.leave.rejectedThisMonth}
              </Badge>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span>Total Hari Cuti</span>
              <span className="font-semibold">
                {data.leave.totalDaysTaken} hari
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Overtime */}
        <Card>
          <CardHeader>
            <CardTitle>Lembur</CardTitle>
            <CardDescription>Status pengajuan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Pending</span>
              <Badge variant="outline">{data.overtime.pendingRequests}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Disetujui</span>
              <Badge className="bg-green-100 text-green-800">
                {data.overtime.approvedRequests}
              </Badge>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span>Total Jam</span>
              <span className="font-semibold">
                {data.overtime.totalHours} jam
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attention Flags */}
      {data.flags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Indikator Perhatian</CardTitle>
            <CardDescription>
              Pola yang memerlukan perhatian (hanya indikator, bukan penilaian)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.flags.map((flag, idx) => (
              <Alert
                key={idx}
                variant={flag.severity === "high" ? "destructive" : "default"}
              >
                <AlertTitle className="flex items-center gap-2">
                  <span>{flag.employeeName}</span>
                  <Badge variant="outline" className="text-xs">
                    {flag.severity === "high" ? "Tinggi" : "Sedang"}
                  </Badge>
                </AlertTitle>
                <AlertDescription>{flag.description}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
