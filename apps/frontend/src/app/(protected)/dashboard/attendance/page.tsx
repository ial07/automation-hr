"use client";

import { useState, useEffect } from "react";
import { useAttendance, useAttendanceAction } from "@/hooks/useAttendance";
import { ATTENDANCE_STATUS, ATTENDANCE_COLORS } from "@/types/attendance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Home } from "lucide-react";

function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center py-6">
      <div className="relative flex items-center justify-center w-48 h-48 rounded-full bg-gradient-to-tr from-primary to-indigo-300 p-1 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-indigo-300 rounded-full blur-md opacity-50"></div>
        <div className="relative flex flex-col items-center justify-center w-full h-full bg-background rounded-full">
          <div className="text-4xl font-bold tracking-tight text-foreground">
            {time.toLocaleTimeString("id-ID", { hour12: false })}
          </div>
          <div className="text-sm font-medium text-muted-foreground mt-1 text-center px-4">
            {time.toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { data, isLoading, refetch } = useAttendance();
  const actionMutation = useAttendanceAction();

  const [notes, setNotes] = useState("");
  const [isWfh, setIsWfh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckIn = async () => {
    setError(null);
    try {
      await actionMutation.mutateAsync({
        action: "check-in",
        notes: notes || undefined,
        is_wfh: isWfh,
      });
      setNotes("");
      setIsWfh(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melakukan check-in");
    }
  };

  const handleCheckOut = async () => {
    setError(null);
    try {
      await actionMutation.mutateAsync({
        action: "check-out",
        notes: notes || undefined,
      });
      setNotes("");
      refetch();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal melakukan check-out"
      );
    }
  };

  // Determine state
  const hasCheckedIn = !!data?.today;
  const hasCheckedOut = !!data?.today?.check_out_time;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Absensi Karyawan</h1>
          <p className="text-muted-foreground mt-1">
            Catat kehadiran Anda hari ini
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="shadow-sm">
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
        {/* Attendance Card */}
        <Card className="w-full md:col-span-5 shadow-md border-primary/10">
          <CardHeader className="text-center pb-2">
            <CardTitle>Status Hari Ini</CardTitle>
            <CardDescription>Jadwal Masuk: 07:30 WIB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DigitalClock />

            {error && (
              <Alert variant="destructive" className="bg-destructive/10">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Status Display */}
            {hasCheckedIn && (
              <div className="flex justify-center mb-2">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${ATTENDANCE_COLORS[data.today!.status]} bg-background shadow-sm`}>
                  <div className="relative flex h-3 w-3">
                    {!hasCheckedOut && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data.today!.status === 'present' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${data.today!.status === 'present' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  </div>
                  <span className="font-semibold text-sm">
                    {ATTENDANCE_STATUS[data.today!.status]}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-5 bg-muted/30 p-5 rounded-2xl border border-border/50">
              {!hasCheckedIn && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-xs font-semibold uppercase text-muted-foreground">Catatan (opsional)</Label>
                    <Input
                      id="notes"
                      placeholder="Contoh: Meeting di luar kantor"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-background rounded-lg border border-border">
                    <Checkbox
                      id="wfh"
                      checked={isWfh}
                      onCheckedChange={(c) => setIsWfh(c === true)}
                    />
                    <Label htmlFor="wfh" className="flex items-center gap-2 cursor-pointer">
                      <Home className="w-4 h-4 text-muted-foreground" />
                      Work From Home (WFH)
                    </Label>
                  </div>
                  <Button
                    className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 transition-all"
                    onClick={handleCheckIn}
                    disabled={actionMutation.isPending}
                  >
                    {actionMutation.isPending ? "Memproses..." : "CHECK IN SEKARANG"}
                  </Button>
                </>
              )}

              {hasCheckedIn && !hasCheckedOut && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="notes-out" className="text-xs font-semibold uppercase text-muted-foreground">
                      Catatan Check-out (opsional)
                    </Label>
                    <Input
                      id="notes-out"
                      placeholder="Contoh: Pulang cepat karena sakit"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <Button
                    className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-destructive/25 bg-gradient-to-r from-destructive to-rose-500 hover:from-destructive/90 hover:to-rose-500/90 transition-all text-white"
                    onClick={handleCheckOut}
                    disabled={actionMutation.isPending}
                  >
                    {actionMutation.isPending ? "Memproses..." : "CHECK OUT SEKARANG"}
                  </Button>
                </>
              )}

              {hasCheckedIn && hasCheckedOut && (
                <div className="text-center p-5 bg-background rounded-xl border border-border shadow-sm flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  <div>
                    <p className="font-bold text-foreground">
                      Absensi Hari Ini Selesai
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Terima kasih atas kerja keras Anda!
                    </p>
                  </div>
                  <div className="flex gap-4 mt-2 w-full justify-center">
                    <div className="bg-muted p-2 rounded-lg text-center flex-1">
                      <div className="text-xs text-muted-foreground mb-1">Masuk</div>
                      <div className="font-mono font-semibold">
                        {new Date(data.today!.check_in_time!).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="bg-muted p-2 rounded-lg text-center flex-1">
                      <div className="text-xs text-muted-foreground mb-1">Pulang</div>
                      <div className="font-mono font-semibold">
                        {new Date(data.today!.check_out_time!).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <Card className="h-full md:col-span-7 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Riwayat Absensi
            </CardTitle>
            <CardDescription>30 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : data?.history && data.history.length > 0 ? (
              <div className="space-y-3">
                {data.history.map((record) => {
                  // Determine left border color based on status
                  let borderLeftColor = "border-l-slate-300";
                  if (record.status === "present") borderLeftColor = "border-l-emerald-500";
                  else if (record.status === "late") borderLeftColor = "border-l-amber-500";
                  else if (record.status === "absent") borderLeftColor = "border-l-rose-500";

                  return (
                    <div
                      key={record.id}
                      className={`flex items-center justify-between p-4 bg-muted/30 border border-border/50 rounded-lg border-l-4 ${borderLeftColor} hover:bg-muted/50 transition-colors`}
                    >
                      <div>
                        <div className="font-semibold text-foreground">
                          {new Date(record.date).toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono mt-1 flex items-center gap-2">
                          <span className="bg-background px-2 py-0.5 rounded border">
                            {new Date(record.check_in_time!).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span>→</span>
                          <span className="bg-background px-2 py-0.5 rounded border">
                            {record.check_out_time
                              ? new Date(record.check_out_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                              : "--:--"}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${ATTENDANCE_COLORS[record.status]} font-medium`}
                      >
                        {ATTENDANCE_STATUS[record.status]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>Belum ada riwayat absensi.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
