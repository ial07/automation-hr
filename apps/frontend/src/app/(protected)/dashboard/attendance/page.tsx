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
import { Separator } from "@/components/ui/separator";

function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center py-6">
      <div className="text-5xl font-bold tracking-tight">
        {time.toLocaleTimeString("id-ID", { hour12: false })}
      </div>
      <div className="text-muted-foreground mt-1">
        {time.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Absensi Karyawan</h1>
          <p className="text-muted-foreground">
            Check-in dan check-out harian Anda
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Attendance Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Status Hari Ini</CardTitle>
            <CardDescription>Jadwal Masuk: 07:30 WIB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DigitalClock />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Status Display */}
            {hasCheckedIn && (
              <div className="flex justify-center mb-4">
                <Badge
                  variant="outline"
                  className={`text-lg px-4 py-1 ${
                    ATTENDANCE_COLORS[data.today!.status]
                  }`}
                >
                  {ATTENDANCE_STATUS[data.today!.status]}
                </Badge>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              {!hasCheckedIn && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan (opsional)</Label>
                    <Input
                      id="notes"
                      placeholder="Contoh: Meeting di luar kantor"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wfh"
                      checked={isWfh}
                      onCheckedChange={(c) => setIsWfh(c === true)}
                    />
                    <Label htmlFor="wfh">Work From Home (WFH)</Label>
                  </div>
                  <Button
                    className="w-full h-12 text-lg"
                    onClick={handleCheckIn}
                    disabled={actionMutation.isPending}
                  >
                    {actionMutation.isPending ? "Memproses..." : "CHECK IN"}
                  </Button>
                </>
              )}

              {hasCheckedIn && !hasCheckedOut && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="notes-out">
                      Catatan Check-out (opsional)
                    </Label>
                    <Input
                      id="notes-out"
                      placeholder="Contoh: Pulang cepat karena sakit"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full h-12 text-lg"
                    onClick={handleCheckOut}
                    disabled={actionMutation.isPending}
                  >
                    {actionMutation.isPending ? "Memproses..." : "CHECK OUT"}
                  </Button>
                </>
              )}

              {hasCheckedIn && hasCheckedOut && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="font-semibold">
                    Anda sudah menyelesaikan absensi hari ini.
                  </p>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div>
                      Masuk:{" "}
                      {new Date(data.today!.check_in_time!).toLocaleTimeString(
                        "id-ID"
                      )}
                    </div>
                    <div>
                      Pulang:{" "}
                      {new Date(data.today!.check_out_time!).toLocaleTimeString(
                        "id-ID"
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Riwayat Absensi</CardTitle>
            <CardDescription>30 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Memuat...</p>
            ) : data?.history && data.history.length > 0 ? (
              <div className="space-y-4">
                {data.history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <div className="font-medium">
                        {new Date(record.date).toLocaleDateString("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.check_in_time!).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                        {" - "}
                        {record.check_out_time
                          ? new Date(record.check_out_time).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : "-"}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={ATTENDANCE_COLORS[record.status]}
                    >
                      {ATTENDANCE_STATUS[record.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Belum ada riwayat absensi.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
